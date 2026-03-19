from backend.utils.BinToGuid1C import bin_to_guid_1c


def resolve_contractor_ws(scope):
    """
    WebSocket версія resolve_contractor

    Працює через scope['user']
    """

    user = scope.get("user")

    if not user or user.is_anonymous:
        raise PermissionError("Unauthorized")

    contractor_bin = getattr(user, "user_id_1C", None)

    if not contractor_bin:
        raise PermissionError("User has no contractor assigned")

    contractor_guid = bin_to_guid_1c(contractor_bin)

    return contractor_bin, contractor_guid