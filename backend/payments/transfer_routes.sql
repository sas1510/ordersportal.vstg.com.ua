-- Keep every point of each target route until day offsets are calculated.
WITH TargetRoutes AS (
    SELECT DISTINCT R.Ссылка AS RoutingID
    FROM [WST\WST].[oknastyle_biV2].[dbo].[Документы.ШБ_Маршрутизация.Маршрут] R
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ШБ_Маршрутизация] M ON M.Ссылка = R.Ссылка
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] Z ON Z.Ссылка = R.ЗаказПокупателя
    WHERE Z.Контрагент = %s AND M.Проведен = 0x01
), RouteRows AS (
SELECT
        R.Ссылка AS RoutingID,
        R.НомерСтроки,
        R.ПорядковыйНомер AS DeliverySequence,
        TRY_CONVERT(INT, R.ПорядковыйНомер) AS DeliverySequenceInt,
        R.ЗаказПокупателя AS OrderID,
        ZP.Контрагент AS ContractorID,

        CASE
            WHEN R.ЧасПрибытия IS NULL THEN NULL
            ELSE CONVERT(TIME(0), R.ЧасПрибытия)
        END AS ArrivalTime,

        RAW._Number AS RouteNumber,

        /* Первый день разгрузки */
        CASE
            WHEN RAW._Fld25861 IS NULL THEN NULL
            WHEN YEAR(RAW._Fld25861) >= 4000
                THEN CONVERT(DATE, DATEADD(YEAR, -2000, RAW._Fld25861))
            WHEN YEAR(RAW._Fld25861) <= 2001
                THEN NULL
            ELSE CONVERT(DATE, RAW._Fld25861)
        END AS FirstUnloadDate,

        /* Последний день разгрузки */
        CASE
            WHEN RAW._Fld31463 IS NULL THEN NULL
            WHEN YEAR(RAW._Fld31463) >= 4000
                THEN CONVERT(DATE, DATEADD(YEAR, -2000, RAW._Fld31463))
            WHEN YEAR(RAW._Fld31463) <= 2001
                THEN NULL
            ELSE CONVERT(DATE, RAW._Fld31463)
        END AS LastUnloadDate

    FROM TargetRoutes AS TR
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ШБ_Маршрутизация.Маршрут] AS R
        ON R.Ссылка = TR.RoutingID
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] AS ZP
        ON ZP.Ссылка = R.ЗаказПокупателя
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document25843] AS RAW
        ON RAW._IDRRef = R.Ссылка
    WHERE R.ЧасПрибытия IS NOT NULL

)
, PreviousTimes AS
    (
        SELECT
            RR.*,

            LAG(RR.ArrivalTime) OVER
            (
                PARTITION BY RR.RoutingID
                ORDER BY RR.НомерСтроки
            ) AS PreviousArrivalTime,

            LAG(RR.DeliverySequence) OVER
            (
                PARTITION BY RR.RoutingID
                ORDER BY RR.НомерСтроки
            ) AS PreviousDeliverySequence,

            LAG(RR.ContractorID) OVER
            (
                PARTITION BY RR.RoutingID
                ORDER BY RR.НомерСтроки
            ) AS PreviousContractorID

        FROM RouteRows AS RR
    ),
    RawDayOffsets AS
    (
        SELECT
            P.*,

            SUM
            (
                CASE
                    WHEN P.PreviousArrivalTime IS NOT NULL
                     AND P.ArrivalTime < P.PreviousArrivalTime

                     /* Порядковий номер 1 завжди перший день.
                        Нечислові значення типу KL001 не викликають помилку. */
                     AND ISNULL(P.DeliverySequenceInt, 0) > 1

                     /* Має бути інша точка маршруту.
                        Порівнюємо як текст, щоб KL001 / KL002 теж оброблялися безпечно. */
                     AND ISNULL(CONVERT(NVARCHAR(100), P.DeliverySequence), N'')
                         <> ISNULL(CONVERT(NVARCHAR(100), P.PreviousDeliverySequence), N'')

                     /* І інший контрагент */
                     AND ISNULL(
                             P.ContractorID,
                             0x00000000000000000000000000000000
                         )
                         <>
                         ISNULL(
                             P.PreviousContractorID,
                             0x00000000000000000000000000000000
                         )
                        THEN 1
                    ELSE 0
                END
            ) OVER
            (
                PARTITION BY P.RoutingID
                ORDER BY P.НомерСтроки
                ROWS UNBOUNDED PRECEDING
            ) AS RawDeliveryDayOffset

        FROM PreviousTimes AS P
    ),
    FixedDayOffsets AS
    (
        SELECT
            W.*,

            CASE
                WHEN W.FirstUnloadDate IS NULL
                    THEN NULL

                WHEN W.LastUnloadDate IS NULL
                    THEN W.RawDeliveryDayOffset

                WHEN W.RawDeliveryDayOffset >
                     DATEDIFF(DAY, W.FirstUnloadDate, W.LastUnloadDate)
                    THEN DATEDIFF(DAY, W.FirstUnloadDate, W.LastUnloadDate)

                ELSE W.RawDeliveryDayOffset
            END AS DeliveryDayOffset

        FROM RawDayOffsets AS W
    )
SELECT DISTINCT D.RoutingID, D.RouteNumber, Z.Номер
FROM FixedDayOffsets D
INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] Z ON Z.Ссылка = D.OrderID
WHERE D.ContractorID = %s
  AND DATEADD(DAY, D.DeliveryDayOffset, D.FirstUnloadDate) = %s
ORDER BY D.RouteNumber, Z.Номер
