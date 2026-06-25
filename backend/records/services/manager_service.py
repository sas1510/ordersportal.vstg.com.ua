from django.db import connections
from backend.utils.GuidToBin1C import guid_to_1c_bin

def get_manager_by_contractor(contractor_id_hex: str):
    contractor_bytes = guid_to_1c_bin(contractor_id_hex)

    with connections["default"].cursor() as cursor:
        cursor.execute(
            "EXEC dbo.GetManagerByContractor @ContractorId=%s",
            [contractor_bytes]
        )
        row = cursor.fetchone()

    if not row:
        return None

    return row[0]


def get_telegram_id_by_manager(manager_guid):
    with connections["db_2"].cursor() as cursor:
        cursor.execute(
            "EXEC dbo.GetTelegramID @UserGUID=%s",
            [manager_guid]
        )
        row = cursor.fetchone()

    if not row:
        return None

    return int(row[1])