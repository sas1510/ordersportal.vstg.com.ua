# backend/utils/contractor.py
from django.db import connection
from rest_framework.response import Response
from backend.utils.GuidToBin1C import guid_to_1c_bin
from backend.utils.BinToGuid1C import bin_to_guid_1c


def resolve_contractor(
    request,
    *,
    allow_admin=True,
    admin_param="contractor",
    elevated_roles=None,
):
    """
    ЄДИНА точка визначення contractor.

    Правила:
    - 1C API key → user.user_id_1C
    - JWT admin / дозволені backoffice-ролі → можуть передати contractor
    - JWT dealer/customer → тільки свій

    Повертає:
        (contractor_bin, contractor_guid_str)

    Кидає Response(...) при помилці
    """

    user = request.user
    is_1c = request.auth == "1C_API_KEY"

    # 🔑 1C API KEY
    if is_1c:
        contractor_bin = getattr(user, "user_id_1C", None)
        if not contractor_bin:
            raise PermissionError("API key user has no UserId1C")

        return contractor_bin, bin_to_guid_1c(contractor_bin)

    # 🔐 JWT
    role = (getattr(user, "role", "") or "").lower()

    allowed_elevated_roles = {
        str(item or "").strip().lower()
        for item in (elevated_roles or ("admin",))
        if str(item or "").strip()
    }

    if allow_admin and role in allowed_elevated_roles:
        contractor_guid = request.data.get(admin_param) if hasattr(request, 'data') else None
        if not contractor_guid:
            contractor_guid = request.GET.get(admin_param)

        if not contractor_guid:
            raise ValueError(f"{admin_param} is required for admin")

        if role in {"manager", "region_manager"}:
            with connection.cursor() as cursor:
                cursor.execute(
                    "EXEC dbo.GetDealerPortalUsers_2 @RequesterUserID = %s",
                    [request.user.id],
                )
                columns = [column[0] for column in cursor.description]
                contractor_index = columns.index("ContractorID")
                allowed_guids = {
                    str(
                        bin_to_guid_1c(row[contractor_index])
                        if isinstance(row[contractor_index], (bytes, bytearray, memoryview))
                        else row[contractor_index]
                    ).strip().lower()
                    for row in cursor.fetchall()
                    if row[contractor_index]
                }

            if str(contractor_guid).strip().lower() not in allowed_guids:
                raise PermissionError("У вас немає доступу до вибраного дилера.")

        try:
            contractor_bin = guid_to_1c_bin(contractor_guid)
        except Exception:
            raise ValueError("Invalid contractor GUID")

        return contractor_bin, contractor_guid

    # 👤 dealer / customer
    contractor_bin = getattr(user, "user_id_1C", None)
    if not contractor_bin:
        raise PermissionError("User has no contractor assigned")

    return contractor_bin, bin_to_guid_1c(contractor_bin)


def ensure_order_action_access(request, order_guid):
    """Ensure the authenticated user may act on the specified order."""
    user = request.user
    role = (getattr(user, "role", "") or "").strip().lower()

    if role in {"admin", "director"}:
        return

    try:
        order_bin = guid_to_1c_bin(str(order_guid))
    except Exception as exc:
        raise ValueError("Invalid order GUID") from exc

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT TOP (1) ZP.Контрагент
            FROM [WST\WST].[oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] ZP WITH (NOLOCK)
            WHERE ZP.Ссылка = %s
            """,
            [order_bin],
        )
        row = cursor.fetchone()

        if not row or not row[0]:
            raise PermissionError("Замовлення не знайдено або доступ до нього відсутній.")

        order_contractor = bytes(row[0])

        if role in {"manager", "region_manager"}:
            cursor.execute(
                "EXEC dbo.GetDealerPortalUsers_2 @RequesterUserID = %s",
                [user.id],
            )
            columns = [column[0] for column in cursor.description]
            contractor_index = columns.index("ContractorID")
            allowed_contractors = {
                bytes(row[contractor_index])
                for row in cursor.fetchall()
                if row[contractor_index]
            }

            if order_contractor not in allowed_contractors:
                raise PermissionError("У вас немає доступу до дилера цього замовлення.")
            return

    user_contractor = getattr(user, "user_id_1C", None)
    if not user_contractor or bytes(user_contractor) != order_contractor:
        raise PermissionError("У вас немає доступу до цього замовлення.")