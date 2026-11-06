"""Resolve old measurement links before loading any orders."""
from types import SimpleNamespace
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, PermissionDenied
from users.models import CustomUser
from utils.BinToGuid1C import bin_to_guid_1c
from utils.contractor import resolve_contractor


def resolve_measurement_order_target(actor, dealer_id):
    dealer = CustomUser.objects.filter(pk=dealer_id, is_active=True, role__in=("customer", "dealer", "internal_dealer")).first()
    if not dealer or not dealer.user_id_1C:
        raise NotFound("Дилера заміру не знайдено або для нього не заданий контрагент.")
    target = bytes(dealer.user_id_1C)
    target_guid = bin_to_guid_1c(target)
    scoped_request = SimpleNamespace(user=actor, auth=None, GET={"contractor_guid": target_guid}, data={})
    try:
        resolved, guid = resolve_contractor(scoped_request, allow_admin=True, admin_param="contractor_guid",
            elevated_roles=("admin", "manager", "region_manager", "branch_manager", "branches_director"))
    except (ValueError, PermissionError) as exc:
        raise PermissionDenied(str(exc)) from exc
    if bytes(resolved) != target:
        raise PermissionDenied("У вас немає доступу до дилера цього заміру.")
    return {"contractor_guid": guid, "measurement_dealer": dealer.pk, "dealer_name": dealer.full_name or dealer.username}


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def measurement_order_target(request):
    dealer_id = serializers.IntegerField(min_value=1).run_validation(request.query_params.get("measurement_dealer"))
    return Response(resolve_measurement_order_target(request.user, dealer_id))
