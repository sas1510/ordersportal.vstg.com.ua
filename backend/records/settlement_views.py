"""Authenticated delivery-address directory extracted from 1C (Ukraine only)."""
import json
from pathlib import Path
from functools import lru_cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@lru_cache(maxsize=1)
def directory_data():
    return json.loads((Path(__file__).parent/'data/ukraine_settlements.json').read_text(encoding='utf-8'))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def delivery_settlements(request):
    return Response(directory_data())
