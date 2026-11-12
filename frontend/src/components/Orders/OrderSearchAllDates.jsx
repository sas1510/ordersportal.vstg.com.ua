import { useEffect, useRef, useState } from 'react';
import axios from '../../api/axios';
import { FaSearch, FaSpinner, FaUndo } from 'react-icons/fa';
import './OrderSearchAllDates.css';

export default function OrderSearchAllDates({ number, data, selection, onSelection, onResults, children, matchCount, loading }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(false);
  const previous = useRef(null);
  const attemptedNumber = useRef(null);
  const searchCallback = useRef(null);
  const request = useRef(null);
  const callback = useRef(onResults);
  callback.current = onResults;

  useEffect(() => {
    request.current?.abort();
    setBusy(false);
    setError('');
    if (previous.current) {
      callback.current(previous.current.data);
      onSelection({ ...previous.current.selection, name: number });
    }
    previous.current = null;
    setActive(false);
    return () => request.current?.abort();
  }, [number]);

  useEffect(() => {
    const query = number.trim().replace(/^№\s*/, '');
    const isFullNumber = /^(?:\d{2}-?\d{5,8}|\d{5,12}|[A-Za-z]+-\d{2,12})$/.test(query);
    if (loading || active || busy || matchCount !== 0 || !isFullNumber || attemptedNumber.current === query) return;
    const timer = setTimeout(() => {
      attemptedNumber.current = query;
      searchCallback.current();
    }, 700);
    return () => clearTimeout(timer);
  }, [number, matchCount, loading, active, busy]);

  async function search() {
    attemptedNumber.current = number.trim().replace(/^№\s*/, "");
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    try {
      const { data: found } = await axios.get('/order/search-targets/', {
        params: { number }, signal: controller.signal,
      });
      const calculations = new Map();
      for (const target of found.targets) {
        const { data: response } = await axios.get('/order/get_orders_info/', {
          params: { contractor_guid: target.contractor_guid, date_from: target.date, date_to: target.date, search_number: number },
          signal: controller.signal,
          timeout: 180000,
        });
        for (const calc of response.data?.calculation ?? []) {
          calculations.set(calc.id, calc);
        }
      }
      if (controller.signal.aborted) return;
      previous.current ??= { data, selection };
      onSelection({ ...selection, month: 0, status: "Всі" });
      callback.current([...calculations.values()]);
      setActive(true);
    } catch (err) {
      if (!controller.signal.aborted) setError(err.response?.data?.error || 'Не вдалося виконати пошук.');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  searchCallback.current = search;
  return <div className="order-search-all-dates" aria-busy={busy}>
    <form onSubmit={event => {
      event.preventDefault();
      if (!busy && number.trim()) search();
    }}>
      <div className="search-wrapper relative">
        {children}
        <button type="submit" disabled={busy || !number.trim()}
          className="order-search-all-dates__icon"
          title="Знайти за всі дати" aria-label="Знайти за всі дати">
          {busy ? <FaSpinner className="order-search-all-dates__spinner" aria-hidden="true" /> : <FaSearch aria-hidden="true" />}
        </button>
      </div>
    </form>
    {active && <div className="order-search-all-dates__status"><span>За всі дати</span><button className="order-search-all-dates__reset" type="button" onClick={() => {
      callback.current(previous.current?.data ?? []);
      if (previous.current) onSelection({ ...previous.current.selection, name: number });
      previous.current = null;
      setActive(false);
    }}><FaUndo aria-hidden="true" />Повернути період</button></div>}
    {error && <p className="order-search-all-dates__error" role="alert">{error}</p>}
  </div>;
}
