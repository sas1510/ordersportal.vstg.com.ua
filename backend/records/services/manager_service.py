from django.db import connections
from backend.utils.GuidToBin1C import guid_to_1c_bin


def get_manager_by_contractor(contractor_id: str):
    contractor_bytes = guid_to_1c_bin(contractor_id)

    with connections["default"].cursor() as cursor:
        cursor.execute(
            "EXEC dbo.GetManagerByContractor @ContractorId=%s",
            [contractor_bytes]
        )
        row = cursor.fetchone()

    if not row or not row[0]:
        return None

    return row[0]


def get_telegram_id_by_manager(manager_guid):
    with connections["default"].cursor() as cursor:
        cursor.execute(
            "EXEC dbo.GetTelegramID @UserGUID=%s",
            [manager_guid]
        )
        row = cursor.fetchone()

    if not row or not row[1]:
        return None

    return int(row[1])

def manager_telegram_id(contractor_guid):
    """Resolve the responsible manager for integration notifications."""
    with connections['default'].cursor() as cursor:
        cursor.execute('EXEC dbo.GetManagerByContractor @ContractorId=%s', [guid_to_1c_bin(str(contractor_guid))])
        manager = cursor.fetchone()
        if not manager or not manager[0]:
            return None
        cursor.execute('EXEC dbo.GetTelegramID @UserGUID=%s', [manager[0]])
        recipient = cursor.fetchone()
        value = recipient[1] if recipient and len(recipient) > 1 else recipient[0] if recipient else None
        return int(value) if value else None
