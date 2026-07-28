import base64

from rest_framework import serializers

from .models import BonusProduct


class BonusProductSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    image_base64 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    image_src = serializers.SerializerMethodField()

    class Meta:
        model = BonusProduct
        fields = [
            'id',
            'name',
            'category',
            'price',
            'image_base64',
            'image_extension',
            'image_src',
            'is_active',
            'display_order',
            'author',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'image_src', 'author', 'created_at', 'updated_at']

    def get_author(self, obj):
        if not obj.author:
            return None
        return {
            'id': obj.author_id,
            'full_name': getattr(obj.author, 'full_name', '') or obj.author.username,
        }

    def get_image_src(self, obj):
        if not obj.image_data or not obj.image_extension:
            return None
        extension = (obj.image_extension or '').lower().replace('.', '')
        mime = 'image/jpeg' if extension in {'jpg', 'jpeg'} else f'image/{extension}'
        return f'data:{mime};base64,{obj.image_base64}'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['image_base64'] = instance.image_base64
        return representation

    def validate(self, attrs):
        name = (attrs.get('name') or getattr(self.instance, 'name', '')).strip()
        category = (attrs.get('category') or getattr(self.instance, 'category', '')).strip()
        price = attrs.get('price', getattr(self.instance, 'price', None))

        if not name:
            raise serializers.ValidationError({'name': 'Вкажіть назву товару.'})

        if not category:
            raise serializers.ValidationError({'category': 'Вкажіть категорію товару.'})

        if price is None or int(price) < 0:
            raise serializers.ValidationError({'price': 'Вартість у балах має бути невідʼємним числом.'})

        image_base64 = attrs.get('image_base64', None)
        image_extension = attrs.get('image_extension', getattr(self.instance, 'image_extension', None))
        if image_base64:
            if not image_extension:
                raise serializers.ValidationError({'image_extension': 'Для нового зображення потрібно передати розширення файлу.'})
            extension = str(image_extension).lower().replace('.', '')
            if extension not in {'png', 'jpg', 'jpeg', 'webp', 'gif'}:
                raise serializers.ValidationError({'image_extension': 'Підтримуються лише png, jpg, jpeg, webp або gif.'})
        elif self.instance is None:
            raise serializers.ValidationError({'image_base64': 'Додайте фото товару.'})

        return attrs

    def _decode_image(self, validated_data):
        image_base64 = validated_data.pop('image_base64', None)
        if not image_base64:
            return validated_data

        if ';base64,' in image_base64:
            _, image_base64 = image_base64.split(';base64,', 1)

        try:
            validated_data['image_data'] = base64.b64decode(image_base64)
        except Exception as exc:
            raise serializers.ValidationError({'image_base64': 'Некоректний формат зображення.'}) from exc
        return validated_data

    def create(self, validated_data):
        validated_data = self._decode_image(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._decode_image(validated_data)
        return super().update(instance, validated_data)
