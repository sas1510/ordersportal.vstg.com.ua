from rest_framework import viewsets

from backend.permissions import IsAdminOrReadOnly

from .models import BonusProduct
from .serializers import BonusProductSerializer


class BonusProductViewSet(viewsets.ModelViewSet):
    serializer_class = BonusProductSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = BonusProduct.objects.select_related('author').all().order_by('-created_at', 'name')
        is_active = self.request.query_params.get('is_active')
        if is_active in {'true', 'false'}:
            queryset = queryset.filter(is_active=(is_active == 'true'))
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
