import ast
from io import BytesIO
from decimal import Decimal
from pathlib import Path
from types import SimpleNamespace
from xml.sax.saxutils import escape
import pypdfium2
from pypdf import PdfReader

root = Path(__file__).resolve().parents[2]
source = root / "backend/records/deliveries_pdf.py"
tree = ast.parse(source.read_text(encoding="utf-8"))
functions = [node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.ClassDef)) and node.name in {"build_deliveries_pdf", "deliveries_font_path", "construction_total", "PdfFontError", "money_text"}]
namespace = dict(BytesIO=BytesIO, Decimal=Decimal, Path=Path, escape=escape, __file__=str(source), settings=SimpleNamespace(BASE_DIR=root / "backend"))
exec(compile(ast.Module(body=functions, type_ignores=[]), str(source), "exec"), namespace)
rows = [{"day": "2026-10-10", "time": "09:30", "number": "01-363132", "dealer": "Томищ Василь Степанович ПП", "count": "3"}, {"day": "2026-10-10", "time": "12:45", "number": "45-179571", "dealer": "Дилер із довгою назвою & українськими літерами ї є ґ", "count": "8"}, {"day": "2026-10-11", "time": "10:00", "number": "22-11840", "dealer": "Кочиш Іван ПП", "count": "1"}]
for index, row in enumerate(rows):
    row["calculation"] = f"00010694{index}"
    row.update(amount=Decimal("19900"), paid=Decimal("10000"), debt=Decimal("9900"), currency="EUR" if index == 2 else "UAH")
data = namespace["build_deliveries_pdf"](rows)
output = root / "tmp/pdfs/deliveries-check.pdf"
output.write_bytes(data)
reader = PdfReader(BytesIO(data))
assert all(page.mediabox.width < page.mediabox.height for page in reader.pages)
text = "\n".join(page.extract_text() for page in reader.pages)
assert "Томищ Василь" in text and "01-363132" in text and "10.10.2026" in text
assert "000106940" in text and "Усього конструкцій: 12" in text and "Разом за дату" in text
pdf = pypdfium2.PdfDocument(data)
pdf[0].render(scale=1.5).to_pil().save(output.with_suffix(".png"))
print(f"PDF verified: {len(reader.pages)} page(s)")
without_amounts = namespace["build_deliveries_pdf"](rows, include_amounts=False)
without_reader = PdfReader(BytesIO(without_amounts))
assert all(page.mediabox.width < page.mediabox.height for page in without_reader.pages)
without_text = '\n'.join(page.extract_text() for page in without_reader.pages)
assert 'Усього конструкцій: 12' in without_text and '01-363132' in without_text
assert 'Сума замовлення' not in without_text and 'Оплачено' not in without_text and 'Борг' not in without_text
assert '19 900' not in without_text and 'UAH' not in without_text and 'EUR' not in without_text
(root / 'tmp/pdfs/deliveries-without-amounts.pdf').write_bytes(without_amounts)
pypdfium2.PdfDocument(without_amounts)[0].render(scale=1.5).to_pil().save(root / 'tmp/pdfs/deliveries-without-amounts.png')
print('PDF without financial columns and totals verified.')
