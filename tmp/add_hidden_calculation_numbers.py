from pathlib import Path
p=Path('/var/www/html/ordersportal.vstg.com.ua/backend/records/views.py');s=p.read_text(encoding='utf-8-sig');s='from .calculation_metadata import attach_calculation_metadata\n'+s
s=s.replace('return attach_34_order_bindings(formatted_calcs)','return attach_calculation_metadata(attach_34_order_bindings(formatted_calcs))')
s=s.replace('formatted_calcs = attach_34_order_bindings(formatted_calcs)','formatted_calcs = attach_calculation_metadata(attach_34_order_bindings(formatted_calcs))')
p.write_text(s,encoding='utf-8')
