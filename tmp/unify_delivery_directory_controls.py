from pathlib import Path
p=Path('/var/www/html/ordersportal.vstg.com.ua/frontend/src/components/Orders/ClientAddressModal.jsx')
s=p.read_text(encoding='utf-8-sig').replace('import Select from "react-select";','import CreatableSelect from "react-select/creatable";')
a=s.index('            <datalist id="delivery-settlement-options">');b=s.index('            <div className="client-address-grid">',a);s=s[:a]+s[b:]
a=s.index("              {Object.keys(formAddr).map((k) => k === 'region'");b=s.index('              ))}',a)+len('              ))}')
s=s[:a]+'''              {Object.keys(formAddr).map((k) => {
                const fieldLabel = (ENGLISH_ADDRESS_FIELDS[k] && addressLanguage === 'en'
                  ? ENGLISH_ADDRESS_FIELDS[k] : t('clientAddressModal.fields.' + k)).replace(/\\s*\\*+\\s*$/u, '');
                const placeholder = fieldLabel + (requiredFields.includes(k) ? ' *' : '');
                if (!manualAddress && ['region', 'district', 'city'].includes(k) && directory.regions.length) {
                  const options = k === 'region'
                    ? directory.regions.map(region => ({ value: region.name, label: region.name }))
                    : k === 'district'
                      ? districtOptions.map(name => ({ value: name, label: name }))
                      : settlementOptions.filter(item => !formAddr.district || !item.district || item.district === formAddr.district)
                        .map(item => ({ value: item.value, label: item.value }));
                  const applyValue = value => {
                    if (k === 'region') {
                      setFormAddr(prev => ({ ...prev, region: value, district: '', city: '', street: '', house: '' }));
                      setSelectedCoords(null); setMapDisplayName(''); setIsPreciseLocation(false);
                    } else if (k === 'district') {
                      setFormAddr(prev => ({ ...prev, district: value, city: '', street: '', house: '' }));
                      setSelectedCoords(null); setMapDisplayName(''); setIsPreciseLocation(false);
                    } else updateAddressField(k, value);
                  };
                  return <CreatableSelect key={k}
                    aria-label={fieldLabel} required
                    className="delivery-region-select" classNamePrefix="delivery-region"
                    placeholder={placeholder}
                    value={formAddr[k] ? { value: formAddr[k], label: formAddr[k] } : null}
                    options={options}
                    isValidNewOption={k === 'region' ? () => false : undefined}
                    formatCreateLabel={value => `Ввести: ${value}`}
                    onCreateOption={applyValue}
                    menuPlacement="bottom" menuPosition="fixed"
                    menuPortalTarget={document.body} menuShouldScrollIntoView={false}
                    maxMenuHeight={220}
                    styles={{ menuPortal: base => ({ ...base, zIndex: 50000 }) }}
                    noOptionsMessage={() => 'Нічого не знайдено'}
                    onChange={option => applyValue(option?.value || '')}
                  />;
                }
                return <input key={k}
                  required={requiredFields.includes(k)} aria-required={requiredFields.includes(k)}
                  placeholder={placeholder} value={formAddr[k]}
                  onChange={e => updateAddressField(k, e.target.value)}
                />;
              })}'''+s[b:]
p.write_text(s,encoding='utf-8')
