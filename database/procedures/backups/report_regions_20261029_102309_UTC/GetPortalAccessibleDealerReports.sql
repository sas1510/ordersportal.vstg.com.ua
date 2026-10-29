
CREATE PROCEDURE [dbo].[GetPortalAccessibleDealerReports]
    @RequesterUserID INT,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
    SET XACT_ABORT ON;

    /* ---------------------------------------------------------
       Валідація вхідних параметрів
    --------------------------------------------------------- */

    IF @RequesterUserID IS NULL
    BEGIN
        THROW 50001, N'Необхідно передати RequesterUserID.', 1;
    END;

    IF @StartDate IS NULL OR @EndDate IS NULL
    BEGIN
        THROW 50002, N'Необхідно передати початкову і кінцеву дати.', 1;
    END;

    IF @StartDate > @EndDate
    BEGIN
        THROW 50003, N'Початкова дата не може бути більшою за кінцеву.', 1;
    END;

    /* ---------------------------------------------------------
       Службові змінні
    --------------------------------------------------------- */

    DECLARE @RequesterRole NVARCHAR(50);

    DECLARE @NextEndDate DATE =
        DATEADD(DAY, 1, @EndDate);

    DECLARE @RawStartDate DATETIME =
        CAST(@StartDate AS DATETIME);

    DECLARE @RawNextEndDate DATETIME =
        CAST(@NextEndDate AS DATETIME);

    DECLARE @ShiftedStartDate DATETIME =
        DATEADD(YEAR, 2000, CAST(@StartDate AS DATETIME));

    DECLARE @ShiftedNextEndDate DATETIME =
        DATEADD(YEAR, 2000, CAST(@NextEndDate AS DATETIME));

    /* Фактичний GUID контрагента Рута Магазин */
    DECLARE @RutaContractorID BINARY(16) =
        0x9D1C002590633BB311E18EEADB8B7114;

    /* GUID регіону Чернівецька область */
    DECLARE @ChernivtsiRegionID BINARY(16) =
        0xAC23002590633BB311E195C09E4A47E4;

    /* Основний менеджер Рута Магазин */
    DECLARE @RutaMainManagerID BINARY(16) =
        0x80F674867AD9D52511E95A97F67C4D4C;

    /* ---------------------------------------------------------
       Перевірка користувача та ролі
    --------------------------------------------------------- */

    SELECT
        @RequesterRole = LOWER(LTRIM(RTRIM(U.[Role])))
    FROM [portal_db].[dbo].[User] U
    WHERE U.[Id] = @RequesterUserID
      AND U.[IsActive] = 1;

    IF @RequesterRole IS NULL
    BEGIN
        THROW 50004, N'Активного користувача порталу не знайдено.', 1;
    END;

    IF @RequesterRole NOT IN
    (
        N'admin',
        N'director',
        N'manager',
        N'region_manager'
    )
    BEGIN
        THROW 50005, N'Недостатньо прав для побудови звіту.', 1;
    END;

    /* ---------------------------------------------------------
       Видалення тимчасових таблиць
    --------------------------------------------------------- */

    DROP TABLE IF EXISTS #AccessibleDealersRaw;
    DROP TABLE IF EXISTS #PortalDealers;
    DROP TABLE IF EXISTS #BaseOrderSource;
    DROP TABLE IF EXISTS #BaseOrderLinks;
    DROP TABLE IF EXISTS #EligibleOrders;
    DROP TABLE IF EXISTS #OrdersAgg;
    DROP TABLE IF EXISTS #Leaderboard;
    DROP TABLE IF EXISTS #RegionAgg;

    /* ---------------------------------------------------------
       Отримання доступних контрагентів
    --------------------------------------------------------- */

    CREATE TABLE #AccessibleDealersRaw
    (
        ContractorID BINARY(16) NOT NULL,
        ContractorCode NVARCHAR(50) NULL,
        ContractorName NVARCHAR(255) NULL,
        MainManagerID BINARY(16) NULL
    );

    INSERT INTO #AccessibleDealersRaw
    (
        ContractorID,
        ContractorCode,
        ContractorName,
        MainManagerID
    )
    EXEC [dbo].[GetDealerPortalUsers_2]
        @RequesterUserID = @RequesterUserID;

    /* ---------------------------------------------------------
       Рута Магазин має потрапляти у звіт завжди,
       навіть якщо вона не входить до групи ДИЛЕРА
       або не повернулась із GetDealerPortalUsers_2
    --------------------------------------------------------- */

    IF NOT EXISTS
    (
        SELECT 1
        FROM #AccessibleDealersRaw
        WHERE ContractorID = @RutaContractorID
    )
    BEGIN
        INSERT INTO #AccessibleDealersRaw
        (
            ContractorID,
            ContractorCode,
            ContractorName,
            MainManagerID
        )
        SELECT
            C.[Ссылка],
            C.[Код],
            C.[Наименование],
            @RutaMainManagerID
        FROM [oknastyle_biV2].[dbo].[Справочники.Контрагенты] C
             WITH (NOLOCK)
        WHERE C.[Ссылка] = @RutaContractorID;
    END;

    /* Якщо Рута вже повернулась із GetDealerPortalUsers_2,
       примусово встановлюємо потрібного менеджера */
    UPDATE ADR
    SET ADR.MainManagerID = @RutaMainManagerID
    FROM #AccessibleDealersRaw ADR
    WHERE ADR.ContractorID = @RutaContractorID
      AND ADR.MainManagerID IS NULL;

    /* ---------------------------------------------------------
       Формування дилерів порталу та регіонів
    --------------------------------------------------------- */

    SELECT DISTINCT
        ADR.ContractorID AS ContractorGuid,

        COALESCE
        (
            NULLIF(
                LTRIM(
                    RTRIM(
                        ADR.ContractorName COLLATE Ukrainian_CI_AS
                    )
                ),
                N''
            ),
            NULLIF(
                LTRIM(
                    RTRIM(
                        C.[Наименование] COLLATE Ukrainian_CI_AS
                    )
                ),
                N''
            ),
            N'Без назви' COLLATE Ukrainian_CI_AS
        ) AS DealerName,

        CASE
            WHEN ADR.ContractorID = @RutaContractorID
                THEN N'Чернівецька область' COLLATE Ukrainian_CI_AS

            ELSE COALESCE
            (
                NULLIF(
                    LTRIM(
                        RTRIM(
                            G.[Наименование] COLLATE Ukrainian_CI_AS
                        )
                    ),
                    N''
                ),
                N'Не визначено' COLLATE Ukrainian_CI_AS
            )
        END AS RegionName,

        CASE
            WHEN ADR.ContractorID = @RutaContractorID
                THEN @RutaMainManagerID
            ELSE ADR.MainManagerID
        END AS MainManagerID

    INTO #PortalDealers

    FROM #AccessibleDealersRaw ADR

    LEFT JOIN
        [oknastyle_biV2].[dbo].[Справочники.Контрагенты] C
        WITH (NOLOCK)
        ON C.[Ссылка] = ADR.ContractorID

    LEFT JOIN
        [oknastyle_biV2].[dbo].[Справочники.ГруппыДоступаКонтрагентов] G
        WITH (NOLOCK)
        ON G.[Ссылка] =
            CASE
                WHEN ADR.ContractorID = @RutaContractorID
                    THEN @ChernivtsiRegionID
                ELSE C.[ГруппаДоступаКонтрагента]
            END

    LEFT JOIN
        [oknastyle_biV2].[dbo].[Справочники.ГруппыДоступаКонтрагентов] GParent
        WITH (NOLOCK)
        ON GParent.[Ссылка] = G.[Родитель]

    WHERE ADR.ContractorID IS NOT NULL
      AND
      (
            /* Рута Магазин проходить незалежно від її групи */
            ADR.ContractorID = @RutaContractorID

            /* Інші контрагенти проходять стандартну перевірку */
            OR GParent.[Наименование] IS NULL

            OR UPPER
            (
                LTRIM
                (
                    RTRIM
                    (
                        ISNULL(GParent.[Наименование], N'')
                    )
                )
            ) COLLATE Ukrainian_CI_AS
                = N'ДИЛЕРА' COLLATE Ukrainian_CI_AS
      );

    CREATE UNIQUE CLUSTERED INDEX IX_PortalDealers_ContractorGuid
        ON #PortalDealers(ContractorGuid);

    /* ---------------------------------------------------------
       Пошук замовлень доступних контрагентів
    --------------------------------------------------------- */

    SELECT
        ZP._IDRRef AS OrderID,
        ZP._Fld6187RRef AS ContractorGuid
    INTO #BaseOrderSource
    FROM [oknastyle].[dbo].[_Document381] ZP
         WITH
         (
             INDEX(_Document381_ByFieldFld6187_RR),
             FORCESEEK
         )
    INNER JOIN #PortalDealers PD
        ON PD.ContractorGuid = ZP._Fld6187RRef
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_BaseOrderSource_OrderID
        ON #BaseOrderSource(OrderID);

    /* ---------------------------------------------------------
       Фільтрація замовлень за датою, проведенням і номером
    --------------------------------------------------------- */

    SELECT
        ZP._IDRRef AS OrderID,
        ZP._Fld6187RRef AS ContractorGuid
    INTO #BaseOrderLinks
    FROM #BaseOrderSource S
    INNER JOIN [oknastyle].[dbo].[_Document381] ZP
        WITH (FORCESEEK)
        ON ZP._IDRRef = S.OrderID
    WHERE ZP._Marked = 0x00
      AND ZP._Posted = 0x01
      AND
      (
            (
                ZP._Date_Time >= @RawStartDate
                AND ZP._Date_Time < @RawNextEndDate
            )
            OR
            (
                ZP._Date_Time >= @ShiftedStartDate
                AND ZP._Date_Time < @ShiftedNextEndDate
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

    CREATE UNIQUE CLUSTERED INDEX IX_BaseOrderLinks_OrderID
        ON #BaseOrderLinks(OrderID);

    /* ---------------------------------------------------------
       Вибір підтверджених замовлень
    --------------------------------------------------------- */

    SELECT
        ZP.Ссылка AS OrderID,
        ZP.Контрагент AS ContractorGuid,
        ZP.СуммаДокумента AS OrderSum,
        ZP.БВ_КоличествоКонструкций AS ConstructionsCount,
        OS.Наименование AS OrderStatusName,
        TRY_CAST(OS.Код AS INT) AS OrderStatusCode
    INTO #EligibleOrders
    FROM #BaseOrderLinks L
    INNER JOIN
        [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] ZP
        ON ZP.Ссылка = L.OrderID
    LEFT JOIN
        [oknastyle_biV2].[dbo].[Справочники.БВ_СостоянияЗаказов] OS
        ON OS.Ссылка = ZP.БВ_СостояниеЗаказа
    WHERE ISNULL(OS.Наименование, N'') <> N'Отказ'
      AND TRY_CAST(OS.Код AS INT) >= 2
      AND OS.Наименование = N'Подтверждено'
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_EligibleOrders_OrderID
        ON #EligibleOrders(OrderID);

    /* ---------------------------------------------------------
       Агрегація замовлень по дилерах
    --------------------------------------------------------- */

    SELECT
        EO.ContractorGuid,
        COUNT_BIG(*) AS OrdersCount,

        SUM
        (
            CAST(
                ISNULL(EO.OrderSum, 0)
                AS DECIMAL(18, 2)
            )
        ) AS TurnoverAmount,

        AVG
        (
            CAST(
                ISNULL(EO.OrderSum, 0)
                AS DECIMAL(18, 2)
            )
        ) AS AverageCheck,

        SUM
        (
            CAST(
                ISNULL(EO.ConstructionsCount, 0)
                AS DECIMAL(18, 2)
            )
        ) AS TotalConstructions

    INTO #OrdersAgg
    FROM #EligibleOrders EO
    GROUP BY EO.ContractorGuid;

    CREATE UNIQUE CLUSTERED INDEX IX_OrdersAgg_ContractorGuid
        ON #OrdersAgg(ContractorGuid);

    /* ---------------------------------------------------------
       Рейтинг дилерів
    --------------------------------------------------------- */

    SELECT
        PD.ContractorGuid,
        PD.DealerName,
        PD.RegionName,
        PD.MainManagerID,

        ISNULL(OA.OrdersCount, 0) AS OrdersCount,

        CAST(
            ISNULL(OA.TotalConstructions, 0)
            AS DECIMAL(18, 2)
        ) AS TotalConstructions,

        CAST(
            ISNULL(OA.TurnoverAmount, 0)
            AS DECIMAL(18, 2)
        ) AS TurnoverAmount,

        CAST(
            ISNULL(OA.AverageCheck, 0)
            AS DECIMAL(18, 2)
        ) AS AverageCheck,

        ROW_NUMBER() OVER
        (
            ORDER BY
                ISNULL(OA.TurnoverAmount, 0) DESC,
                PD.DealerName ASC
        ) AS TurnoverRank,

        ROW_NUMBER() OVER
        (
            ORDER BY
                ISNULL(OA.AverageCheck, 0) DESC,
                PD.DealerName ASC
        ) AS AverageCheckRank

    INTO #Leaderboard
    FROM #PortalDealers PD
    LEFT JOIN #OrdersAgg OA
        ON OA.ContractorGuid = PD.ContractorGuid;

    CREATE UNIQUE CLUSTERED INDEX IX_Leaderboard_ContractorGuid
        ON #Leaderboard(ContractorGuid);

    /* ---------------------------------------------------------
       Агрегація по регіонах
    --------------------------------------------------------- */

    SELECT
        L.RegionName,
        COUNT(*) AS DealersCount,
        SUM(L.OrdersCount) AS OrdersCount,
        SUM(L.TotalConstructions) AS TotalConstructions,

        CAST(
            SUM(L.TurnoverAmount)
            AS DECIMAL(18, 2)
        ) AS TurnoverAmount,

        CAST
        (
            CASE
                WHEN SUM(L.OrdersCount) = 0
                    THEN 0
                ELSE
                    SUM(L.TurnoverAmount)
                    / NULLIF(SUM(L.OrdersCount), 0)
            END
            AS DECIMAL(18, 2)
        ) AS AverageCheck

    INTO #RegionAgg
    FROM #Leaderboard L
    GROUP BY L.RegionName;

    /* ---------------------------------------------------------
       Результат 1: загальні підсумки
    --------------------------------------------------------- */

    SELECT
        N'totals' AS result_type,

        COUNT(*) AS dealers_count,

        SUM(OrdersCount) AS orders_count,

        SUM(TotalConstructions) AS total_constructions,

        CAST(
            SUM(TurnoverAmount)
            AS DECIMAL(18, 2)
        ) AS turnover_amount,

        CAST
        (
            CASE
                WHEN SUM(OrdersCount) = 0
                    THEN 0
                ELSE
                    SUM(TurnoverAmount)
                    / NULLIF(SUM(OrdersCount), 0)
            END
            AS DECIMAL(18, 2)
        ) AS average_check,

        CAST(
            MAX(TurnoverAmount)
            AS DECIMAL(18, 2)
        ) AS top_turnover,

        CAST(
            MAX(AverageCheck)
            AS DECIMAL(18, 2)
        ) AS top_average_check

    FROM #Leaderboard;

    /* ---------------------------------------------------------
       Результат 2: дилери
    --------------------------------------------------------- */

    SELECT
    N'dealers' AS result_type,
    L.ContractorGuid,
    L.DealerName,
    L.RegionName,
    L.MainManagerID,

    MM.Наименование AS MainManagerName,

    L.OrdersCount,
    L.TotalConstructions,

    CAST(
        L.TurnoverAmount
        AS DECIMAL(18,2)
    ) AS TurnoverAmount,

    CAST(
        L.AverageCheck
        AS DECIMAL(18,2)
    ) AS AverageCheck,

    L.TurnoverRank,
    L.AverageCheckRank

FROM #Leaderboard L

LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.Пользователи] MM
    WITH (NOLOCK)
    ON MM.Ссылка = L.MainManagerID

ORDER BY L.TurnoverRank;

    /* ---------------------------------------------------------
       Результат 3: регіони
    --------------------------------------------------------- */

    SELECT
        N'regions' AS result_type,
        R.RegionName,
        R.DealersCount,
        R.OrdersCount,
        R.TotalConstructions,

        CAST(
            R.TurnoverAmount
            AS DECIMAL(18, 2)
        ) AS TurnoverAmount,

        CAST(
            R.AverageCheck
            AS DECIMAL(18, 2)
        ) AS AverageCheck,

        ROW_NUMBER() OVER
        (
            ORDER BY
                R.TurnoverAmount DESC,
                R.RegionName ASC
        ) AS RegionRank

    FROM #RegionAgg R
    ORDER BY RegionRank;
END
