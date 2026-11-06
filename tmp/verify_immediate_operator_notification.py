import ast
from pathlib import Path
p=Path('/var/www/html/ordersportal.vstg.com.ua/backend/chat/consumers/consumers.py')
tree=ast.parse(p.read_text(encoding='utf-8-sig'))
block=next(n for n in ast.walk(tree) if isinstance(n,ast.If) and isinstance(n.test,ast.Name) and n.test.id=='should_duplicate_to_hardcoded_manager')
calls=[n for n in ast.walk(block) if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='apply_async']
assert len(calls)==1
assert not any(k.arg in {'countdown','eta'} for k in calls[0].keywords)
print('Operator 1C copy: immediate queue; no countdown or ETA')
