-- Read-only readiness diagnostic V2. Replace the binary OrderID in the first CTE.
;WITH OrderIDs AS (SELECT CONVERT(binary(16),0x9CFA4CD98F08E56D11F1CC6C02BEE889) AS OrderID),
CatalogTree AS (
        SELECT N.Ссылка AS ItemID
        FROM [oknastyle_biV2].[dbo].[Справочники.Номенклатура] N
        WHERE LTRIM(RTRIM(N.Наименование)) IN
            (N'Підвіконня', N'Подоконники', N'Подоконник', N'Відлив метал', N'Відливи', N'Отливы')
        UNION ALL
        SELECT N.Ссылка
        FROM [oknastyle_biV2].[dbo].[Справочники.Номенклатура] N
        INNER JOIN CatalogTree C ON N.Родитель=C.ItemID
    ),
PurchasedCatalog AS (SELECT DISTINCT ItemID FROM CatalogTree),
RequiredItems AS (
    SELECT T.Ссылка AS OrderID, T.Номенклатура AS ItemID,
           ISNULL(T.ХарактеристикаНоменклатуры, 0x00000000000000000000000000000000) AS CharacteristicID,
           SUM(T.Количество) AS RequiredQty,
           SUM(T.Количество * ISNULL(NULLIF(T.Коэффициент,0),1)) AS RequiredBaseQty,
           MAX(CASE WHEN C.ItemID IS NOT NULL THEN 1 ELSE 0 END) AS IsPurchased
    FROM OrderIDs O
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя.Товары] T ON T.Ссылка=O.OrderID
    LEFT JOIN PurchasedCatalog C ON C.ItemID=T.Номенклатура
    WHERE T.Номенклатура NOT IN (0x89AF92BF3734FEC94BFAB4E884CAE5C5, 0x99DC002590633BB311E22E3A03435ED0, 0xA7009E14FF7CCB2E424091FF00E66DDA)
    GROUP BY T.Ссылка,T.Номенклатура,ISNULL(T.ХарактеристикаНоменклатуры,0x00000000000000000000000000000000)
    HAVING SUM(T.Количество)>0
),
PurchaseLinks AS (
    SELECT DISTINCT R.OrderID,R.ItemID,R.CharacteristicID,T.Ссылка AS PurchaseID
    FROM RequiredItems R
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПоставщику.Товары] T
      ON T.Номенклатура=R.ItemID
     AND ISNULL(T.ХарактеристикаНоменклатуры,0x00000000000000000000000000000000)=R.CharacteristicID
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПоставщику] D ON D.Ссылка=T.Ссылка
    WHERE R.IsPurchased=1 AND D.Проведен=0x01 AND D.ПометкаУдаления=0x00
      AND T.Количество>0
      AND (T.Заказ=R.OrderID OR
          (ISNULL(T.Заказ,0x00000000000000000000000000000000)=0x00000000000000000000000000000000
           AND R.CharacteristicID<>0x00000000000000000000000000000000
           AND NOT EXISTS (
               SELECT 1 FROM [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя.Товары] X
               INNER JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] XD ON XD.Ссылка=X.Ссылка
               WHERE X.Номенклатура=R.ItemID AND X.ХарактеристикаНоменклатуры=R.CharacteristicID
                 AND X.Ссылка<>R.OrderID AND X.Количество>0
                 AND XD.Проведен=0x01 AND XD.ПометкаУдаления=0x00
           )))
      -- Do not assign an undivided supplier receipt to several customer orders.
      AND NOT EXISTS (
          SELECT 1 FROM [oknastyle_biV2].[dbo].[Документы.ЗаказПоставщику.Товары] X
          WHERE X.Ссылка=T.Ссылка AND X.Номенклатура=R.ItemID
            AND ISNULL(X.ХарактеристикаНоменклатуры,0x00000000000000000000000000000000)=R.CharacteristicID
            AND X.Количество>0 AND X.Заказ<>R.OrderID
            AND X.Заказ<>0x00000000000000000000000000000000
      )
),
PurchasedEvents AS (
    SELECT L.OrderID,L.ItemID,L.CharacteristicID,
           T.Количество * ISNULL(NULLIF(T.Коэффициент,0),1) AS BaseQty,
           CASE WHEN YEAR(D.Дата)>=3753 THEN DATEADD(YEAR,-2000,D.Дата) ELSE D.Дата END AS ReceiptDate
    FROM PurchaseLinks L
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ПоступлениеТоваровУслуг.Товары] T
      ON COALESCE(NULLIF(T.ЗаказПоставщику,0x00000000000000000000000000000000),T.Заказ)=L.PurchaseID
     AND T.Номенклатура=L.ItemID
     AND ISNULL(T.ХарактеристикаНоменклатуры,0x00000000000000000000000000000000)=L.CharacteristicID
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ПоступлениеТоваровУслуг] D ON D.Ссылка=T.Ссылка
    WHERE D.Проведен=0x01 AND D.ПометкаУдаления=0x00
    UNION ALL
    SELECT L.OrderID,L.ItemID,L.CharacteristicID,
           -T.Количество * ISNULL(NULLIF(T.Коэффициент,0),1), NULL
    FROM PurchaseLinks L
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ВозвратТоваровПоставщику.Товары] T
      ON T.Номенклатура=L.ItemID
     AND ISNULL(T.ХарактеристикаНоменклатуры,0x00000000000000000000000000000000)=L.CharacteristicID
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ВозвратТоваровПоставщику] D ON D.Ссылка=T.Ссылка
    WHERE D.Проведен=0x01 AND D.ПометкаУдаления=0x00
      AND COALESCE(NULLIF(T.Заказ,0x00000000000000000000000000000000),D.Сделка)=L.PurchaseID
),
PurchasedItems AS (
    SELECT OrderID,ItemID,CharacteristicID,SUM(BaseQty) AS ReceivedQty,
           MIN(ReceiptDate) AS ReadyMin,MAX(ReceiptDate) AS ReadyMax FROM PurchasedEvents
    GROUP BY OrderID,ItemID,CharacteristicID
)
, Production AS (
    SELECT P.ЗаказРезерв AS OrderID,P.Номенклатура AS ItemID,
           ISNULL(P.ХарактеристикаНоменклатуры,0x00000000000000000000000000000000) AS CharacteristicID,
           SUM(P.Количество) AS ProducedQty
    FROM OrderIDs O
    JOIN [oknastyle_biV2].[dbo].[Документы.ОтчетПроизводстваЗаСмену.Продукция] P ON P.ЗаказРезерв=O.OrderID
    JOIN [oknastyle_biV2].[dbo].[Документы.ОтчетПроизводстваЗаСмену] D ON D.Ссылка=P.Ссылка
    WHERE D.Проведен=0x01 AND D.ПометкаУдаления=0x00
    GROUP BY P.ЗаказРезерв,P.Номенклатура,ISNULL(P.ХарактеристикаНоменклатуры,0x00000000000000000000000000000000)
)
SELECT N.Наименование AS ItemName,
       CONVERT(varchar(34),R.CharacteristicID,1) AS CharacteristicID,
       R.IsPurchased,R.RequiredQty,R.RequiredBaseQty,
       ISNULL(B.ReceivedQty,0) AS ReceivedBaseQty,ISNULL(P.ProducedQty,0) AS ProducedQty,
       B.ReadyMax AS ReceiptDate,
       CASE WHEN R.IsPurchased=1 THEN CASE WHEN ISNULL(B.ReceivedQty,0)>=R.RequiredBaseQty AND B.ReadyMax IS NOT NULL THEN 1 ELSE 0 END
            ELSE CASE WHEN ISNULL(P.ProducedQty,0)>=R.RequiredQty THEN 1 ELSE 0 END END AS ItemReady
FROM RequiredItems R
JOIN [oknastyle_biV2].[dbo].[Справочники.Номенклатура] N ON N.Ссылка=R.ItemID
LEFT JOIN PurchasedItems B ON B.OrderID=R.OrderID AND B.ItemID=R.ItemID AND B.CharacteristicID=R.CharacteristicID
LEFT JOIN Production P ON P.OrderID=R.OrderID AND P.ItemID=R.ItemID AND P.CharacteristicID=R.CharacteristicID
ORDER BY R.IsPurchased DESC,N.Наименование,R.CharacteristicID
OPTION (MAXRECURSION 100);
