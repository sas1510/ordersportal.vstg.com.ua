from pathlib import Path
r=Path('/var/www/html/ordersportal.vstg.com.ua')
p=r/'frontend/src/components/Orders/ClientAddressModal.jsx';s=p.read_text(encoding='utf-8-sig');s=s.replace('() => ["region", "district", "city"],','() => ["region", "district", "city", "street", "house"],');s=s.replace('String(formAddr[k]).trim()','String(formAddr[k] ?? "").trim()');s=s.replace('key={k}\n                  placeholder=', 'key={k}\n                  required={requiredFields.includes(k)}\n                  aria-required={requiredFields.includes(k)}\n                  placeholder=');s=s.replace('placeholder={ENGLISH_ADDRESS_FIELDS[k] && addressLanguage === "en" ? ENGLISH_ADDRESS_FIELDS[k] : t("clientAddressModal.fields." + k)}','placeholder={(ENGLISH_ADDRESS_FIELDS[k] && addressLanguage === "en" ? ENGLISH_ADDRESS_FIELDS[k] : t("clientAddressModal.fields." + k)) + (requiredFields.includes(k) ? " *" : "")}');p.write_text(s,encoding='utf-8')
p=r/'backend/records/serializers.py';s=p.read_text(encoding='utf-8-sig');anchor='class CalculationCreateSerializer(serializers.Serializer):';helper='''class DeliveryAddressValidationMixin:
    def validate_client_address(self, value):
        # Empty values mean the caller chose a saved address or pickup.
        if not value:
            return value
        required = {
            'region': 'Область', 'district': 'Район', 'city': 'Населений пункт',
            'street': 'Вулиця', 'house': 'Номер будинку',
        }
        errors = {
            key: f'{label}: обов’язкове поле.'
            for key, label in required.items()
            if not isinstance(value.get(key), str) or not value[key].strip()
        }
        if errors:
            raise serializers.ValidationError(errors)
        return {**value, **{key: value[key].strip() for key in required}}


''';s=s.replace(anchor,helper+'class CalculationCreateSerializer(DeliveryAddressValidationMixin, serializers.Serializer):');s=s.replace('class CalculationUpdateSerializer(serializers.Serializer):','class CalculationUpdateSerializer(DeliveryAddressValidationMixin, serializers.Serializer):');p.write_text(s,encoding='utf-8')
