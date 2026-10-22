ALTER PROCEDURE [dbo].[GetPortalDealerComparisonAnalyticsV2]
    @StartDate DATE,
    @EndDate DATE,
    @Contractor_ID UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
    SET XACT_ABORT ON;


    /* ============================================================
       ПЕРЕВІРКА ПАРАМЕТРІВ
       ============================================================ */

    IF @StartDate IS NULL OR @EndDate IS NULL
    BEGIN
        THROW 50001,
              N'Необхідно передати початкову і кінцеву дати.',
              1;
    END;


    IF @StartDate > @EndDate
    BEGIN
        THROW 50002,
              N'Початкова дата не може бути більшою за кінцеву.',
              1;
    END;


    /* ============================================================
       ДАТИ
       ============================================================ */

    DECLARE @NextEndDate DATE =
        DATEADD(DAY, 1, @EndDate);


    DECLARE @RawStartDate DATETIME =
        CAST(@StartDate AS DATETIME);


    DECLARE @RawNextEndDate DATETIME =
        CAST(@NextEndDate AS DATETIME);


    DECLARE @ShiftedStartDate DATETIME =
        DATEADD(
            YEAR,
            2000,
            CAST(@StartDate AS DATETIME)
        );


    DECLARE @ShiftedNextEndDate DATETIME =
        DATEADD(
            YEAR,
            2000,
            CAST(@NextEndDate AS DATETIME)
        );


    /* ============================================================
       CLEANUP
       ============================================================ */

    DROP TABLE IF EXISTS #PortalDealers;
    DROP TABLE IF EXISTS #BaseOrderSource;
    DROP TABLE IF EXISTS #BaseOrderLinks;
    DROP TABLE IF EXISTS #EligibleOrders;
    DROP TABLE IF EXISTS #OrdersAgg;
    DROP TABLE IF EXISTS #Leaderboard;
    DROP TABLE IF EXISTS #RegionAgg;


    /* ============================================================
       1. ДИЛЕРИ ПОРТАЛУ
       ============================================================ */

    SELECT DISTINCT

        U.[UserId1C] AS ContractorGuid,


        COALESCE
        (
            NULLIF
            (
                LTRIM
                (
                    RTRIM
                    (
                        C.[Наименование]
                        COLLATE Ukrainian_CI_AS
                    )
                ),
                N''
            ),

            NULLIF
            (
                LTRIM
                (
                    RTRIM(U.[Username])
                ),
                N''
            )
            COLLATE Ukrainian_CI_AS,

            N'Без назви'
            COLLATE Ukrainian_CI_AS

        ) AS DealerName,


        CASE

            WHEN C.Ссылка =
                0x9D1C002590633BB311E18EEADB8B7114

                THEN
                    N'Чернівецька область'
                    COLLATE Ukrainian_CI_AS


            ELSE

                COALESCE
                (
                    NULLIF
                    (
                        LTRIM
                        (
                            RTRIM
                            (
                                G.[Наименование]
                                COLLATE Ukrainian_CI_AS
                            )
                        ),
                        N''
                    ),

                    N'Не визначено'
                    COLLATE Ukrainian_CI_AS
                )

        END AS RegionName,


        COALESCE
        (
            NULLIF
            (
                LTRIM
                (
                    RTRIM
                    (
                        GParent.[Наименование]
                        COLLATE Ukrainian_CI_AS
                    )
                ),
                N''
            ),

            N'Не визначено'
            COLLATE Ukrainian_CI_AS

        ) AS RegionNameParent


    INTO #PortalDealers


    FROM [portal_db].[dbo].[User] U


    LEFT JOIN
        [WST\WST].[oknastyle_biV2].[dbo].
        [Справочники.Контрагенты] C
        WITH (NOLOCK)

        ON C.[Ссылка] =
           U.[UserId1C]


    LEFT JOIN
        [WST\WST].[oknastyle_biV2].[dbo].
        [Справочники.ГруппыДоступаКонтрагентов] G
        WITH (NOLOCK)

        ON G.[Ссылка] =
           C.[ГруппаДоступаКонтрагента]


    LEFT JOIN
        [WST\WST].[oknastyle_biV2].[dbo].
        [Справочники.ГруппыДоступаКонтрагентов] GParent
        WITH (NOLOCK)

        ON GParent.[Ссылка] =
           G.[Родитель]


    WHERE
        U.[IsActive] = 1

        AND LOWER
        (
            LTRIM
            (
                RTRIM(U.[Role])
            )
        ) = N'customer'

        AND U.[UserId1C] IS NOT NULL

        AND
        (
            UPPER
            (
                LTRIM
                (
                    RTRIM
                    (
                        ISNULL
                        (
                            GParent.[Наименование],
                            N''
                        )
                    )
                )
            )
            COLLATE Ukrainian_CI_AS =
            N'ДИЛЕРА'
            COLLATE Ukrainian_CI_AS

            OR C.Ссылка =
               0x9D1C002590633BB311E18EEADB8B7114
        );


    CREATE UNIQUE CLUSTERED INDEX
        IX_PortalDealers_ContractorGuid
        ON #PortalDealers(ContractorGuid);



    /* ============================================================
       2. ПОШУК ЗАМОВЛЕНЬ ДИЛЕРІВ
       ============================================================ */

    SELECT

        ZP._IDRRef AS OrderID,

        ZP._Fld6187RRef AS ContractorGuid


    INTO #BaseOrderSource


    FROM
        [WST\WST].[oknastyle].[dbo].[_Document381]
        AS ZP

        


    INNER JOIN #PortalDealers PD

        ON PD.ContractorGuid =
           ZP._Fld6187RRef


    OPTION (RECOMPILE);


    CREATE UNIQUE CLUSTERED INDEX
        IX_BaseOrderSource_OrderID
        ON #BaseOrderSource(OrderID);



    /* ============================================================
       3. ФІЛЬТРАЦІЯ ЗАМОВЛЕНЬ ПО ДАТІ
       ============================================================ */

    SELECT

        ZP._IDRRef AS OrderID,

        ZP._Fld6187RRef AS ContractorGuid


    INTO #BaseOrderLinks


    FROM #BaseOrderSource S


    INNER JOIN
        [WST\WST].[oknastyle].[dbo].[_Document381]
        AS ZP
        

        ON ZP._IDRRef =
           S.OrderID


    WHERE

        ZP._Marked = 0x00

        AND ZP._Posted = 0x01


        AND
        (
               (
                   ZP._Date_Time >=
                       @RawStartDate

                   AND ZP._Date_Time <
                       @RawNextEndDate
               )

            OR

               (
                   ZP._Date_Time >=
                       @ShiftedStartDate

                   AND ZP._Date_Time <
                       @ShiftedNextEndDate
               )
        )


        AND
        (
               ZP._Number LIKE N'15-%'
            OR ZP._Number LIKE N'01-%'
            OR ZP._Number LIKE N'02-%'
            OR ZP._Number LIKE N'22-%'
            OR ZP._Number LIKE N'45-%'
            OR ZP._Number LIKE N'55-%'
            OR ZP._Number LIKE N'56-%'
            OR ZP._Number LIKE N'65-%'
        )


    OPTION (RECOMPILE);


    CREATE UNIQUE CLUSTERED INDEX
        IX_BaseOrderLinks_OrderID
        ON #BaseOrderLinks(OrderID);



    /* ============================================================
       4. ПІДТВЕРДЖЕНІ ЗАМОВЛЕННЯ

       ВАЖЛИВО:
       беремо саме ВалютаДокумента
       ============================================================ */

    SELECT

        ZP.Ссылка AS OrderID,

        ZP.Контрагент AS ContractorGuid,

        ZP.СуммаДокумента AS OrderSum,


        /* ========================================================
           ВАЛЮТА ДОКУМЕНТА
           ======================================================== */

        ZP.ВалютаДокумента AS CurrencyID,


        ZP.БВ_КоличествоКонструкций
            AS ConstructionsCount,


        OS.Наименование
            AS OrderStatusName,


        TRY_CAST
        (
            OS.Код AS INT
        ) AS OrderStatusCode


    INTO #EligibleOrders


    FROM #BaseOrderLinks L


    INNER JOIN
        [WST\WST].[oknastyle_biV2].[dbo].
        [Документы.ЗаказПокупателя]
        AS ZP

        ON ZP.Ссылка =
           L.OrderID


    LEFT JOIN
        [WST\WST].[oknastyle_biV2].[dbo].
        [Справочники.БВ_СостоянияЗаказов]
        AS OS

        ON OS.Ссылка =
           ZP.БВ_СостояниеЗаказа


    WHERE

        OS.Наименование =
            N'Подтверждено'

        AND ISNULL
        (
            OS.Наименование,
            N''
        ) <> N'Отказ'

        AND TRY_CAST
        (
            OS.Код AS INT
        ) >= 2


    OPTION (RECOMPILE);


    CREATE UNIQUE CLUSTERED INDEX
        IX_EligibleOrders_OrderID
        ON #EligibleOrders(OrderID);



    /* ============================================================
       5. АГРЕГАЦІЯ ПО ДИЛЕРУ + ВАЛЮТІ

       Валюта:
       ВалютаДокумента
           ->
       Справочники.Валюты V
           ->
       V.ОсновнаяВалюта
           ->
       Справочники.Валюты V_Base
           ->
       V_Base.Наименование
       ============================================================ */

    SELECT

        EO.ContractorGuid,


        /* ========================================================
           НАЗВА ОСНОВНОЇ ВАЛЮТИ
           ======================================================== */

        ISNULL
        (
            V_Base.Наименование,
            V.Наименование
        ) AS Currency,


        COUNT_BIG(*) AS OrdersCount,


        SUM
        (
            CAST
            (
                ISNULL
                (
                    EO.OrderSum,
                    0
                )
                AS DECIMAL(18, 2)
            )
        ) AS TurnoverAmount,


        AVG
        (
            CAST
            (
                ISNULL
                (
                    EO.OrderSum,
                    0
                )
                AS DECIMAL(18, 2)
            )
        ) AS AverageCheck,


        SUM
        (
            CAST
            (
                ISNULL
                (
                    EO.ConstructionsCount,
                    0
                )
                AS DECIMAL(18, 2)
            )
        ) AS TotalConstructions


    INTO #OrdersAgg


    FROM #EligibleOrders EO


    LEFT JOIN
        [WST\WST].[oknastyle_biV2].[dbo].
        [Справочники.Валюты]
        AS V
        WITH (NOLOCK)

        ON V.Ссылка =
           EO.CurrencyID


    LEFT JOIN
        [WST\WST].[oknastyle_biV2].[dbo].
        [Справочники.Валюты]
        AS V_Base
        WITH (NOLOCK)

        ON V_Base.Ссылка =
           V.ОсновнаяВалюта


    GROUP BY

        EO.ContractorGuid,

        ISNULL
        (
            V_Base.Наименование,
            V.Наименование
        );


    CREATE UNIQUE CLUSTERED INDEX
        IX_OrdersAgg_ContractorGuid_Currency
        ON #OrdersAgg
        (
            ContractorGuid,
            Currency
        );



    /* ============================================================
       6. РЕЙТИНГ ДИЛЕРІВ

       Рейтинг окремо по кожній валюті
       ============================================================ */

    SELECT

        PD.ContractorGuid,

        PD.DealerName,

        PD.RegionName,

        OA.Currency,


        ISNULL
        (
            OA.OrdersCount,
            0
        ) AS OrdersCount,


        CAST
        (
            ISNULL
            (
                OA.TotalConstructions,
                0
            )
            AS DECIMAL(18, 2)
        ) AS TotalConstructions,


        CAST
        (
            ISNULL
            (
                OA.TurnoverAmount,
                0
            )
            AS DECIMAL(18, 2)
        ) AS TurnoverAmount,


        CAST
        (
            ISNULL
            (
                OA.AverageCheck,
                0
            )
            AS DECIMAL(18, 2)
        ) AS AverageCheck,


        ROW_NUMBER()
        OVER
        (
            PARTITION BY
                OA.Currency

            ORDER BY
                ISNULL
                (
                    OA.TurnoverAmount,
                    0
                ) DESC,

                PD.DealerName ASC

        ) AS TurnoverRank,


        ROW_NUMBER()
        OVER
        (
            PARTITION BY
                OA.Currency

            ORDER BY
                ISNULL
                (
                    OA.AverageCheck,
                    0
                ) DESC,

                PD.DealerName ASC

        ) AS AverageCheckRank


    INTO #Leaderboard


    FROM #PortalDealers PD


    INNER JOIN #OrdersAgg OA

        ON OA.ContractorGuid =
           PD.ContractorGuid;



    CREATE UNIQUE CLUSTERED INDEX
        IX_Leaderboard_ContractorGuid_Currency
        ON #Leaderboard
        (
            ContractorGuid,
            Currency
        );



    /* ============================================================
       7. АГРЕГАЦІЯ ПО РЕГІОНУ + ВАЛЮТІ
       ============================================================ */

    SELECT

        L.RegionName,

        L.Currency,


        COUNT
        (
            DISTINCT L.ContractorGuid
        ) AS DealersCount,


        SUM
        (
            L.OrdersCount
        ) AS OrdersCount,


        SUM
        (
            L.TotalConstructions
        ) AS TotalConstructions,


        CAST
        (
            SUM
            (
                L.TurnoverAmount
            )
            AS DECIMAL(18, 2)

        ) AS TurnoverAmount,


        CAST
        (
            CASE

                WHEN SUM
                (
                    L.OrdersCount
                ) = 0

                    THEN 0


                ELSE

                    SUM
                    (
                        L.TurnoverAmount
                    )

                    /

                    NULLIF
                    (
                        SUM
                        (
                            L.OrdersCount
                        ),
                        0
                    )

            END
            AS DECIMAL(18, 2)

        ) AS AverageCheck


    INTO #RegionAgg


    FROM #Leaderboard L


    GROUP BY

        L.RegionName,

        L.Currency;



    /* ============================================================
       RESULT 1
       TOTALS

       ОКРЕМИЙ РЯДОК НА КОЖНУ ВАЛЮТУ
       ============================================================ */

    SELECT

        N'totals'
            AS result_type,


        Currency,


        COUNT
        (
            DISTINCT ContractorGuid
        ) AS dealers_count,


        SUM
        (
            OrdersCount
        ) AS orders_count,


        SUM
        (
            TotalConstructions
        ) AS total_constructions,


        CAST
        (
            SUM
            (
                TurnoverAmount
            )
            AS DECIMAL(18, 2)

        ) AS turnover_amount,


        CAST
        (
            CASE

                WHEN SUM
                (
                    OrdersCount
                ) = 0

                    THEN 0


                ELSE

                    SUM
                    (
                        TurnoverAmount
                    )

                    /

                    NULLIF
                    (
                        SUM
                        (
                            OrdersCount
                        ),
                        0
                    )

            END
            AS DECIMAL(18, 2)

        ) AS average_check,


        CAST
        (
            MAX
            (
                TurnoverAmount
            )
            AS DECIMAL(18, 2)

        ) AS top_turnover,


        CAST
        (
            MAX
            (
                AverageCheck
            )
            AS DECIMAL(18, 2)

        ) AS top_average_check


    FROM #Leaderboard


    GROUP BY
        Currency


    ORDER BY
        Currency;



    /* ============================================================
       RESULT 2
       ОБРАНИЙ ДИЛЕР
       ============================================================ */

    SELECT

        N'selected_dealer'
            AS result_type,


        L.ContractorGuid,

        L.DealerName,

        L.RegionName,

        L.Currency,

        L.OrdersCount,

        L.TotalConstructions,


        CAST
        (
            L.TurnoverAmount
            AS DECIMAL(18, 2)

        ) AS TurnoverAmount,


        CAST
        (
            L.AverageCheck
            AS DECIMAL(18, 2)

        ) AS AverageCheck,


        L.TurnoverRank,

        L.AverageCheckRank,


        /* ========================================================
           ПОТЕНЦІАЛ ДО ТОП ДИЛЕРА
           В МЕЖАХ ТІЄЇ Ж ВАЛЮТИ
           ======================================================== */

        CAST
        (
            ISNULL
            (
                (
                    SELECT
                        MAX
                        (
                            L2.TurnoverAmount
                        )

                    FROM #Leaderboard L2

                    WHERE
                        L2.Currency =
                        L.Currency
                ),
                0
            )

            -

            L.TurnoverAmount

            AS DECIMAL(18, 2)

        ) AS PotentialToTopTurnover,


        /* ========================================================
           ПОТЕНЦІАЛ ДО ТОП ДИЛЕРА РЕГІОНУ
           В МЕЖАХ ТІЄЇ Ж ВАЛЮТИ
           ======================================================== */

        CAST
        (
            ISNULL
            (
                (
                    SELECT
                        MAX
                        (
                            L2.TurnoverAmount
                        )

                    FROM #Leaderboard L2

                    WHERE
                        L2.RegionName =
                        L.RegionName

                        AND L2.Currency =
                            L.Currency
                ),
                0
            )

            -

            L.TurnoverAmount

            AS DECIMAL(18, 2)

        ) AS PotentialToRegionTopTurnover,


        ROW_NUMBER()
        OVER
        (
            PARTITION BY
                L.RegionName,
                L.Currency

            ORDER BY
                L.TurnoverAmount DESC,
                L.DealerName ASC

        ) AS RegionTurnoverRank


    FROM #Leaderboard L


    WHERE

        @Contractor_ID IS NULL

        OR L.ContractorGuid =
           CONVERT
           (
               BINARY(16),
               @Contractor_ID
           )


    ORDER BY

        L.Currency,

        L.TurnoverRank;



    /* ============================================================
       RESULT 3
       ЗАГАЛЬНИЙ LEADERBOARD
       ============================================================ */

    SELECT

        N'leaderboard'
            AS result_type,


        L.ContractorGuid,

        L.DealerName,

        L.RegionName,

        L.Currency,

        L.OrdersCount,

        L.TotalConstructions,


        CAST
        (
            L.TurnoverAmount
            AS DECIMAL(18, 2)

        ) AS TurnoverAmount,


        CAST
        (
            L.AverageCheck
            AS DECIMAL(18, 2)

        ) AS AverageCheck,


        L.TurnoverRank,

        L.AverageCheckRank


    FROM #Leaderboard L


    ORDER BY

        L.Currency,

        L.TurnoverRank;



    /* ============================================================
       RESULT 4
       РЕГІОНИ
       ============================================================ */

    SELECT

        N'regions'
            AS result_type,


        R.RegionName,

        R.Currency,

        R.DealersCount,

        R.OrdersCount,

        R.TotalConstructions,


        CAST
        (
            R.TurnoverAmount
            AS DECIMAL(18, 2)

        ) AS TurnoverAmount,


        CAST
        (
            R.AverageCheck
            AS DECIMAL(18, 2)

        ) AS AverageCheck,


        ROW_NUMBER()
        OVER
        (
            PARTITION BY
                R.Currency

            ORDER BY

                R.TurnoverAmount DESC,

                R.RegionName ASC

        ) AS RegionRank


    FROM #RegionAgg R


    ORDER BY

        R.Currency,

        RegionRank;



    /* ============================================================
       CLEANUP
       ============================================================ */

    DROP TABLE IF EXISTS #PortalDealers;
    DROP TABLE IF EXISTS #BaseOrderSource;
    DROP TABLE IF EXISTS #BaseOrderLinks;
    DROP TABLE IF EXISTS #EligibleOrders;
    DROP TABLE IF EXISTS #OrdersAgg;
    DROP TABLE IF EXISTS #Leaderboard;
    DROP TABLE IF EXISTS #RegionAgg;

END
