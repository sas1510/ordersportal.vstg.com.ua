from pathlib import Path
p=Path('tmp/add_zamir_header_shortcut.py');s=p.read_text(encoding='utf-8-sig')
s=s.replace("    assert s.count(anchor)==1,(name,s.count(anchor))", "    if 'min-w-[52px]' in s:\n        continue\n    position=s.rfind(anchor)\n    assert position>=0,name")
s=s.replace("s=s.replace(anchor,anchor.replace('gap-5','gap-3')+button)","s=s[:position]+s[position:].replace(anchor,anchor.replace('gap-5','gap-3')+button,1)")
p.write_text(s,encoding='utf-8')
