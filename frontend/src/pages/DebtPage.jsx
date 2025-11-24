import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axios';
import '../components/Portal/PortalOriginal.css';
import { useTheme } from '../context/ThemeContext';

// Отримуємо роль користувача з Local Storage
const USER_ROLE = localStorage.getItem('role') || '';
const DEFAULT_CONTRACTOR_GUID = localStorage.getItem('contractor_guid') || '0x811D74867AD9D52511ECE7C2E5415765';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const PaymentStatus = () => {
  const { theme } = useTheme();
  const [paymentsData, setPaymentsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    contractor: DEFAULT_CONTRACTOR_GUID,
    dateFrom: '2025-01-01',
    dateTo: new Date().toISOString().split('T')[0],
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const API_ENDPOINT = "/get_payment_status_view/";

  // Перевірка чи користувач є customer
  const isCustomer = USER_ROLE === 'customer';

  // Завантаження даних з урахуванням ролі
  const fetchData = useCallback(async () => {
    if (!isCustomer && !filters.contractor) {
      setError("Ідентифікатор контрагента не знайдено.");
      return;
    }

    setLoading(true);
    setError(null);
    setPaymentsData([]);

    try {
      const params = {
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
      };

      // ===== КЛЮЧОВА ЛОГІКА: контрагент передається ТІЛЬКИ якщо роль НЕ customer =====
      if (!isCustomer) {
        params.contractor = filters.contractor;
      }

      const response = await axiosInstance.get(API_ENDPOINT, { params });
      
      if (response.data && Array.isArray(response.data)) {
        setPaymentsData(response.data);
      } else {
        setPaymentsData([]);
      }
    } catch (err) {
      console.error("Помилка запиту статусу оплати:", err);
      setError("Не вдалося завантажити дані про платежі. Перевірте підключення.");
    } finally {
      setLoading(false);
    }
  }, [isCustomer, filters.contractor, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmitFilters = useCallback((e) => {
    e.preventDefault();
    fetchData();
  }, [fetchData]);

  // Групування даних по датах
  const groupedData = paymentsData.reduce((acc, item) => {
    const date = item.ДатаТранзакції;
    if (!acc[date]) {
      acc[date] = {
        date: date,
        items: [],
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        initialBalance: 0
      };
    }
    acc[date].items.push(item);
    
    // Розрахунок сум - перевіряємо Доп_Інфо
    const isIncome = item.Доп_Інфо === 'Каса' || item.Доп_Інфо === 'Банк';
    if (isIncome) {
      acc[date].totalIncome += item.СумаДокументу || 0;
    } else {
      acc[date].totalExpense += item.СумаДокументу || 0;
    }
    
    return acc;
  }, {});

  // Перетворюємо об'єкт на масив і сортуємо по даті
  const sortedGroups = Object.values(groupedData).sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  // Розраховуємо баланси
  let runningBalance = 0;
  sortedGroups.reverse().forEach(group => {
    group.initialBalance = runningBalance;
    group.balance = runningBalance + group.totalIncome - group.totalExpense;
    runningBalance = group.balance;
  });
  sortedGroups.reverse();

  if (loading) return (
    <div className={`page-container ${theme}`}>
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Завантаження фінансових даних...</p>
      </div>
    </div>
  );

  return (
    <div className={`page-container payments-body ${theme}`}>
      <div className="content-wrapper">
        {/* HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <h1 className="page-title" style={{margin: 0}}>
              💳 Фінансові Транзакції
            </h1>
            {isCustomer && (
              <span style={{
                fontSize: '13px',
                color: '#2196F3',
                fontWeight: '600',
                display: 'inline-block',
                marginTop: '5px'
              }}>
                ✓ Особистий кабінет
              </span>
            )}
          </div>
          <button
            className="orders-button"
            onClick={() => setIsSidebarOpen(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            🔍 Фільтри
          </button>
        </div>

        {/* САЙДБАР */}
        {isSidebarOpen && <div className="sidebar-overlay"></div>}
        {isSidebarOpen && (
          <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            {/* <h2 style={{margin: 0, fontSize: '18px'}}>🔍 Фільтри</h2> */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#999'
              }}
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmitFilters}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <div className="filter-group">
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: '600',
                  fontSize: '12px',
                  color: '#555'
                }}>
                  📅 З:
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="search-orders"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0',
                    fontSize: '13px'
                  }}
                />
              </div>
              
              <div className="filter-group">
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: '600',
                  fontSize: '12px',
                  color: '#555'
                }}>
                  📅 ПО:
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="search-orders"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>
            
            <button type="submit" style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              ✓ Застосувати
            </button>
          </form>
          
          {!isCustomer && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              borderRadius: '8px',
              borderLeft: '4px solid #667eea'
            }}>
              <p style={{
                fontSize: '11px',
                color: '#667eea',
                margin: 0,
                fontWeight: 'bold',
                letterSpacing: '0.5px'
              }}>
                👨‍💼 РЕЖИМ АДМІНІСТРАТОРА
              </p>
              <p style={{
                fontSize: '11px',
                marginTop: '8px',
                color: '#555',
                lineHeight: '1.4'
              }}>
                Контрагент:<br/>
                <code style={{
                  fontSize: '10px',
                  background: 'rgba(255,255,255,0.7)',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginTop: '4px'
                }}>
                  {filters.contractor}
                </code>
              </p>
            </div>
          )}

          {isCustomer && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              borderRadius: '8px',
              borderLeft: '4px solid #2196F3'
            }}>
              <p style={{
                fontSize: '11px',
                color: '#1976D2',
                margin: 0,
                fontWeight: 'bold',
                letterSpacing: '0.5px'
              }}>
                👤 ОСОБИСТИЙ КАБІНЕТ
              </p>
              <p style={{
                fontSize: '11px',
                marginTop: '8px',
                color: '#555',
                lineHeight: '1.4'
              }}>
                Відображаються тільки ваші транзакції
              </p>
            </div>
          )}
        </div>

        {/* КОНТЕНТ */}
        <div className="content-area">
          {error && (
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
              border: '2px solid #f44336',
              borderRadius: '12px',
              color: '#c62828',
              marginBottom: '20px',
              boxShadow: '0 4px 15px rgba(244, 67, 54, 0.2)'
            }}>
              <strong>⚠️ Помилка:</strong> {error}
            </div>
          )}

          {paymentsData.length === 0 && !loading && !error ? (
            <div style={{
              padding: '60px 40px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              borderRadius: '16px',
              border: '3px dashed #d0d0d0'
            }}>
              <div style={{fontSize: '64px', marginBottom: '20px'}}>📊</div>
              <p style={{fontSize: '22px', color: '#666', margin: 0, fontWeight: '600'}}>
                Транзакцій не знайдено
              </p>
              <p style={{fontSize: '15px', color: '#999', marginTop: '12px'}}>
                Спробуйте змінити діапазон дат у фільтрах
              </p>
            </div>
          ) : (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'auto',
              maxHeight: '85vh'
            }}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead style={{position: 'sticky', top: 0, zIndex: 10}}>
                  <tr style={{background: '#1e4a6f', color: 'white'}}>
                    <th style={{padding: '15px', textAlign: 'left', fontWeight: '600', fontSize: '14px'}}>Дата</th>
                    <th style={{padding: '15px', textAlign: 'left', fontWeight: '600', fontSize: '14px'}}>№ замовл.</th>
                    <th style={{padding: '15px', textAlign: 'right', fontWeight: '600', fontSize: '14px'}}>Залишок на початок</th>
                    <th style={{padding: '15px', textAlign: 'right', fontWeight: '600', fontSize: '14px'}}>Прихід</th>
                    <th style={{padding: '15px', textAlign: 'right', fontWeight: '600', fontSize: '14px'}}>Розхід</th>
                    <th style={{padding: '15px', textAlign: 'right', fontWeight: '600', fontSize: '14px'}}>Залишок</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGroups.map((group, groupIndex) => (
                    <React.Fragment key={groupIndex}>
                      {/* Рядок з датою та початковим залишком */}
                      <tr style={{background: '#5a8cb8', color: 'white'}}>
                        <td style={{padding: '12px 15px', fontWeight: 'bold'}}>{group.date}</td>
                        <td style={{padding: '12px 15px'}}></td>
                        <td style={{padding: '12px 15px', textAlign: 'right', fontWeight: 'bold'}}>
                          {formatCurrency(group.initialBalance)}
                        </td>
                        <td style={{padding: '12px 15px'}}></td>
                        <td style={{padding: '12px 15px'}}></td>
                        <td style={{padding: '12px 15px'}}></td>
                      </tr>

                      {/* Рядки з транзакціями */}
                      {group.items.map((item, itemIndex) => {
                        const isIncome = item.Доп_Інфо === 'Каса' || item.Доп_Інфо === 'Банк';
                        return (
                          <tr key={itemIndex} style={{
                            background: isIncome ? '#6b7f8f' : (itemIndex % 2 === 0 ? '#5c7a93' : '#4d6b82'),
                            color: 'white'
                          }}>
                            <td style={{padding: '10px 15px'}}></td>
                            <td style={{padding: '10px 15px', fontSize: '13px'}}>
          
                              {isIncome ? item.Доп_Інфо : item.Замовлення}
                            </td>
                            <td style={{padding: '10px 15px'}}></td>
                            <td style={{padding: '10px 15px', textAlign: 'right', fontSize: '14px'}}>
                              {isIncome ? formatCurrency(item.СумаДокументу) : formatCurrency(item.ОплаченоПоЗаказуНаДату_ДО) }
                            </td>
                            <td style={{padding: '10px 15px', textAlign: 'right', fontSize: '14px'}}>
                              {!isIncome ? formatCurrency(item.СумаДокументу) : ''}
                            </td>
                            <td style={{padding: '10px 15px', textAlign: 'right'}}>
                              {item.СтатусОплатыНаДату}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Рядок підсумку */}
                      <tr style={{background: '#2d5f3c', color: 'white', fontWeight: 'bold'}}>
                        <td style={{padding: '12px 15px'}}>Разом:</td>
                        <td style={{padding: '12px 15px'}}></td>
                        <td style={{padding: '12px 15px', textAlign: 'right'}}>
                          {formatCurrency(group.totalIncome)}
                        </td>
                        <td style={{padding: '12px 15px', textAlign: 'right'}}>
                          {formatCurrency(group.totalExpense)}
                        </td>
                        <td style={{padding: '12px 15px', textAlign: 'right'}}>
                          {formatCurrency(group.balance)}
                        </td>
                        <td style={{padding: '12px 15px'}}></td>
                      </tr>

                      {/* Порожній рядок-роздільник */}
                      <tr style={{height: '10px', background: 'white'}}>
                        <td colSpan="6"></td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;