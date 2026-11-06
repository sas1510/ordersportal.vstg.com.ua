"""Presentation rules for the allocation-only cash-flow report."""
import re
from collections.abc import Mapping
from django.db import connection


ADVANCE_ARTICLE = bytes.fromhex("81B7002590554E9611E6AB17486133CE")


def contract_key(value):
    if isinstance(value, (bytes, bytearray, memoryview)):
        return bytes(value).hex().lower()
    text = str(value or "").strip()
    if text.lower().startswith("0x"):
        text = text[2:]
    if len(text) == 32:
        try:
            return bytes.fromhex(text).hex()
        except ValueError:
            return None
    if "-" in text:
        from utils.GuidToBin1C import guid_to_1c_bin
        try:
            return bytes(guid_to_1c_bin(text)).hex()
        except (ValueError, TypeError):
            return None
    return None


def get_cashflow_contract_types(contractor):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT D._IDRRef, D._Fld1909RRef, A.[Наименование]
            FROM [WST\WST].[oknastyle].[dbo].[_Reference86] D
            LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.СтатьиДвиженияДенежныхСредств] A
                ON A.[Ссылка] = D._Fld1909RRef
            WHERE D._OwnerIDRRef = %s
        """, [contractor])
        result = {}
        for contract, article, name in cursor.fetchall():
            article = bytes(article) if article else None
            if article and any(article):
                result[contract_key(contract)] = {
                    "ContractKind": "advance" if article == ADVANCE_ARTICLE else "main",
                    "ContractArticleName": name or "",
                }
        return result


def classify_cashflow_row(item, contract_types):
    kind = contract_types.get(contract_key(item.get("FinalDogovor") or item.get("DogovorCustomer")))
    if kind:
        item.update(kind)
        if kind["ContractKind"] == "main" and item.get("DealType") == "Списання з авансового договору":
            item["DealType"] = "Списання з основного договору"
    return item


def is_main_contract(value):
    if isinstance(value, Mapping):
        if value.get("ContractKind") in {"main", "advance"}:
            return value["ContractKind"] == "main"
        value = value.get("FinalDogovorName")
    return bool(re.match(r'^основн(?:ой|ий)(?:\s|$)', str(value or '').strip(), re.IGNORECASE))


def show_cashflow_row(item):
    if item.get('DocumentType') in {'Реалізація', 'РеализацияТоваровУслуг'}:
        return False
    if not is_main_contract(item):
        return True
    return (item.get('DocumentType') in {'ППВход', 'ПКО'}
            and bool(str(item.get('OrderNumber') or item.get('DealNumber') or '').strip()))
