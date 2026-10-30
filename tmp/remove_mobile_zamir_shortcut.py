from pathlib import Path
for name in ['HeaderDealer.jsx','HeaderAdmin.jsx']:
    path=Path('frontend/src/components/headers')/name
    text=path.read_text(encoding='utf-8-sig')
    if name=='HeaderAdmin.jsx':
        start=text.index('            {(isAdmin || isManager) && <>\n            <Link\n              to="/zamir"')
        end=text.index('            </>}',start)+len('            </>}\n')
    else:
        start=text.index('            <Link\n              to="/zamir"\n              aria-current=')
        end=text.index('            </Link>',start)+len('            </Link>\n')
    assert 'min-w-[52px]' in text[start:end]
    text=text[:start]+text[end:]
    assert 'min-w-[52px]' not in text
    assert "to: '/zamir'" in text
    path.write_text(text,encoding='utf-8')
print('Removed mobile header shortcuts; Zamir menu links preserved.')
