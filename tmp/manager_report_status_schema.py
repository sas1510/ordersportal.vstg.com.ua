import zlib
from django.db import connections
from pathlib import Path
with connections['default'].cursor() as c:
    c.execute("SELECT FileName,BinaryData FROM [oknastyle].[dbo].[Config] WHERE FileName=%s",['7ed21b1e-98e8-443a-aba2-4435f8217fcd'])
    for name,data in c.fetchall():
        raw=zlib.decompress(bytes(data),-15).decode('utf-8-sig')
        Path('tmp/manager_application_state_metadata.txt').write_text(raw,encoding='utf-8')
        print(raw[:16000])
