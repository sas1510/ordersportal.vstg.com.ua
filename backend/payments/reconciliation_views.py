from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication
from .transfer_submissions import history_queryset
from .funds_reconciliation import reconcile_submissions


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def reconcile_transfer_history(request):
    if request.user.role not in {'admin', 'manager', 'region_manager', 'branch_manager', 'branches_director'}:
        raise PermissionDenied('Звірка доступна лише працівникам порталу.')
    queryset, _ = history_queryset(request)
    summary = reconcile_submissions(queryset)
    if summary['errors']:
        return Response({'detail': 'Частину подань не вдалося звірити. Перевірте доступ до даних ПКО та повторіть спробу.', **summary}, status=503)
    return Response(summary)
