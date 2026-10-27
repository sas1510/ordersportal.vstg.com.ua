"""Opt-in procedure versions; identifiers are fixed, never request-controlled."""
from django.conf import settings

def calculations_procedure():
    return 'GetCalculationsWithOrdersByYearAndContractor8' if settings.ORDER_READINESS_VNEXT else 'GetCalculationsWithOrdersByYearAndContractor7'

def monthly_orders_procedure():
    return 'GetOrdersMonthWithCalculations9' if settings.ORDER_READINESS_VNEXT else 'GetOrdersMonthWithCalculations8'
