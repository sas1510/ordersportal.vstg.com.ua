SELECT P.Ссылка, RTRIM(P.Номер), P.Дата, P.СуммаДокумента,
       RTRIM(V.Код), V.Наименование, M.Ссылка, RTRIM(M.Номер)
FROM [WST\WST].[oknastyle_biV2].[dbo].[Документы.ПриходныйКассовыйОрдер] AS P
INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ШБ_Маршрутизация] AS M
    ON M.Ссылка = P.Маршрутизация
LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Валюты] AS V
    ON V.Ссылка = P.ВалютаДокумента
WHERE P.Маршрутизация = %s AND P.Контрагент = %s
    AND P.Проведен = 0x01 AND P.ПометкаУдаления = 0x00
ORDER BY P.Дата, P.Ссылка
