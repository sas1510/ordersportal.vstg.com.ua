"""Presentation rules for the allocation-only cash-flow report."""
import re


def is_main_contract(name):
    return bool(re.match(r'^основн(?:ой|ий)(?:\s|$)', str(name or '').strip(), re.IGNORECASE))


def show_cashflow_row(item):
    if item.get('DocumentType') in {'Реалізація', 'РеализацияТоваровУслуг'}:
        return False
    if not is_main_contract(item.get('FinalDogovorName')):
        return True
    return (item.get('DocumentType') in {'ППВход', 'ПКО'}
            and bool(str(item.get('OrderNumber') or item.get('DealNumber') or '').strip()))
