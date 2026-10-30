from pathlib import Path
p=Path('/var/www/html/ordersportal.vstg.com.ua/frontend/src/components/Orders/ClientAddressModal.jsx')
s=p.read_text(encoding='utf-8-sig');s='import Select from "react-select";\n'+s
start=s.index('                <select key={k} aria-label="Область"')
end=s.index('                </select>',start)+len('                </select>')
s=s[:start]+'''                <Select key={k}
                  aria-label="Область" required
                  className="delivery-region-select" classNamePrefix="delivery-region"
                  placeholder="Область *"
                  value={formAddr.region ? { value: formAddr.region, label: formAddr.region } : null}
                  options={directory.regions.map(region => ({ value: region.name, label: region.name }))}
                  menuPlacement="bottom" menuPosition="fixed"
                  menuPortalTarget={document.body} menuShouldScrollIntoView={false}
                  maxMenuHeight={220}
                  styles={{ menuPortal: base => ({ ...base, zIndex: 50000 }) }}
                  noOptionsMessage={() => 'Область не знайдено'}
                  onChange={option => {
                    setFormAddr(prev => ({ ...prev, region: option?.value || '', district: '', city: '', street: '', house: '' }));
                    setSelectedCoords(null); setMapDisplayName(''); setIsPreciseLocation(false);
                  }}
                />'''+s[end:];p.write_text(s,encoding='utf-8')
