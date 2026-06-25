from django.db import connections


def bytes_from_hex_guid(value: str) -> bytes:
    """
    value може бути:
    80F674867AD9D52511E95A97F67C4D4C
    або
    0x80F674867AD9D52511E95A97F67C4D4C
    """
    value = value.replace("0x", "").replace("-", "").strip()
    return bytes.fromhex(value)


def get_manager_by_contractor(contractor_guid_hex: str):
    contractor_bytes = bytes_from_hex_guid(contractor_guid_hex)

    with connections["default"].cursor() as cursor:
        cursor.execute(
            "EXEC dbo.GetManagerByContractor @ContractorId=%s",
            [contractor_bytes]
        )
        row = cursor.fetchone()

    if not row or not row[0]:
        return None

    return row[0]  # ManagerId binary(16)


def get_manager_telegram_id(manager_guid_bytes: bytes):
    with connections["testportal_unified"].cursor() as cursor:
        cursor.execute(
            "EXEC dbo.GetTelegramID @UserGUID=%s",
            [manager_guid_bytes]
        )
        row = cursor.fetchone()

    if not row or not row[0]:
        return None

    return int(row[0])