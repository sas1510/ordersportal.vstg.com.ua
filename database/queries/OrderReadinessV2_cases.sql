-- Read-only checks of the production expression used in V8/V9.
WITH RequiredItems AS (
 SELECT * FROM (VALUES
 (1,1,1,0,2,2),(1,2,1,1,3,3),
 (2,1,1,0,2,2),(2,2,1,1,3,3),
 (3,1,1,0,2,2),(3,2,1,1,3,3),
 (4,2,1,1,3,3), (5,2,1,1,3,3), (6,2,1,1,2,2), (7,2,1,1,2,2)
 ) V(OrderID,ItemID,CharacteristicID,IsPurchased,RequiredQty,RequiredBaseQty)
), ProducedItems AS (
 SELECT OrderID,1 AS ItemID,1 AS CharacteristicID,ProducedQty,CONVERT(datetime,'20261020') AS ReadyMin,CONVERT(datetime,'20261020') AS ReadyMax
 FROM (VALUES (1,2),(2,2),(3,1)) V(OrderID,ProducedQty)
), PurchasedItems AS (
 SELECT OrderID,2 AS ItemID,CharacteristicID,ReceivedQty,CONVERT(datetime,'20261021') AS ReadyMin,CONVERT(datetime,'20261021') AS ReadyMax
 FROM (VALUES (1,1,3),(2,1,2),(3,1,3),(4,1,3),(6,1,1),(7,2,2)) V(OrderID,CharacteristicID,ReceivedQty)
)
, ItemReadiness AS (
        SELECT R.OrderID,R.ItemID,
               CASE WHEN R.IsPurchased=1 THEN CASE WHEN ISNULL(B.ReceivedQty,0)>=R.RequiredBaseQty AND B.ReadyMax IS NOT NULL THEN 1 ELSE 0 END
                    ELSE CASE WHEN ISNULL(P.ProducedQty,0)>=R.RequiredQty AND P.ReadyMax IS NOT NULL THEN 1 ELSE 0 END END AS IsComplete,
               CASE WHEN R.IsPurchased=1 THEN B.ReadyMin ELSE P.ReadyMin END AS ReadyMin,
               CASE WHEN R.IsPurchased=1 THEN B.ReadyMax ELSE P.ReadyMax END AS ReadyMax,
               CASE WHEN R.IsPurchased=0 THEN ISNULL(P.ProducedQty,0) ELSE 0 END AS ProducedQty
        FROM RequiredItems R
        LEFT JOIN ProducedItems P ON P.OrderID=R.OrderID AND P.ItemID=R.ItemID AND P.CharacteristicID=R.CharacteristicID
        LEFT JOIN PurchasedItems B ON B.OrderID=R.OrderID AND B.ItemID=R.ItemID AND B.CharacteristicID=R.CharacteristicID
    )
 , Actual AS (SELECT OrderID AS ЗаказРезерв,
           SUM(CASE WHEN ItemID=1 THEN ProducedQty ELSE 0 END) AS ProducedTotal,
           CASE WHEN MIN(IsComplete)=1 THEN MIN(ReadyMin) END AS ReadyMin,
           CASE WHEN MIN(IsComplete)=1 THEN MAX(ReadyMax) END AS ReadyMax
 FROM ItemReadiness GROUP BY OrderID )
SELECT A.ЗаказРезерв AS CaseID, E.Expected,
 CASE WHEN A.ReadyMax IS NOT NULL THEN 1 ELSE 0 END AS Actual,
 CASE WHEN E.Expected=CASE WHEN A.ReadyMax IS NOT NULL THEN 1 ELSE 0 END THEN 'PASS' ELSE 'FAIL' END AS Result
 FROM Actual A JOIN (VALUES (1,1),(2,0),(3,0),(4,1),(5,0),(6,0),(7,0)) E(OrderID,Expected) ON E.OrderID=A.ЗаказРезерв
 ORDER BY A.ЗаказРезерв;
