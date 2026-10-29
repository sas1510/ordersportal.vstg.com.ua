from django.db import connections
with connections['default'].cursor() as c:
    c.execute("""SELECT TOP(12) A._Fld44966_RTRef AS AuthorType,CASE WHEN A._Fld44966_RRRef=A._Fld44859RRef THEN 1 ELSE 0 END AS DealerIsAuthor,COUNT_BIG(*) AS N,SUM(A._Fld44861) AS Qty FROM [oknastyle].[dbo].[_Document44856] A WHERE A._Marked=0x00 AND (A._Date_Time>='20261001' AND A._Date_Time<'20261030' OR A._Date_Time>='40261001' AND A._Date_Time<'40261030') GROUP BY A._Fld44966_RTRef,CASE WHEN A._Fld44966_RRRef=A._Fld44859RRef THEN 1 ELSE 0 END ORDER BY N DESC""")
    print([(bytes(r[0]).hex(),r[1],r[2],str(r[3])) for r in c.fetchall()])
