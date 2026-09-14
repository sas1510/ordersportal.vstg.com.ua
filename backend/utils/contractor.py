# backend/utils/contractor.py
from django.db import connection
from rest_framework.response import Response
from backend.utils.GuidToBin1C import guid_to_1c_bin
from backend.utils.BinToGuid1C import bin_to_guid_1c


def get_dealer_scope_requester_ids(user):
    """Return SQL requester IDs whose dealer portfolios compose this user's scope."""
    role = (getattr(user, "role", "") or "").strip().lower()
    if role not in {"branch_manager", "branches_director"}:
        return [user.id]

    from users.models import CustomUser

    managers = CustomUser.objects.filter(
        role="manager",
        is_branch=True,
        is_active=True,
    )
    if role == "branch_manager":
        if not getattr(user, "branch_id", None):
            return []
        managers = managers.filter(branch_id=user.branch_id)

    return list(managers.values_list("id", flat=True))


def get_accessible_dealer_rows(user):
    """Return dealer rows available to a portal user."""
    requester_ids = get_dealer_scope_requester_ids(user)
    result = []
    seen = set()
    with connection.cursor() as cursor:
        for requester_id in dict.fromkeys(requester_ids):
            cursor.execute(
                "EXEC dbo.GetDealerPortalUsers_2 @RequesterUserID = %s",
                [requester_id],
            )
            columns = [column[0] for column in cursor.description]
            for values in cursor.fetchall():
                row = dict(zip(columns, values))
                contractor_id = row.get("ContractorID")
                key = (
                    bytes(contractor_id)
                    if isinstance(contractor_id, (bytes, bytearray, memoryview))
                    else str(contractor_id or "").strip().lower()
                )
                if not key or key in seen:
                    continue
                seen.add(key)
                result.append(row)
    return result


def get_accessible_dealer_guids(user):
    result = set()
    for row in get_accessible_dealer_rows(user):
        contractor_id = row.get("ContractorID")
        if not contractor_id:
            continue
        value = (
            bin_to_guid_1c(bytes(contractor_id))
            if isinstance(contractor_id, (bytes, bytearray, memoryview))
            else str(contractor_id)
        )
        result.add(str(value).strip().lower())
    return result


def get_accessible_dealer_binaries(user):
    return {
        bytes(row["ContractorID"])
        for row in get_accessible_dealer_rows(user)
        if isinstance(row.get("ContractorID"), (bytes, bytearray, memoryview))
    }


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
    if {"manager", "region_manager", "branch_manager", "branches_director"} & allowed_elevated_roles:
        allowed_elevated_roles.update({"branch_manager", "branches_director"})

    if allow_admin and role in allowed_elevated_roles:
        contractor_guid = request.data.get(admin_param) if hasattr(request, 'data') else None
        if not contractor_guid:
            contractor_guid = request.GET.get(admin_param)

        if not contractor_guid:
            raise ValueError(f"{admin_param} is required for admin")

        if role in {"manager", "region_manager", "branch_manager", "branches_director"}:
            allowed_guids = get_accessible_dealer_guids(request.user)

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
            FROM [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] ZP WITH (NOLOCK)
            WHERE ZP.Ссылка = %s
            """,
            [order_bin],
        )
        row = cursor.fetchone()

        if not row or not row[0]:
            raise PermissionError("Замовлення не знайдено або доступ до нього відсутній.")

        order_contractor = bytes(row[0])

        if role in {"manager", "region_manager", "branch_manager", "branches_director"}:
            allowed_contractors = get_accessible_dealer_binaries(user)

            if order_contractor not in allowed_contractors:
                raise PermissionError("У вас немає доступу до дилера цього замовлення.")
            return

    user_contractor = getattr(user, "user_id_1C", None)
    if not user_contractor or bytes(user_contractor) != order_contractor:
        raise PermissionError("У вас немає доступу до цього замовлення.")