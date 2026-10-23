"""Validation for the measurement application's PDF submission API."""
import base64
import binascii
from pathlib import PurePath

from rest_framework import serializers

from .serializers import CalculationCreateSerializer, PhotoFileSerializer


def decode_attachment(value, limit):
    if len(value) > 4 * ((limit + 2) // 3):
        raise serializers.ValidationError('Файл перевищує допустимий розмір.')
    try:
        content = base64.b64decode(value, validate=True)
    except (binascii.Error, ValueError):
        raise serializers.ValidationError('Некоректний Base64. Передавайте без data: префікса.')
    if not content or len(content) > limit:
        raise serializers.ValidationError('Файл порожній або перевищує допустимий розмір.')
    return content


class MeasurementPDFSerializer(PhotoFileSerializer):
    def validate(self, attrs):
        if PurePath(attrs['fileName']).suffix.lower() != '.pdf':
            raise serializers.ValidationError({'fileName': 'Основний файл повинен мати розширення .pdf.'})
        content = decode_attachment(attrs['fileDataB64'], 20 * 1024 * 1024)
        if not content.startswith(b'%PDF-'):
            raise serializers.ValidationError({'fileDataB64': 'Вміст файлу не відповідає формату PDF.'})
        return attrs


class MeasurementPhotoSerializer(PhotoFileSerializer):
    def validate(self, attrs):
        content = decode_attachment(attrs['fileDataB64'], 10 * 1024 * 1024)
        ext = PurePath(attrs['fileName']).suffix.lower()
        valid = (
            (ext in {'.jpg', '.jpeg'} and content.startswith(b'\xff\xd8\xff'))
            or (ext == '.png' and content.startswith(b'\x89PNG\r\n\x1a\n'))
            or (ext == '.webp' and content.startswith(b'RIFF') and content[8:12] == b'WEBP')
        )
        if not valid:
            raise serializers.ValidationError('Фото повинно бути JPG, PNG або WebP з відповідним вмістом.')
        return attrs


class MeasurementOrderSerializer(CalculationCreateSerializer):
    user_id = serializers.IntegerField(min_value=1)
    file = MeasurementPDFSerializer()
    photos = serializers.ListField(child=MeasurementPhotoSerializer(), required=False, default=list, max_length=10)

    def get_fields(self):
        fields = super().get_fields()
        fields.pop('contractor_guid', None)
        return fields

    def validate(self, attrs):
        # The authenticated user_id owns the contractor; reject GUID overrides.
        if self.initial_data.get('contractor_guid') is not None:
            raise serializers.ValidationError({'contractor_guid': 'Точка визначається за UserId1C вибраного user_id. Не передавайте contractor_guid.'})
        if self.initial_data.get('contractor_id') is not None:
            raise serializers.ValidationError({'contractor_id': 'Використовуйте user_id — ID із portal_db.dbo.User.'})
        modes = sum(bool(attrs.get(name)) for name in ('delivery_is_pickup', 'delivery_address_guid', 'client_address'))
        if modes > 1:
            raise serializers.ValidationError('Оберіть лише один варіант доставки.')
        return attrs
