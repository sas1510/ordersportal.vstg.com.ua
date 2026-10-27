import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './MaterialsMenu.css';

export default function MaterialsMenu({ links, mobile = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const active = links.some(({ to }) => pathname === to || pathname.startsWith(`${to}/`));
  useEffect(() => {
    const outside = (event) => { if (!ref.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === 'Escape') { setOpen(false); ref.current?.querySelector('button')?.focus(); } };
    if (open) {
      document.addEventListener('pointerdown', outside);
      document.addEventListener('keydown', escape);
    }
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  useEffect(() => { setOpen(false); }, [pathname]);
  const Tag = mobile ? 'div' : 'li';
  const id = mobile ? 'materials-mobile-links' : 'materials-desktop-links';
  return <Tag ref={ref} className={`materials-nav${mobile ? ' materials-nav-mobile' : ''}${active ? ' materials-nav-active' : ''}`}>
    <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
      {t('nav.materials', { defaultValue: 'Матеріали' })} <span aria-hidden="true">{open ? '▴' : '▾'}</span>
    </button>
    {open && <div id={id} className="materials-nav-links">
      {links.map(({ to, title }) => <Link key={to} to={to} aria-current={pathname === to ? 'page' : undefined} onClick={() => setOpen(false)}>{title}</Link>)}
    </div>}
  </Tag>;
}
