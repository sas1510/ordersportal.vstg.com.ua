from pathlib import Path
for name,is_admin in [('HeaderAdmin.jsx',True),('HeaderDealer.jsx',False)]:
    p=Path('frontend/src/components/headers')/name
    s=p.read_text(encoding='utf-8-sig')
    anchor='<div className="ml-auto flex items-center gap-5 mr-4">' if is_admin else '<div className="ml-auto flex items-center gap-5 mr-4" ref={mobileMenuRef}>'
    if 'min-w-[52px]' in s:
        continue
    position=s.rfind(anchor)
    assert position>=0,name
    button='''
            <Link
              to="/zamir"
              aria-current={location.pathname.startsWith('/zamir') ? 'page' : undefined}
              className="flex min-h-[40px] min-w-[52px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-bold leading-tight transition-colors hover:bg-[var(--header-profile-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--header-accent)]"
              style={{ color: location.pathname.startsWith('/zamir') ? 'var(--header-accent)' : 'var(--header-text)' }}
            >
              <Ruler aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
              {t('nav.measurements', { defaultValue: 'Замірник' })}
            </Link>'''
    if is_admin:
        button='\n            {(isAdmin || isManager) && <>'+button+'\n            </>}'
    s=s[:position]+s[position:].replace(anchor,anchor.replace('gap-5','gap-3')+button,1)
    p.write_text(s,encoding='utf-8')
print('Visible mobile header link added for existing authorized Zamir roles; desktop links retained.')
