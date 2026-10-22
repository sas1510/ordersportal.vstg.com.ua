"""Load only the oldest and newest chat text needed by order list cards."""
from django.db.models import Min, Max
from django.db import connections
from .models import ChatMessage


def _hashable_binary_params(execute, sql, params, many, context):
    # BinaryField preparation uses pyodbc.Binary (bytearray). mssql-django's
    # GROUP BY formatter deduplicates parameters using set(), requiring bytes.
    if params is not None:
        params = tuple(bytes(value) if isinstance(value, (bytearray, memoryview)) else value for value in params)
    return execute(sql, params, many, context)


def get_order_boundary_messages(calculation_ids):
    # Keep SQL Server parameter counts bounded even for a full year of orders.
    calculation_ids = list(dict.fromkeys(bytes(value) if isinstance(value, (bytearray, memoryview)) else value for value in calculation_ids))
    messages = []
    for start in range(0, len(calculation_ids), 800):
        boundaries = ChatMessage.objects.filter(
            related_object_id__in=calculation_ids[start:start + 800],
            is_notification=False,
        ).order_by().values('related_object_id').annotate(first_id=Min('id'), last_id=Max('id'))
        with connections[ChatMessage.objects.db].execute_wrapper(_hashable_binary_params):
            ids = {value for row in boundaries for value in (row['first_id'], row['last_id']) if value is not None}
        if ids:
            messages.extend(ChatMessage.objects.filter(pk__in=ids).values('id', 'related_object_id', 'text'))
    # Preserve the existing newest-first mapping, including empty comments.
    return sorted(messages, key=lambda message: message['id'], reverse=True)
