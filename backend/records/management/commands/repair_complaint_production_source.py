"""Repair the dealer complaint query without changing the shared BI view."""
import re
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

BROKEN_SOURCE = '[WST\\WST].[oknastyle_biV2].[dbo].[Документы.ОтчетПроизводстваЗаСмену.Продукция] AS RP2'
RAW_SOURCE = '[WST\\WST].[oknastyle].[dbo].[_Document488_VT10534] AS RP2'
REPLACEMENTS = {
    BROKEN_SOURCE: RAW_SOURCE,
    'RP2.Количество': 'RP2._Fld10543',
    'RP2.Заказ': 'RP2._Fld10540_RRRef',
    'RP2.Ссылка': 'RP2._Document488_IDRRef',
}


def repair_definition(definition):
    for before in REPLACEMENTS:
        if definition.count(before) != 1:
            raise ValueError('Unexpected complaint production query; repair aborted')
    for before, after in REPLACEMENTS.items():
        definition = definition.replace(before, after)
    definition, count = re.subn(r'\A\s*CREATE\s+PROC(?:EDURE)?\b', 'ALTER PROCEDURE', definition, count=1, flags=re.I)
    if not count and not re.match(r'\A\s*ALTER\s+PROC(?:EDURE)?\b', definition, re.I):
        raise ValueError('Unexpected procedure header')
    return definition


class Command(BaseCommand):
    help = 'Repair GetComplaintsFull production source; dry run unless --apply.'

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true')
        parser.add_argument('--backup-dir')

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            cursor.execute("SELECT definition,uses_ansi_nulls,uses_quoted_identifier FROM sys.sql_modules WHERE object_id=OBJECT_ID('dbo.GetComplaintsFull')")
            original, ansi, quoted = cursor.fetchone()
        if BROKEN_SOURCE not in original:
            self.stdout.write('No repair required')
            return
        repaired = repair_definition(original)
        self.stdout.write('GetComplaintsFull: verified raw production field mapping')
        if not options['apply']:
            return
        if not options['backup_dir']:
            raise CommandError('--backup-dir is required')
        backup = Path(options['backup_dir']).resolve()
        backup.mkdir(parents=True, exist_ok=True)
        with (backup / 'dbo.GetComplaintsFull.sql').open('x', encoding='utf-8') as f:
            f.write(original)
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute('SET ANSI_NULLS ' + ('ON' if ansi else 'OFF'))
                cursor.execute('SET QUOTED_IDENTIFIER ' + ('ON' if quoted else 'OFF'))
                cursor.execute(repaired)
        self.stdout.write(self.style.SUCCESS(f'Complaint production source repaired; backup: {backup}'))
