# backend/utils/contractor.py
from rest_framework.response import Response
from backend.utils.GuidToBin1C import guid_to_1c_bin
from backend.utils.BinToGuid1C import bin_to_guid_1c


def resolve_contractor(
    request,
    *,
    allow_admin=True,
    admin_param="contractor",
):
    """
    ЄДИНА точка визначення contractor.

    Правила:
    - 1C API key → user.user_id_1C
    - JWT admin → може передати contractor
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

    if role == "admin" and allow_admin:
        contractor_guid = request.GET.get(admin_param)
        if not contractor_guid:
            raise ValueError("contractor is required for admin")

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
