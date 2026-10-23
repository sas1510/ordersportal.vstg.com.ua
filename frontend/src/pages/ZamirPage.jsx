import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import axiosInstance from '../api/axios';
import { useAuthGetRole } from '../hooks/useAuthGetRole';
import { isZamirLoginRequest, ZAMIR_ORIGIN } from '../integrations/zamir';
import './ZamirPage.css';

export default function ZamirPage() {
  const { isDealer } = useAuthGetRole();
  const frameRef = useRef(null);
  const pageRef = useRef(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  useEffect(() => {
    if (!isDealer) return;
    const controller = new AbortController();
    axiosInstance.get('/zamir/profile/', { signal: controller.signal }).then(({ data }) => {
      setProfile(data); setEmail(data.email || ''); setError('');
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.response?.data?.detail || 'Не вдалося перевірити email.');
    });
    return () => controller.abort();
  }, [isDealer, retry]);
  const saveEmail = async (event) => {
    event.preventDefault();
    if (savingEmail) return;
    setSavingEmail(true); setEmailError('');
    try {
      const { data } = await axiosInstance.post('/zamir/profile/', { email: email.trim() });
      setProfile(data); setEmail(data.email); setError('');
    } catch (failure) {
      const message = failure.response?.data?.email;
      setEmailError((Array.isArray(message) ? message.join(' ') : message) || failure.response?.data?.detail || 'Не вдалося зберегти email.');
    } finally { setSavingEmail(false); }
  };
  useLayoutEffect(() => {
    const header = document.querySelector('[data-portal-header]');
    const update = () => {
      if (pageRef.current) pageRef.current.style.top = `${Math.max(0, header?.getBoundingClientRect().bottom || 0)}px`;
    };
    update();
    const observer = new ResizeObserver(update);
    if (header) observer.observe(header);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, []);
  useLayoutEffect(() => {
    if (!isDealer) return;
    let stopped = false;
    let pending = false;
    const controller = new AbortController();
    const onLogout = () => {
      stopped = true;
      controller.abort();
      frameRef.current?.contentWindow?.postMessage({ type: 'zamir:logout' }, ZAMIR_ORIGIN);
    };
    const onMessage = async (event) => {
      const frameWindow = frameRef.current?.contentWindow;
      if (stopped || pending || !isZamirLoginRequest(event, frameWindow)) return;
      pending = true;
      setError('');
      try {
        const { data } = await axiosInstance.get('/zamir/ticket/', { signal: controller.signal });
        if (!stopped && frameRef.current?.contentWindow === frameWindow) {
          frameWindow.postMessage({ type: 'zamir:login', ticket: data.ticket }, ZAMIR_ORIGIN);
        }
      } catch (failure) {
        if (!stopped) {
          if (failure.response?.data?.code === 'email_required') {
            setProfile((value) => ({ ...value, email_required: true }));
          } else setError(failure.response?.data?.detail || 'Не вдалося виконати вхід у замірник. Спробуйте ще раз.');
        }
      } finally { pending = false; }
    };
    window.addEventListener('message', onMessage);
    window.addEventListener('portal:logout', onLogout);
    return () => {
      stopped = true;
      controller.abort();
      window.removeEventListener('message', onMessage);
      window.removeEventListener('portal:logout', onLogout);
    };
  }, [isDealer, retry]);
  if (!isDealer) return <p>Замірник доступний лише дилерам.</p>;
  return <section ref={pageRef} className="zamir-page">
    {error && <div role="alert" className="zamir-error">{error}
      <button type="button" onClick={() => { setError(''); setRetry((value) => value + 1); }}>Спробувати ще раз</button>
    </div>}
    {profile?.email_required && <div className="zamir-email-panel">
      <form onSubmit={saveEmail}>
        <h1>Вкажіть email для замірника</h1>
        <p>Ця адреса буде вашим логіном у замірнику. Вкажіть власну діючу пошту — ми збережемо її у профілі порталу.</p>
        <label>Email<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={savingEmail} /></label>
        {emailError && <p role="alert">{emailError}</p>}
        <button type="submit" disabled={savingEmail}>{savingEmail ? 'Збереження…' : 'Зберегти й увійти'}</button>
      </form>
    </div>}
    {!profile && !error && <p className="zamir-profile-loading">Перевірка профілю…</p>}
    {profile && !profile.email_required && <iframe key={retry} ref={frameRef} src={`${ZAMIR_ORIGIN}/`} title="Замірник Вікна Стиль"
      allow="camera; clipboard-write" referrerPolicy="strict-origin-when-cross-origin" />}
  </section>;
}
