from django.db import connection


def attach_complaint_file_counts(rows):
    by_guid = {}
    for row in rows:
        guid = row.get("ComplaintGuid")
        if isinstance(guid, (bytes, bytearray, memoryview)) and len(guid) == 16 and any(guid):
            by_guid.setdefault(bytes(guid), []).append(row)

    ids = list(by_guid)
    for offset in range(0, len(ids), 200):
        batch = ids[offset:offset + 200]
        values = ", ".join("(CONVERT(binary(16), %s, 2))" for _ in batch)
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT C.Guid, COUNT(F._IDRRef)
                FROM (VALUES """ + values + """) AS C(Guid)
                LEFT JOIN [oknastyle].dbo._Reference252 AS F
                  ON F._Fld3500_RRRef = C.Guid
                 AND F._Fld3500_TYPE = 0x08
                 AND F._Fld3500_RTRef = 0x00000281
                 AND F._Marked = 0x00
                 AND LOWER(RIGHT(RTRIM(CONVERT(nvarchar(255), F._Fld3499)),
                     CHARINDEX('.', REVERSE(RTRIM(CONVERT(nvarchar(255), F._Fld3499))) + '.') - 1))
                     IN ('jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'ogg', 'mov')
                GROUP BY C.Guid
            """, [guid.hex().upper() for guid in batch])
            for guid, count in cursor.fetchall():
                for row in by_guid[bytes(guid)]:
                    row["ComplaintFileCount"] = count
