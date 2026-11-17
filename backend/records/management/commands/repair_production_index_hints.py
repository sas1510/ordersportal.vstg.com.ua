"""Deploy the verified production-order index hint repair, with SQL backups."""
import re
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from records.order_sql_compat import PRODUCTION_INDEX, PRODUCTION_STANDARD_INDEX


def alter_definition(definition):
    if PRODUCTION_INDEX not in definition:
        raise ValueError('Missing expected index hint')
    definition = re.sub(r'\A(?:\s+|--[^\n]*(?:\n|$)|/\*.*?\*/)*', '', definition, flags=re.S)
    updated, count = re.subn(r'\A(\s*)CREATE\s+(?:OR\s+ALTER\s+)?PROC(?:EDURE)?\b', r'\1ALTER PROCEDURE', definition, count=1, flags=re.I)
    if not count and not re.match(r'\A\s*ALTER\s+PROC(?:EDURE)?\b', definition, re.I):
        raise ValueError('Unexpected procedure definition')
    return updated.replace(PRODUCTION_INDEX, PRODUCTION_STANDARD_INDEX)


class Command(BaseCommand):
    help = 'Repair obsolete production index hints (dry run unless --apply).'

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true')
        parser.add_argument('--backup-dir')

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            cursor.execute("SELECT i.name FROM [WST\\WST].[oknastyle].sys.indexes i JOIN [WST\\WST].[oknastyle].sys.tables t ON i.object_id=t.object_id WHERE t.name=%s AND i.name=%s AND i.is_disabled=0", ['_Document488_VT10534', PRODUCTION_STANDARD_INDEX])
            if not cursor.fetchone():
                raise CommandError('Replacement index is missing or disabled')
            cursor.execute("SELECT s.name,o.name,m.definition,m.uses_ansi_nulls,m.uses_quoted_identifier FROM sys.sql_modules m JOIN sys.objects o ON o.object_id=m.object_id JOIN sys.schemas s ON s.schema_id=o.schema_id WHERE o.type='P' AND m.definition LIKE %s", ['%' + PRODUCTION_INDEX + '%'])
            procedures = cursor.fetchall()
        for schema, name, definition, ansi, quoted in procedures:
            alter_definition(definition)
            self.stdout.write(f'{schema}.{name}')
        self.stdout.write(f'Procedures requiring repair: {len(procedures)}')
        if not options['apply'] or not procedures:
            return
        if not options['backup_dir']:
            raise CommandError('--backup-dir is required with --apply')
        backup = Path(options['backup_dir']).resolve()
        backup.mkdir(parents=True, exist_ok=True)
        for schema, name, definition, ansi, quoted in procedures:
            if not re.fullmatch(r'[A-Za-z0-9_]+', schema + name):
                raise CommandError('Unexpected procedure name')
            with (backup / f'{schema}.{name}.sql').open('x', encoding='utf-8') as f:
                f.write(f'SET ANSI_NULLS {"ON" if ansi else "OFF"};\nGO\nSET QUOTED_IDENTIFIER {"ON" if quoted else "OFF"};\nGO\n' + definition)
        with transaction.atomic():
            with connection.cursor() as cursor:
                for schema, name, definition, ansi, quoted in procedures:
                    cursor.execute('SET ANSI_NULLS ' + ('ON' if ansi else 'OFF'))
                    cursor.execute('SET QUOTED_IDENTIFIER ' + ('ON' if quoted else 'OFF'))
                    cursor.execute(alter_definition(definition))
                cursor.execute("SELECT COUNT(*) FROM sys.sql_modules WHERE definition LIKE %s", ['%' + PRODUCTION_INDEX + '%'])
                if cursor.fetchone()[0]:
                    raise CommandError('Old index references remain; rolling back')
        self.stdout.write(self.style.SUCCESS(f'Repaired {len(procedures)} procedures; backups: {backup}'))
