from pathlib import Path
from io import BytesIO
import importlib.util
from pypdf import PdfReader
import pypdfium2

root = Path(__file__).resolve().parents[2]
source = root / 'backend/payments/transfer_pdf.py'
spec = importlib.util.spec_from_file_location('transfer_pdf', source)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
rows = [
    {'date': '14.10.2026 10:20', 'amount': '15115.00', 'currency': 'UAH', 'comment': 'Передано кошти водію. Фото додано на порталі.', 'author': 'Тестовий дилер'},
    {'date': '13.10.2026 17:35', 'amount': '2500.50', 'currency': 'UAH', 'comment': 'Додатковий коментар із українськими літерами: ї, є, ґ. ' * 8, 'author': 'Менеджер із довгим прізвищем'},
    {'date': '12.10.2026 09:10', 'amount': '100.00', 'currency': 'EUR', 'comment': '<test> & text', 'author': 'Тестовий користувач'},
]
font = root / 'frontend/public/assets/fonts/Manrope/Manrope-Regular.ttf'
for index, row in enumerate(rows):
    row['dealer'] = 'Тестовий дилер із довгою назвою' if index == 1 else 'Приклад дилера'
data = module.build_transfer_history_pdf(rows, font, '9056e09d-a7a0-11ed-8142-74867ad9d525')
output = root / 'tmp/pdfs/transfers-check.pdf'
output.write_bytes(data)
reader = PdfReader(BytesIO(data))
text = '\n'.join(page.extract_text() for page in reader.pages)
assert 'Подані дані' in text and 'Усього подань: 3' in text and '17 615,50' in text
assert '<test> & text' in text and '100,00 EUR' in text
pdf = pypdfium2.PdfDocument(data)
for index in range(len(pdf)):
    pdf[index].render(scale=1.5).to_pil().save(root / f'tmp/pdfs/transfers-check-{index}.png')
print(f'PDF verified and rendered: {len(pdf)} page(s)')
