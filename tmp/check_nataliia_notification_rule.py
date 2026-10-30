import ast
from types import SimpleNamespace
from pathlib import Path
source=Path('/var/www/html/ordersportal.vstg.com.ua/backend/chat/consumers/consumers.py').read_text(encoding='utf-8-sig')
tree=ast.parse(source)
expr=next(n.value for n in ast.walk(tree) if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='should_duplicate_to_hardcoded_manager' for t in n.targets))
code=compile(ast.Expression(expr),'<notification-rule>','eval')
for role in ('customer','manager','region_manager','branch_manager','admin','director','operator'):
 for kind in (1,2,3):
  for recipient in ('nataliia','other'):
   actual=bool(eval(code,{'self':SimpleNamespace(user=SimpleNamespace(role=role)),'t_type':kind,'HARDCODED_DUPLICATE_MANAGER_GUID':'nataliia','recipient_id_1c':recipient}))
   expected=role in {'customer','manager','region_manager','branch_manager'} and kind==1 and recipient!='nataliia'
   assert actual==expected,(role,kind,recipient)
assert "if getattr(self.user, 'role', '') == 'customer' and not is_recipient_active:" in source
print('42 routing cases passed; primary customer-only rule preserved')
