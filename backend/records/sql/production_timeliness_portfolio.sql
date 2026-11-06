-- Set-based counterpart of dbo.GetABCProductionTimelinessByContractorV2.
-- The caller supplies the authorized contractor IDs and date range.
SET NOCOUNT ON;


    DECLARE @NextDateTo DATE = DATEADD(DAY, 1, @DateTo);
    DECLARE @PrevYearStart DATE = DATEFROMPARTS(YEAR(@DateFrom) - 1, 1, 1);

    DECLARE @MainItem BINARY(16) =
        0x99B8002590633BB311E177FF631F08AD;

    DECLARE @OrderRefType BINARY(1) = 0x08;
    DECLARE @OrderRefKind BINARY(4) = 0x0000017D;

    DROP TABLE IF EXISTS #EligibleOrders;
    DROP TABLE IF EXISTS #OrderIDsABC;
    DROP TABLE IF EXISTS #OrdersABCLast;
    DROP TABLE IF EXISTS #ProdOrders;
    DROP TABLE IF EXISTS #ProdReports;

    SELECT
        Z._IDRRef AS OrderID
    INTO #EligibleOrders
    FROM [oknastyle].[dbo].[_Document381] Z

    INNER JOIN
        [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] BZ
        WITH (NOLOCK)
        ON BZ.[Ссылка] = Z._IDRRef

    LEFT JOIN
        [oknastyle_biV2].[dbo].[Справочники.БВ_СостоянияЗаказов] BS
        WITH (NOLOCK)
        ON BS.[Ссылка] = BZ.[БВ_СостояниеЗаказа]

    WHERE
        Z._Marked = 0x00

        AND Z._Fld6187RRef IN (
            SELECT CONVERT(binary(16), [value], 2)
            FROM OPENJSON(@ContractorIDs)
        )

        AND ISNULL(BS.[Наименование], N'')
            COLLATE Ukrainian_CI_AS <> N'Отказ'

        AND BS.[Наименование] = N'Подтверждено'

        AND TRY_CAST(BS.[Код] AS INT) >= 2

        AND
        (
               Z._Number LIKE N'15-%'
            OR Z._Number LIKE N'01-%'
            OR Z._Number LIKE N'02-%'
            OR Z._Number LIKE N'22-%'
            OR Z._Number LIKE N'45-%'
            OR Z._Number LIKE N'55-%'
            OR Z._Number LIKE N'56-%'
            OR Z._Number LIKE N'65-%'
        );

    CREATE UNIQUE CLUSTERED INDEX IX_EligibleOrders_OrderID
        ON #EligibleOrders(OrderID);

    SELECT
        Z._IDRRef AS OrderID
    INTO #OrderIDsABC
    FROM [oknastyle].[dbo].[_Document381] Z

    INNER JOIN #EligibleOrders EO
        ON EO.OrderID = Z._IDRRef

    CROSS APPLY
    (
        SELECT TOP (1)
            HH.Период AS CalcPeriod

        FROM
            [oknastyle_biV2].[dbo].
            [РегистрыСведений.ГМ_ИсторияРасчетаДатыПроизводства] HH
            WITH (NOLOCK)

        WHERE
            HH.ЗаказПокупателя = Z._IDRRef

            AND HH.Период >= @DateFrom

            AND HH.Период < @NextDateTo

            AND HH.Расшифровка LIKE N'%ИТОГО ABC%'

        ORDER BY
            HH.Период DESC
    ) H

    WHERE
        Z._Marked = 0x00

    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_OrderIDsABC_OrderID
        ON #OrderIDsABC(OrderID);

    SELECT
        Z._IDRRef AS OrderID,

        Z._Number AS OrderNumber,

        CASE
            WHEN YEAR(Z._Date_Time) < 3753
                THEN Z._Date_Time
            ELSE
                DATEADD(YEAR, -2000, Z._Date_Time)
        END AS OrderDate,

        Z._Fld6187RRef AS ContractorID,

        Z._Fld6278 AS ClientOrderNumber,

        Z._Fld6197 AS OrderSum,

        ISNULL(
            V_Base.[Наименование],
            V.[Наименование]
        ) AS Currency,

        Z._Fld6216 AS ConstructionsCount,

        H.CalcPeriod,

        H.PlannedProductionDate,

        CAST(
            H.PlannedProductionDate AS DATE
        ) AS PlannedProductionDateOnly,

        H.Расшифровка,

        H.ABC

    INTO #OrdersABCLast

    FROM #OrderIDsABC O

    INNER JOIN
        [oknastyle].[dbo].[_Document381] Z
        ON Z._IDRRef = O.OrderID

    INNER JOIN
        [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] BZ
        WITH (NOLOCK)
        ON BZ.[Ссылка] = Z._IDRRef

    LEFT JOIN
        [oknastyle_biV2].[dbo].[Справочники.Валюты] V
        WITH (NOLOCK)
        ON V.[Ссылка] = BZ.[ВалютаДокумента]

    LEFT JOIN
        [oknastyle_biV2].[dbo].[Справочники.Валюты] V_Base
        WITH (NOLOCK)
        ON V_Base.[Ссылка] = V.[ОсновнаяВалюта]

    CROSS APPLY
    (
        SELECT TOP (1)

            HH.Период AS CalcPeriod,

            HH.ДатаПроизводства AS PlannedProductionDate,

            HH.Расшифровка,

            CASE
                WHEN HH.Расшифровка LIKE N'%ИТОГО ABC%-%A%'
                    THEN 'A'

                WHEN HH.Расшифровка LIKE N'%ИТОГО ABC%-%B%'
                    THEN 'B'

                WHEN HH.Расшифровка LIKE N'%ИТОГО ABC%-%C%'
                    THEN 'C'

                ELSE 'Other'
            END AS ABC

        FROM
            [oknastyle_biV2].[dbo].
            [РегистрыСведений.ГМ_ИсторияРасчетаДатыПроизводства] HH
            WITH (NOLOCK)

        WHERE
            HH.ЗаказПокупателя = Z._IDRRef

            AND HH.Период >= @DateFrom

            AND HH.Период < @NextDateTo

            AND HH.Расшифровка LIKE N'%ИТОГО ABC%'

        ORDER BY
            HH.Период DESC

    ) H

    OPTION (FORCE ORDER, LOOP JOIN, RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_OrdersABCLast_OrderID
        ON #OrdersABCLast(OrderID);

    SELECT
        ZNPP._Fld6127_RRRef AS OrderID,

        MIN
        (
            CASE
                WHEN YEAR(ZNP._Fld6108) < 3753
                    THEN ZNP._Fld6108
                ELSE
                    DATEADD(YEAR, -2000, ZNP._Fld6108)
            END
        ) AS StartProductionMin,

        MAX
        (
            CASE
                WHEN YEAR(ZNP._Fld6108) < 3753
                    THEN ZNP._Fld6108
                ELSE
                    DATEADD(YEAR, -2000, ZNP._Fld6108)
            END
        ) AS StartProductionMax

    INTO #ProdOrders

    FROM #OrdersABCLast OA

    INNER JOIN
        [oknastyle].[dbo].[_Document380_VT6116] ZNPP
        ON ZNPP._Fld6127_RRRef = OA.OrderID

        AND ZNPP._Fld6127_TYPE = @OrderRefType

        AND ZNPP._Fld6127_RTRef = @OrderRefKind

        AND ZNPP._Fld6118RRef = @MainItem

    INNER JOIN
        [oknastyle].[dbo].[_Document380] ZNP
        ON ZNP._IDRRef = ZNPP._Document380_IDRRef

        AND ZNP._Posted = 0x01

        AND
        (
            CASE
                WHEN YEAR(ZNP._Date_Time) < 3753
                    THEN ZNP._Date_Time
                ELSE
                    DATEADD(YEAR, -2000, ZNP._Date_Time)
            END
        ) >= @PrevYearStart

    group by
        ZNPP._Fld6127_RRRef

    OPTION (FORCE ORDER, LOOP JOIN, RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_ProdOrders_OrderID
        ON #ProdOrders(OrderID);

    SELECT
        OPP._Fld10575_RRRef AS OrderID,

        SUM(OPP._Fld10543) AS ProducedTotal,

        MIN
        (
            CASE
                WHEN YEAR(OP._Date_Time) < 3753
                    THEN OP._Date_Time
                ELSE
                    DATEADD(YEAR, -2000, OP._Date_Time)
            END
        ) AS ReadyProductionMin,

        MAX
        (
            CASE
                WHEN YEAR(OP._Date_Time) < 3753
                    THEN OP._Date_Time
                ELSE
                    DATEADD(YEAR, -2000, OP._Date_Time)
            END
        ) AS ReadyProductionMax,

        CAST
        (
            MAX
            (
                CASE
                    WHEN YEAR(OP._Date_Time) < 3753
                        THEN OP._Date_Time
                    ELSE
                        DATEADD(YEAR, -2000, OP._Date_Time)
                END
            )
            AS DATE
        ) AS ReadyProductionDateOnly

    INTO #ProdReports

    FROM #OrdersABCLast OA

    INNER JOIN
        [oknastyle].[dbo].[_Document488_VT10534] OPP
        ON OPP._Fld10575_RRRef = OA.OrderID

        AND OPP._Fld10575_TYPE = @OrderRefType

        AND OPP._Fld10575_RTRef = @OrderRefKind

        AND OPP._Fld10548RRef = @MainItem

    INNER JOIN
        [oknastyle].[dbo].[_Document488] OP
        ON OP._IDRRef = OPP._Document488_IDRRef

        AND OP._Posted = 0x01

        AND
        (
            CASE
                WHEN YEAR(OP._Date_Time) < 3753
                    THEN OP._Date_Time
                ELSE
                    DATEADD(YEAR, -2000, OP._Date_Time)
            END
        ) >= @PrevYearStart

    group by
        OPP._Fld10575_RRRef

    OPTION (FORCE ORDER, LOOP JOIN, RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_ProdReports_OrderID
        ON #ProdReports(OrderID);

    SELECT
        OA.ABC,

        OA.Currency,

        COUNT(*) AS OrdersCount,

        SUM
        (
            CASE
                WHEN PR.ReadyProductionDateOnly IS NOT NULL
                 AND PR.ReadyProductionDateOnly
                        <= OA.PlannedProductionDateOnly
                    THEN 1
                ELSE 0
            END
        ) AS InTimeCount,

        SUM
        (
            CASE
                WHEN PR.ReadyProductionDateOnly IS NOT NULL
                 AND PR.ReadyProductionDateOnly
                        > OA.PlannedProductionDateOnly
                    THEN 1
                ELSE 0
            END
        ) AS DelayedCount,

        SUM
        (
            CASE
                WHEN PR.ReadyProductionDateOnly IS NULL
                    THEN 1
                ELSE 0
            END
        ) AS NotFinishedCount,

        CAST
        (
            100.0
            *
            SUM
            (
                CASE
                    WHEN PR.ReadyProductionDateOnly IS NOT NULL
                     AND PR.ReadyProductionDateOnly
                            <= OA.PlannedProductionDateOnly
                        THEN 1
                    ELSE 0
                END
            )
            /
            NULLIF
            (
                SUM
                (
                    CASE
                        WHEN PR.ReadyProductionDateOnly IS NOT NULL
                            THEN 1
                        ELSE 0
                    END
                ),
                0
            )

            AS DECIMAL(10, 2)

        ) AS InTimePercent,

        AVG
        (
            CASE
                WHEN PR.ReadyProductionMax
                        > OA.PlannedProductionDate
                THEN
                    DATEDIFF
                    (
                        DAY,
                        OA.PlannedProductionDate,
                        PR.ReadyProductionMax
                    )
            END
        ) AS AvgDelayDays,

        MAX
        (
            CASE
                WHEN PR.ReadyProductionMax
                        > OA.PlannedProductionDate
                THEN
                    DATEDIFF
                    (
                        DAY,
                        OA.PlannedProductionDate,
                        PR.ReadyProductionMax
                    )
            END
        ) AS MaxDelayDays,

        SUM
        (
            ISNULL(OA.OrderSum, 0)
        ) AS TotalSum,

        SUM
        (
            ISNULL(OA.ConstructionsCount, 0)
        ) AS TotalConstructions,

        SUM
        (
            ISNULL(PR.ProducedTotal, 0)
        ) AS ProducedTotal

    FROM #OrdersABCLast OA

    LEFT JOIN #ProdReports PR
        ON PR.OrderID = OA.OrderID

    group by
        OA.ABC,
        OA.Currency

    ORDER BY
        CASE OA.ABC
            WHEN 'A' THEN 1
            WHEN 'B' THEN 2
            WHEN 'C' THEN 3
            ELSE 4
        END,
        OA.Currency

    OPTION (RECOMPILE);

    SELECT
        OA.ABC,

        OA.OrderNumber,

        OA.ClientOrderNumber,

        OA.OrderDate,

        OA.CalcPeriod,

        OA.PlannedProductionDate,

        OA.Расшифровка,

        PO.StartProductionMin,

        PO.StartProductionMax,

        PR.ReadyProductionMin,

        PR.ReadyProductionMax,

        DATEDIFF
        (
            DAY,
            OA.PlannedProductionDate,
            PR.ReadyProductionMax
        ) AS DelayDays,

        CASE

            WHEN PR.ReadyProductionMax IS NULL
                THEN N'У виробництві'

            WHEN PR.ReadyProductionDateOnly
                    <= OA.PlannedProductionDateOnly
                THEN N'Вчасно'

            ELSE
                N'Запізнення'

        END AS ProductionStatus,

        CASE

            WHEN PR.ReadyProductionMax IS NULL
                THEN NULL

            WHEN PR.ReadyProductionDateOnly
                    <= OA.PlannedProductionDateOnly
                THEN 0

            ELSE
                DATEDIFF
                (
                    DAY,
                    OA.PlannedProductionDate,
                    PR.ReadyProductionMax
                )

        END AS LateDays,

        CASE

            WHEN PR.ReadyProductionMax IS NULL
                THEN N'У виробництві'

            WHEN DATEDIFF
                 (
                     DAY,
                     OA.PlannedProductionDate,
                     PR.ReadyProductionMax
                 ) <= 0
                THEN N'Вчасно'

            WHEN DATEDIFF
                 (
                     DAY,
                     OA.PlannedProductionDate,
                     PR.ReadyProductionMax
                 ) = 1
                THEN N'+1 день'

            WHEN DATEDIFF
                 (
                     DAY,
                     OA.PlannedProductionDate,
                     PR.ReadyProductionMax
                 ) BETWEEN 2 AND 3
                THEN N'+2-3 дні'

            WHEN DATEDIFF
                 (
                     DAY,
                     OA.PlannedProductionDate,
                     PR.ReadyProductionMax
                 ) BETWEEN 4 AND 7
                THEN N'+4-7 днів'

            ELSE
                N'>7 днів'

        END AS DelayBucket,

        OA.OrderSum,

        OA.Currency,

        OA.ConstructionsCount,

        ISNULL(PR.ProducedTotal, 0) AS ProducedTotal,

        OA.OrderID

    FROM #OrdersABCLast OA

    LEFT JOIN #ProdOrders PO
        ON PO.OrderID = OA.OrderID

    LEFT JOIN #ProdReports PR
        ON PR.OrderID = OA.OrderID

    ORDER BY

        CASE OA.ABC
            WHEN 'A' THEN 1
            WHEN 'B' THEN 2
            WHEN 'C' THEN 3
            ELSE 4
        END,

        LateDays DESC,

        OA.CalcPeriod DESC

    OPTION (RECOMPILE);

    DROP TABLE IF EXISTS #ProdReports;
    DROP TABLE IF EXISTS #ProdOrders;
    DROP TABLE IF EXISTS #OrdersABCLast;
    DROP TABLE IF EXISTS #OrderIDsABC;
    DROP TABLE IF EXISTS #EligibleOrders;
