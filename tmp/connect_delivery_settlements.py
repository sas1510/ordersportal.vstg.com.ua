from pathlib import Path
r=Path('/var/www/html/ordersportal.vstg.com.ua')
p=r/'backend/records/urls.py';s=p.read_text(encoding='utf-8-sig');s='from .settlement_views import delivery_settlements\n'+s;s=s.replace('urlpatterns = [','urlpatterns = [\n    path("delivery-settlements/", delivery_settlements),',1);p.write_text(s,encoding='utf-8')
p=r/'frontend/src/components/Orders/ClientAddressModal.jsx';s=p.read_text(encoding='utf-8-sig');s='import axios from "../../api/axios";\nimport { settlementsForRegion } from "../../utils/settlementDirectory";\n'+s
anchor='  const addressLanguage = useMemo('
code='''  const [directory, setDirectory] = useState({ regions: [], settlements: [] });
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState(false);
  const [manualAddress, setManualAddress] = useState(() => isLatinAddress(initialValue || {}));
  useEffect(() => {
    const controller = new AbortController();
    axios.get('/delivery-settlements/', { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setDirectory(data);
    }).catch(() => {
      if (!controller.signal.aborted) setDirectoryError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setDirectoryLoading(false);
    });
    return () => controller.abort();
  }, []);
  const settlementOptions = useMemo(() => settlementsForRegion(directory, formAddr.region), [directory, formAddr.region]);
  const districtOptions = useMemo(() => [...new Set(settlementOptions.map(item => item.district).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'uk-UA')), [settlementOptions]);
  const updateAddressField = (key, value) => {
    const settlement = key === 'city' && !manualAddress ? settlementOptions.find(item => item.value === value) : null;
    setFormAddr(prev => settlement
      ? { ...prev, city: settlement.name, district: settlement.district || '' }
      : { ...prev, [key]: value });
    setMapDisplayName('');
    setIsPreciseLocation(false);
  };

'''
s=s.replace(anchor,code+anchor)
s=s.replace('<div className="client-address-grid">\n              {Object.keys(formAddr).map((k) => (','''<label className="client-address-manual"><input type="checkbox" checked={manualAddress} onChange={e => setManualAddress(e.target.checked)} /> Ввести адресу вручну / інша країна</label>
            {!manualAddress && <p className="client-address-directory-hint">{directoryLoading ? 'Завантаження довідника 1С…' : directoryError ? 'Довідник недоступний. Адресу можна ввести вручну.' : 'Україна · оберіть область і почніть вводити населений пункт. Якщо району немає в довіднику, вкажіть його вручну.'}</p>}
            <datalist id="delivery-settlement-options">{settlementOptions.map(item => <option key={item.id} value={item.value} />)}</datalist>
            <datalist id="delivery-district-options">{districtOptions.map(name => <option key={name} value={name} />)}</datalist>
            <div className="client-address-grid">
              {Object.keys(formAddr).map((k) => k === 'region' && !manualAddress && directory.regions.length ? (
                <select key={k} aria-label="Область" required value={formAddr.region} onChange={e => {
                  setFormAddr(prev => ({ ...prev, region: e.target.value, district: '', city: '', street: '', house: '' }));
                  setSelectedCoords(null); setMapDisplayName(''); setIsPreciseLocation(false);
                }}>
                  <option value="">Область *</option>
                  {formAddr.region && !directory.regions.some(region => region.name === formAddr.region) && <option value={formAddr.region}>{formAddr.region}</option>}
                  {directory.regions.map(region => <option key={region.id} value={region.name}>{region.name}</option>)}
                </select>
              ) : (''')
s=s.replace('aria-required={requiredFields.includes(k)}','aria-required={requiredFields.includes(k)}\n                  list={!manualAddress ? (k === "city" ? "delivery-settlement-options" : k === "district" ? "delivery-district-options" : undefined) : undefined}')
s=s.replace('onChange={(e) => setFormAddr((prev) => ({ ...prev, [k]: e.target.value }))}','onChange={(e) => updateAddressField(k, e.target.value)}')
p.write_text(s,encoding='utf-8')
