SET NOCOUNT ON;
DROP TABLE IF EXISTS #Notice70OrderIDs;
DROP TABLE IF EXISTS #Notice70RoutingOrders;
DROP TABLE IF EXISTS #Notice70RoutingDelivery;
DROP TABLE IF EXISTS #Notice70RouteRows;
DROP TABLE IF EXISTS #Notice70RouteSchedule;
SELECT Z.Ссылка AS OrderID, Z.Номер AS OrderNumber
INTO #Notice70OrderIDs
FROM [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] Z
WHERE Z.Контрагент = %s AND Z.Номер LIKE N'70-%%'
  AND Z.ПометкаУдаления = 0x00 AND Z.Проведен = 0x01;
CREATE UNIQUE CLUSTERED INDEX IX_Notice70Orders ON #Notice70OrderIDs(OrderID);
    SELECT DISTINCT
        R.Ссылка AS RoutingID,
        R.ЗаказПокупателя AS OrderID

    INTO #Notice70RoutingOrders

    FROM #Notice70OrderIDs AS O

    INNER JOIN [oknastyle_biV2].[dbo].
         [Документы.ШБ_Маршрутизация.Маршрут] AS R

        ON R.ЗаказПокупателя =
           O.OrderID

    WHERE R.ЗаказПокупателя IS NOT NULL

    OPTION (RECOMPILE);


    CREATE UNIQUE CLUSTERED INDEX
        IX_RoutingOrders_RoutingOrder
        ON #Notice70RoutingOrders
           (
               RoutingID,
               OrderID
           );




    /* ============================================================
       ВСІ РЯДКИ ПОТРІБНИХ МАРШРУТІВ

       День доставки рахуємо по переходу часу через 00:00,
       але НЕ вважаємо це новим днем, якщо:
       - ПорядковыйНомер = 1;
       - порядковий номер не змінився;
       - контрагент не змінився.

       Додатково DeliveryDayOffset обмежуємо діапазоном
       FirstUnloadDate -> LastUnloadDate.
       ============================================================ */

    ;WITH TargetRoutes AS
    (
        SELECT DISTINCT
            RoutingID
        FROM #Notice70RoutingOrders
    )
    SELECT
        R.Ссылка AS RoutingID,
        R.НомерСтроки,
        R.ПорядковыйНомер AS DeliverySequence,
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

    INTO #Notice70RouteRows
    FROM TargetRoutes AS TR
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ШБ_Маршрутизация.Маршрут] AS R
        ON R.Ссылка = TR.RoutingID
    LEFT JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] AS ZP
        ON ZP.Ссылка = R.ЗаказПокупателя
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document25843] AS RAW
        ON RAW._IDRRef = R.Ссылка
    WHERE R.ЧасПрибытия IS NOT NULL
    OPTION (RECOMPILE);

    CREATE CLUSTERED INDEX IX_RouteRows_RouteLine
        ON #Notice70RouteRows(RoutingID, НомерСтроки);

    CREATE NONCLUSTERED INDEX IX_RouteRows_OrderID
        ON #Notice70RouteRows(OrderID);

    /* ============================================================
       ВИЗНАЧЕННЯ КОНКРЕТНОГО ДНЯ ДОСТАВКИ
       ============================================================ */

    ;WITH PreviousTimes AS
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

        FROM #Notice70RouteRows AS RR
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

                     /* Порядковий номер 1 завжди перший день */
                     /* Порядковий номер 1 завжди перший день.
                           Якщо значення не числове (наприклад KL001), цю перевірку пропускаємо */
                        AND (
                            TRY_CONVERT(INT, P.DeliverySequence) IS NULL
                            OR TRY_CONVERT(INT, P.DeliverySequence) > 1
                        )

                        /* Має бути інша точка маршруту */
                        AND ISNULL(
                                CONVERT(NVARCHAR(100), P.DeliverySequence),
                                N''
                            )
                            <>
                            ISNULL(
                                CONVERT(NVARCHAR(100), P.PreviousDeliverySequence),
                                N''
                            )

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
    SELECT
        D.RoutingID,
        D.НомерСтроки,
        D.DeliverySequence,
        D.OrderID,
        D.ContractorID,
        D.RouteNumber,
        D.FirstUnloadDate,
        D.LastUnloadDate,
        D.ArrivalTime,
        D.RawDeliveryDayOffset,
        D.DeliveryDayOffset,

        CASE
            WHEN D.FirstUnloadDate IS NULL THEN NULL
            ELSE DATEADD(DAY, D.DeliveryDayOffset, D.FirstUnloadDate)
        END AS DeliveryDate,

        CASE
            WHEN D.FirstUnloadDate IS NULL
              OR D.ArrivalTime IS NULL
                THEN NULL
            ELSE DATEADD
            (
                SECOND,
                DATEDIFF
                (
                    SECOND,
                    CAST('00:00:00' AS TIME),
                    D.ArrivalTime
                ),
                CAST
                (
                    DATEADD
                    (
                        DAY,
                        D.DeliveryDayOffset,
                        D.FirstUnloadDate
                    ) AS DATETIME
                )
            )
        END AS PlannedDeliveryDateTime

    INTO #Notice70RouteSchedule
    FROM FixedDayOffsets AS D;

    CREATE CLUSTERED INDEX IX_RouteSchedule_RouteLine
        ON #Notice70RouteSchedule(RoutingID, НомерСтроки);

    CREATE NONCLUSTERED INDEX IX_RouteSchedule_OrderID
        ON #Notice70RouteSchedule(OrderID);

    /* ============================================================
       ОДИН РЯДОК МАРШРУТУ НА ЗАМОВЛЕННЯ
       ============================================================ */

    SELECT
        RO.OrderID,


        /*
            Старе поле.
            Залишаємо для сумісності.
        */
        MAX(
            CASE
                WHEN M.ДатаЗагрузкиМаршрута IS NULL
                    THEN NULL

                WHEN YEAR(
                    M.ДатаЗагрузкиМаршрута
                ) >= 4000
                    THEN DATEADD(
                        YEAR,
                        -2000,
                        M.ДатаЗагрузкиМаршрута
                    )

                WHEN YEAR(
                    M.ДатаЗагрузкиМаршрута
                ) <= 2001
                    THEN NULL

                ELSE M.ДатаЗагрузкиМаршрута
            END
        ) AS PlannedDeliveryDate,


        /* Первый день разгрузки */
        MAX(
            RS.FirstUnloadDate
        ) AS FirstUnloadDate,


        /* Последний день разгрузки */
        MAX(
            RS.LastUnloadDate
        ) AS LastUnloadDate,


        /* Час прибуття конкретного замовлення */
        MAX(
            RS.ArrivalTime
        ) AS RouteArrivalTime,


        /*
            НОВЕ ПОЛЕ:
            конкретна дата + час прибуття
            конкретного замовлення.
        */
        MAX(
            RS.PlannedDeliveryDateTime
        ) AS PlannedDeliveryDateTime,


        MAX(
            SM.Наименование
        ) AS RouteStatus

    INTO #Notice70RoutingDelivery

    FROM #Notice70RoutingOrders AS RO

    INNER JOIN [oknastyle_biV2].[dbo].
         [Документы.ШБ_Маршрутизация] AS M

        ON M.Ссылка =
           RO.RoutingID


    LEFT JOIN #Notice70RouteSchedule AS RS

        ON RS.RoutingID =
           RO.RoutingID

       AND RS.OrderID =
           RO.OrderID


    LEFT JOIN [oknastyle_biV2].[dbo].
         [Справочники.СостоянияМаршрутов] AS SM

        ON SM.Ссылка =
           M.СостояниеМаршрута


    group by
        RO.OrderID

    OPTION (RECOMPILE);



    CREATE UNIQUE CLUSTERED INDEX
        IX_RoutingDelivery_OrderID
        ON #Notice70RoutingDelivery(OrderID);
SELECT O.OrderID, O.OrderNumber, R.PlannedDeliveryDateTime
FROM #Notice70OrderIDs O INNER JOIN #Notice70RoutingDelivery R ON R.OrderID=O.OrderID
WHERE R.PlannedDeliveryDateTime >= %s;
DROP TABLE #Notice70RouteSchedule;
DROP TABLE #Notice70RouteRows;
DROP TABLE #Notice70RoutingDelivery;
DROP TABLE #Notice70RoutingOrders;
DROP TABLE #Notice70OrderIDs;
