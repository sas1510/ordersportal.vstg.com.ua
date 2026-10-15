import { useEffect, useState } from 'react';
import axios from '../api/axios';
import DealerSelectWithAll from './DealerSelectWithAll';
import '../components/Payments/FundsTransferForms.css';

export default function FundsTransferHistoryPage() {
  const [dealer, setDealer] = useState(() => new URLSearchParams(window.location.search).get('contractor') || '__ALL__'), [sort, setSort] = useState('newest'), [page, setPage] = useState(1);
  const [items, setItems] = useState([]), [count, setCount] = useState(0), [loading, setLoading] = useState(false), [error, setError] = useState(''), [photo, setPhoto] = useState(''), [exporting, setExporting] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setItems([]);
    axios.get('/payments/funds-transfers/', { params: { contractor: dealer, sort, page }, signal: controller.signal }).then(({ data }) => { setItems(data.results); setCount(data.count); }).catch((err) => { if (!controller.signal.aborted) setError(err.response?.data?.detail || 'Не вдалося завантажити подання.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [dealer, sort, page]);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);
  useEffect(() => { if (!photo) return; const close = (event) => { if (event.key === 'Escape') setPhoto(''); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [photo]);
  const exportPdf = async () => {
    setExporting(true); setError('');
    try { const { data } = await axios.get('/payments/funds-transfers/export-pdf/', { params: { contractor: dealer, sort }, responseType: 'blob' }); const url = URL.createObjectURL(data), link = document.createElement('a'); link.href = url; link.download = 'Історія передавання коштів.pdf'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
    catch { setError('Не вдалося завантажити PDF.'); } finally { setExporting(false); }
  };
  const showPhoto = async (item) => {
    try { const { data } = await axios.get(`/payments/funds-transfers/${item.id}/photo/`, { params: { contractor: item.contractor_guid }, responseType: 'blob' }); setPhoto(URL.createObjectURL(data)); } catch { setError('Не вдалося відкрити фото.'); }
  };
  return <section className="funds-history-page"><h2>Історія передавання коштів</h2><div className="funds-history-filters"><label>Дилер<DealerSelectWithAll value={dealer} onChange={(value) => { setDealer(value); setPage(1); }} allLabel="Усі доступні дилери" /></label><label>Дата подання<select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="newest">Нові спочатку</option><option value="oldest">Давні спочатку</option></select></label><button type="button" disabled={loading || exporting || !count} onClick={exportPdf}>{exporting ? 'Завантаження…' : 'Завантажити PDF'}</button></div>
    {error && <p role="alert">{error}</p>}<div className="funds-history-table"><table><thead><tr><th>Дата подання</th><th>Дилер</th><th>Сума</th><th>Коментар</th><th>Автор</th><th>Фото</th></tr></thead><tbody>{loading ? <tr><td colSpan={6}>Завантаження…</td></tr> : items.map((item) => <tr key={item.id}><td>{new Date(item.created_at).toLocaleString('uk-UA')}</td><td>{item.dealer || '—'}</td><td>{Number(item.amount).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} {item.currency === 'UAH' ? 'грн' : item.currency}</td><td>{item.comment || '—'}</td><td>{item.author}</td><td><button type="button" onClick={() => showPhoto(item)}>Переглянути</button></td></tr>)}{!loading && !items.length && <tr><td colSpan={6}>Подань немає.</td></tr>}</tbody></table></div><div className="funds-history-filters"><button type="button" disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>Назад</button><span>{page} / {Math.max(1, Math.ceil(count / 20))} · {count} подань</span><button type="button" disabled={loading || page * 20 >= count} onClick={() => setPage(page + 1)}>Далі</button></div>
    {photo && <div className="funds-transfer-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setPhoto(''); }}><section className="funds-transfer-dialog" role="dialog" aria-modal="true" aria-label="Фото подання"><button type="button" autoFocus onClick={() => setPhoto('')}>Закрити</button><img className="funds-transfer-photo" src={photo} alt="Фото подання коштів" /></section></div>}
  </section>;
}
