from pathlib import Path
r=Path('/var/www/html/ordersportal.vstg.com.ua')
p=r/'frontend/src/components/Orders/ClientAddressModal.jsx';s=p.read_text(encoding='utf-8-sig')
for line in ['import CreatableSelect from "react-select/creatable";\n','import axios from "../../api/axios";\n','import { settlementsForRegion } from "../../utils/settlementDirectory";\n']:s=s.replace(line,'')
a=s.index('  const [directory, setDirectory]');b=s.index('  const addressLanguage = useMemo(',a);s=s[:a]+s[b:]
s=s.replace('() => ["region", "district", "city", "street", "house"],','() => ["region", "district", "city"],')
a=s.index('            <label className="client-address-manual">');b=s.index('            <button type="button" className="client-address-find-btn"',a)
s=s[:a]+'''            <div className="client-address-grid">
              {Object.keys(formAddr).map((k) => (
                <input
                  key={k}
                  placeholder={ENGLISH_ADDRESS_FIELDS[k] && addressLanguage === "en" ? ENGLISH_ADDRESS_FIELDS[k] : t("clientAddressModal.fields." + k)}
                  value={formAddr[k]}
                  onChange={(e) => setFormAddr((prev) => ({ ...prev, [k]: e.target.value }))}
                />
              ))}
            </div>
'''+s[b:];p.write_text(s,encoding='utf-8')
p=r/'frontend/src/components/Orders/ClientAddressModal.css';s=p.read_text(encoding='utf-8-sig');s=s[:s.index('.client-address-grid select{')];p.write_text(s,encoding='utf-8')
p=r/'backend/records/serializers.py';s=p.read_text(encoding='utf-8-sig');a=s.index('\nclass DeliveryAddressValidationMixin:');b=s.index('\nclass CalculationCreateSerializer(DeliveryAddressValidationMixin, serializers.Serializer):',a);s=s[:a]+s[b:];s=s.replace('(DeliveryAddressValidationMixin, serializers.Serializer)', '(serializers.Serializer)');p.write_text(s,encoding='utf-8')
p=r/'backend/records/test_delivery_address_required.py';backup=r/'tmp/test_delivery_address_required.disabled.py';backup.write_text(p.read_text(encoding='utf-8-sig'),encoding='utf-8');p.unlink()
print('Previous delivery address form and validation restored; directory snapshot retained')
