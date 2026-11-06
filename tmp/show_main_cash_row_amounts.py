from pathlib import Path
r=Path('/var/www/html/ordersportal.vstg.com.ua')
p=r/'frontend/src/utils/cashFlowGroups.js';s=p.read_text(encoding='utf-8-sig');s=s.replace('if (allocationView && (isRealization(item) || (hideContractAmounts && !isOrderAllocation(item)))) continue;','if (allocationView && isRealization(item)) continue;');s=s.replace('if (hideContractAmounts) continue; // Keep order allocation cards, omit main-contract totals/badges.', '''if (hideContractAmounts) {
      // Main-contract cash stays visible per document, without balance/summary badges.
      const amount = Math.abs(number(item.DeltaRow));
      if (item.FlowDirection === 'Прихід') document.totalIncome += amount;
      else document.totalExpense += amount;
      continue;
    }''');p.write_text(s,encoding='utf-8')
p=r/'frontend/src/pages/PaymentStatusV2.jsx';s=p.read_text(encoding='utf-8-sig').replace('!docGroup.hideContractAmounts && income > 0','income > 0').replace('!docGroup.hideContractAmounts && expense > 0','expense > 0');p.write_text(s,encoding='utf-8')
p=r/'frontend/src/pages/MobilePaymentsView.jsx';s=p.read_text(encoding='utf-8-sig');s=s.replace('{!docGroup.hideContractAmounts && <div className="mobile-doc-amounts">','<div className="mobile-doc-amounts">');anchor=s.index('<div className="mobile-doc-amounts">',s.index('const MobilePaymentsView') if 'const MobilePaymentsView' in s else s.index('import',s.index('import')+1));# only modify live block by its unique translation labels
s=s.replace('''                        <div className="mobile-amount-item">
                          <span className="mobile-amount-label">{t('payments.start_short', 'Початок')}:</span>''','''                        {!docGroup.hideContractAmounts && <div className="mobile-amount-item">
                          <span className="mobile-amount-label">{t('payments.start_short', 'Початок')}:</span>''')
s=s.replace('''{formatCurrency(docGroup.CumSaldoStart, currency, i18n)}
                          </span>
                        </div>''','''{formatCurrency(docGroup.CumSaldoStart, currency, i18n)}
                          </span>
                        </div>}''')
s=s.replace('<div className="mobile-amount-item mobile-amount-total">','{!docGroup.hideContractAmounts && <div className="mobile-amount-item mobile-amount-total">')
s=s.replace('''{formatCurrency(docGroup.lastCumSaldo, currency, i18n)}
                          </span>
                        </div>
                      </div>}''','''{formatCurrency(docGroup.lastCumSaldo, currency, i18n)}
                          </span>
                        </div>}
                      </div>''');p.write_text(s,encoding='utf-8')
p=r/'frontend/src/utils/cashFlowGroups.test.mjs';s=p.read_text(encoding='utf-8-sig');s=s.replace("test('allocation view hides sales/main totals and retains allocated orders only'", "test('allocation view shows main cash amounts without balances or summaries'");s=s.replace('assert.equal(documents.length, 1);\n  assert.equal(documents[0].items[0].OrderNumber, \'15-04162\');',"assert.equal(documents.length, 2);\n  assert.equal(documents.find(doc => doc.items[0].OrderNumber === '15-04162').totalIncome, 30876);\n  assert.equal(documents.find(doc => doc.items[0].OrderNumber === '').totalIncome, 30876);");s+='''

test('main contract outgoing cash is visible without a daily summary', () => {
  const [group] = buildCashFlowGroups([row({ FlowDirection: 'Витрата', DeltaRow: -500, OrderNumber: '' })], { allocationView: true });
  assert.equal(Object.values(group.documentGroups)[0].totalExpense, 500);
  assert.deepEqual(group.contractSummary, {});
  assert.deepEqual(group.initialContracts, {});
});
''';p.write_text(s,encoding='utf-8')
