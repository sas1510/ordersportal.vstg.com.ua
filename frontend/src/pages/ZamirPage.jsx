import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import axiosInstance from '../api/axios';
import { useAuthGetRole } from '../hooks/useAuthGetRole';
import { isZamirLoginRequest, sendZamirLogout, updateZamirFrameRef, ZAMIR_ORIGIN } from '../integrations/zamir';
import './ZamirPage.css';

export default function ZamirPage() {
  const { isAdmin } = useAuthGetRole();
  const canUseZamir = isAdmin;
  const frameRef = useRef(null);
  const setFrameRef = useCallback((node) => updateZamirFrameRef(frameRef, node), []);
  const pageRef = useRef(null);
  const [error, setError] = useState('');
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fullscreen = nativeFullscreen || expanded;
  useEffect(() => {
    const onChange = () => setNativeFullscreen(document.fullscreenElement === pageRef.current);
    const onKeyDown = (event) => { if (event.key === 'Escape') setExpanded(false); };
    document.addEventListener('fullscreenchange', onChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);
  const toggleFullscreen = async () => {
    if (document.fullscreenElement === pageRef.current) {
      try { await document.exitFullscreen(); } catch { /* Browser may already have exited. */ }
      return;
    }
    if (expanded) { setExpanded(false); return; }
    if (pageRef.current?.requestFullscreen) {
      try { await pageRef.current.requestFullscreen(); return; } catch { /* Fall back to filling the browser viewport. */ }
    }
    setExpanded(true);
  };
  const [retry, setRetry] = useState(0);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  useEffect(() => {
    if (!canUseZamir) return;
    const controller = new AbortController();
    axiosInstance.get('/zamir/profile/', { signal: controller.signal }).then(({ data }) => {
      setProfile(data); setEmail(data.email || ''); setError('');
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.response?.data?.detail || 'Не вдалося перевірити email.');
    });
    return () => controller.abort();
  }, [canUseZamir, retry]);
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
    const headerContent = header?.firstElementChild;
    const update = () => {
      if (!pageRef.current) return;
      pageRef.current.style.top = `${Math.max(0, header?.getBoundingClientRect().bottom || 0)}px`;
      const bounds = (headerContent || header)?.getBoundingClientRect();
      if (bounds) {
        pageRef.current.style.left = `${bounds.left}px`;
        pageRef.current.style.width = `${bounds.width}px`;
        pageRef.current.style.right = 'auto';
      }
    };
    update();
    const observer = new ResizeObserver(update);
    if (header) observer.observe(header);
    if (headerContent) observer.observe(headerContent);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, []);
  useLayoutEffect(() => {
    if (!canUseZamir) return;
    let stopped = false;
    let pending = false;
    const controller = new AbortController();
    const onLogout = () => {
      stopped = true;
      controller.abort();
      sendZamirLogout(frameRef.current?.contentWindow);
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
    const onPageShow = (event) => { if (event.persisted) setRetry((value) => value + 1); };
    window.addEventListener('pagehide', onLogout);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('message', onMessage);
    window.addEventListener('portal:logout', onLogout);
    return () => {
      stopped = true;
      controller.abort();
      window.removeEventListener('pagehide', onLogout);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('message', onMessage);
      window.removeEventListener('portal:logout', onLogout);
    };
  }, [canUseZamir, retry]);
  if (!canUseZamir) return <p>Замірник недоступний для вашого облікового запису.</p>;
  return <section ref={pageRef} className={`zamir-page${expanded ? ' zamir-page-expanded' : ''}`}>
    {profile && !profile.email_required && <button
      type="button" className="zamir-fullscreen-button" onClick={toggleFullscreen}
      aria-label={fullscreen ? 'Вийти з повного екрана' : 'На повний екран'}
      title={fullscreen ? 'Вийти з повного екрана' : 'На повний екран'} aria-pressed={fullscreen}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={fullscreen ? 'M9 3v6H3m12-6v6h6M3 15h6v6m12-6h-6v6' : 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5'} />
      </svg>
    </button>}
    {error && <div role="alert" className="zamir-error">{error}
      <button type="button" onClick={() => { setError(''); setRetry((value) => value + 1); }}>Спробувати ще раз</button>
    </div>}
    {profile?.email_required && <div className="zamir-email-panel">
      <form onSubmit={saveEmail} aria-labelledby="zamir-email-title">
        <span className="zamir-email-eyebrow">Перший вхід у замірник</span>
        <div className="zamir-email-heading">
          <span className="zamir-email-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>
        </span>
          <h1 id="zamir-email-title">Підтвердьте вашу пошту</h1>
        </div>
        <p className="zamir-email-description">Вона стане вашим логіном у замірнику.<br />Перевірте адресу або вкажіть актуальну.</p>
        <label>Електронна пошта<input type="email" placeholder="name@example.com" spellCheck={false} required maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={savingEmail} /></label>
        {emailError && <p role="alert">{emailError}</p>}
        <button type="submit" disabled={savingEmail}>{savingEmail ? 'Збереження…' : <>Підтвердити й увійти <span aria-hidden="true">→</span></>}</button>
        <p className="zamir-email-note">Підтверджую, що це моя діюча адреса пошти.</p>
      </form>
    </div>}
    {!profile && !error && <p className="zamir-profile-loading">Перевірка профілю…</p>}
    {profile && !profile.email_required && <iframe key={retry} ref={setFrameRef} src={`${ZAMIR_ORIGIN}/`} title="Замірник Вікна Стиль"
      allow="camera; clipboard-write" referrerPolicy="strict-origin-when-cross-origin" />}
  </section>;
}
