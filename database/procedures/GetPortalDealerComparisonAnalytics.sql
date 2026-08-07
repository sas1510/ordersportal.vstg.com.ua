USE [portal_db]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[GetPortalDealerComparisonAnalytics]
    @StartDate DATE,
    @EndDate DATE,
    @Contractor_ID BINARY(16)
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    DECLARE @NextEndDate DATE = DATEADD(DAY, 1, @EndDate);
    DECLARE @RawStartDate DATETIME = CAST(@StartDate AS DATETIME);
    DECLARE @RawNextEndDate DATETIME = CAST(@NextEndDate AS DATETIME);
    DECLARE @ShiftedStartDate DATETIME = DATEADD(YEAR, 2000, CAST(@StartDate AS DATETIME));
    DECLARE @ShiftedNextEndDate DATETIME = DATEADD(YEAR, 2000, CAST(@NextEndDate AS DATETIME));

    DROP TABLE IF EXISTS #PortalDealers;
    DROP TABLE IF EXISTS #OrdersBase;
    DROP TABLE IF EXISTS #DealerMetrics;
    DROP TABLE IF EXISTS #DealerRanked;

    ;WITH PortalUsers AS (
        SELECT DISTINCT
            U.[UserId1C] AS ContractorGuid,
            LTRIM(RTRIM(U.[Username])) AS PortalLogin
        FROM [portal_db].[dbo].[User] U
        WHERE U.[IsActive] = 1
          AND LOWER(LTRIM(RTRIM(U.[Role]))) = N'customer'
          AND U.[UserId1C] IS NOT NULL
    )
    SELECT
        P.ContractorGuid,
        COALESCE(NULLIF(LTRIM(RTRIM(C.Наименование)), N''), P.PortalLogin, N'Без назви') AS DealerName,
        CASE
            WHEN G.Наименование LIKE N'%Вінниц%' THEN N'Вінницька область'
            WHEN G.Наименование LIKE N'%Волин%' THEN N'Волинська область'
            WHEN G.Наименование LIKE N'%Дніпр%' THEN N'Дніпропетровська область'
            WHEN G.Наименование LIKE N'%Донец%' THEN N'Донецька область'
            WHEN G.Наименование LIKE N'%Житомир%' THEN N'Житомирська область'
            WHEN G.Наименование LIKE N'%Закарпат%' THEN N'Закарпатська область'
            WHEN G.Наименование LIKE N'%Запор%' THEN N'Запорізька область'
            WHEN G.Наименование LIKE N'%Івано%' THEN N'Івано-Франківська область'
            WHEN G.Наименование LIKE N'%Київ%' THEN N'Київська область'
            WHEN G.Наименование LIKE N'%Кіровоград%' THEN N'Кіровоградська область'
            WHEN G.Наименование LIKE N'%Луган%' THEN N'Луганська область'
            WHEN G.Наименование LIKE N'%Львів%' THEN N'Львівська область'
            WHEN G.Наименование LIKE N'%Миколаїв%' THEN N'Миколаївська область'
            WHEN G.Наименование LIKE N'%Одесь%' THEN N'Одеська область'
            WHEN G.Наименование LIKE N'%Полтав%' THEN N'Полтавська область'
            WHEN G.Наименование LIKE N'%Рівнен%' THEN N'Рівненська область'
            WHEN G.Наименование LIKE N'%Сумсь%' THEN N'Сумська область'
            WHEN G.Наименование LIKE N'%Терноп%' THEN N'Тернопільська область'
            WHEN G.Наименование LIKE N'%Харків%' THEN N'Харківська область'
            WHEN G.Наименование LIKE N'%Херсон%' THEN N'Херсонська область'
            WHEN G.Наименование LIKE N'%Хмельниц%' THEN N'Хмельницька область'
            WHEN G.Наименование LIKE N'%Черкась%' THEN N'Черкаська область'
            WHEN G.Наименование LIKE N'%Чернів%' THEN N'Чернівецька область'
            WHEN G.Наименование LIKE N'%Черніг%' THEN N'Чернігівська область'
            WHEN G.Наименование LIKE N'%м. Київ%' OR G.Наименование LIKE N'%Київ місто%' THEN N'м. Київ'
            ELSE N'Не визначено'
        END AS RegionName
    INTO #PortalDealers
    FROM PortalUsers P
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Контрагенты] C WITH (NOLOCK)
        ON C.Ссылка = P.ContractorGuid
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Контрагенты] G WITH (NOLOCK)
        ON G.Ссылка = C.Родитель;

    CREATE UNIQUE CLUSTERED INDEX IX_PortalDealers_ContractorGuid
        ON #PortalDealers(ContractorGuid);

    SELECT
        ZP.Контрагент AS ContractorGuid,
        ZP.Ссылка AS OrderGuid,
        ZP.Номер AS OrderNumber,
        ZP.Дата AS OrderDate,
        CAST(ZP.СуммаДокумента AS DECIMAL(18, 2)) AS OrderSum,
        CAST(ISNULL(ZP.БВ_КоличествоКонструкций, 0) AS INT) AS ConstructionsCount
    INTO #OrdersBase
    FROM [WST\WST].[oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] ZP WITH (NOLOCK)
    INNER JOIN #PortalDealers PD
        ON PD.ContractorGuid = ZP.Контрагент
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.БВ_СостоянияЗаказов] OS WITH (NOLOCK)
        ON OS.Ссылка = ZP.БВ_СостояниеЗаказа
    WHERE (
            (ZP.Дата >= @RawStartDate AND ZP.Дата < @RawNextEndDate)
         OR (ZP.Дата >= @ShiftedStartDate AND ZP.Дата < @ShiftedNextEndDate)
    )
      AND (
            ZP.Номер LIKE N'15-%'
         OR ZP.Номер LIKE N'01-%'
         OR ZP.Номер LIKE N'02-%'
         OR ZP.Номер LIKE N'22-%'
         OR ZP.Номер LIKE N'45-%'
         OR ZP.Номер LIKE N'55-%'
         OR ZP.Номер LIKE N'56-%'
         OR ZP.Номер LIKE N'65-%'
      )
      AND ISNULL(OS.Наименование, N'') <> N'Отказ';

    CREATE CLUSTERED INDEX IX_OrdersBase_ContractorGuid
        ON #OrdersBase(ContractorGuid);

    SELECT
        PD.ContractorGuid,
        PD.DealerName,
        PD.RegionName,
        COUNT(OB.OrderGuid) AS OrdersCount,
        SUM(ISNULL(OB.ConstructionsCount, 0)) AS TotalConstructions,
        CAST(SUM(ISNULL(OB.OrderSum, 0)) AS DECIMAL(18, 2)) AS TotalTurnover,
        CAST(SUM(ISNULL(OB.OrderSum, 0)) / NULLIF(COUNT(OB.OrderGuid), 0) AS DECIMAL(18, 2)) AS AvgCheck
    INTO #DealerMetrics
    FROM #PortalDealers PD
    LEFT JOIN #OrdersBase OB
        ON OB.ContractorGuid = PD.ContractorGuid
    GROUP BY PD.ContractorGuid, PD.DealerName, PD.RegionName;

    CREATE UNIQUE CLUSTERED INDEX IX_DealerMetrics_ContractorGuid
        ON #DealerMetrics(ContractorGuid);

    ;WITH Ranked AS (
        SELECT
            DM.*,
            ROW_NUMBER() OVER (ORDER BY DM.TotalTurnover DESC, DM.DealerName ASC) AS TurnoverRank,
            ROW_NUMBER() OVER (ORDER BY DM.AvgCheck DESC, DM.DealerName ASC) AS AvgCheckRank,
            ROW_NUMBER() OVER (PARTITION BY DM.RegionName ORDER BY DM.TotalTurnover DESC, DM.DealerName ASC) AS RegionTurnoverRank,
            COUNT(*) OVER () AS DealersTotal,
            COUNT(*) OVER (PARTITION BY DM.RegionName) AS RegionDealersTotal,
            FIRST_VALUE(DM.DealerName) OVER (ORDER BY DM.TotalTurnover DESC, DM.DealerName ASC) AS LeaderName,
            FIRST_VALUE(DM.TotalTurnover) OVER (ORDER BY DM.TotalTurnover DESC, DM.DealerName ASC) AS LeaderTurnover,
            FIRST_VALUE(DM.AvgCheck) OVER (ORDER BY DM.AvgCheck DESC, DM.DealerName ASC) AS LeaderAvgCheck,
            FIRST_VALUE(DM.DealerName) OVER (PARTITION BY DM.RegionName ORDER BY DM.TotalTurnover DESC, DM.DealerName ASC) AS RegionLeaderName,
            FIRST_VALUE(DM.TotalTurnover) OVER (PARTITION BY DM.RegionName ORDER BY DM.TotalTurnover DESC, DM.DealerName ASC) AS RegionLeaderTurnover,
            FIRST_VALUE(DM.AvgCheck) OVER (PARTITION BY DM.RegionName ORDER BY DM.AvgCheck DESC, DM.DealerName ASC) AS RegionLeaderAvgCheck
        FROM #DealerMetrics DM
    )
    SELECT
        ContractorGuid,
        DealerName,
        RegionName,
        OrdersCount,
        TotalConstructions,
        TotalTurnover,
        AvgCheck,
        TurnoverRank,
        AvgCheckRank,
        RegionTurnoverRank,
        DealersTotal,
        RegionDealersTotal,
        LeaderName,
        LeaderTurnover,
        LeaderAvgCheck,
        RegionLeaderName,
        RegionLeaderTurnover,
        RegionLeaderAvgCheck,
        CAST(OrdersCount * LeaderAvgCheck AS DECIMAL(18, 2)) AS PotentialTurnoverGlobal,
        CAST((OrdersCount * LeaderAvgCheck) - TotalTurnover AS DECIMAL(18, 2)) AS PotentialGainGlobal,
        CAST(OrdersCount * RegionLeaderAvgCheck AS DECIMAL(18, 2)) AS PotentialTurnoverRegion,
        CAST((OrdersCount * RegionLeaderAvgCheck) - TotalTurnover AS DECIMAL(18, 2)) AS PotentialGainRegion
    INTO #DealerRanked
    FROM Ranked;

    CREATE UNIQUE CLUSTERED INDEX IX_DealerRanked_ContractorGuid
        ON #DealerRanked(ContractorGuid);

    SELECT
        COUNT(*) AS DealersCount,
        SUM(OrdersCount) AS OrdersCount,
        SUM(TotalConstructions) AS TotalConstructions,
        CAST(SUM(TotalTurnover) AS DECIMAL(18, 2)) AS TotalTurnover,
        CAST(SUM(TotalTurnover) / NULLIF(SUM(OrdersCount), 0) AS DECIMAL(18, 2)) AS AvgCheck,
        MAX(CASE WHEN TurnoverRank = 1 THEN DealerName END) AS LeaderName,
        MAX(CASE WHEN TurnoverRank = 1 THEN TotalTurnover END) AS LeaderTurnover,
        MAX(CASE WHEN AvgCheckRank = 1 THEN AvgCheck END) AS LeaderAvgCheck
    FROM #DealerRanked;

    SELECT *
    FROM #DealerRanked
    WHERE ContractorGuid = @Contractor_ID;

    SELECT TOP (10) *
    FROM #DealerRanked
    ORDER BY TotalTurnover DESC, DealerName ASC;

    ;WITH RegionLeaders AS (
        SELECT
            RegionName,
            DealerName,
            TotalTurnover,
            ROW_NUMBER() OVER (PARTITION BY RegionName ORDER BY TotalTurnover DESC, DealerName ASC) AS RegionRank
        FROM #DealerRanked
    )
    SELECT
        DR.RegionName,
        COUNT(*) AS DealersCount,
        SUM(DR.OrdersCount) AS OrdersCount,
        SUM(DR.TotalConstructions) AS TotalConstructions,
        CAST(SUM(DR.TotalTurnover) AS DECIMAL(18, 2)) AS TotalTurnover,
        CAST(SUM(DR.TotalTurnover) / NULLIF(SUM(DR.OrdersCount), 0) AS DECIMAL(18, 2)) AS AvgCheck,
        MAX(CASE WHEN RL.RegionRank = 1 THEN RL.DealerName END) AS LeaderName,
        MAX(CASE WHEN RL.RegionRank = 1 THEN RL.TotalTurnover END) AS LeaderTurnover
    FROM #DealerRanked DR
    LEFT JOIN RegionLeaders RL
        ON RL.RegionName = DR.RegionName
       AND RL.DealerName = DR.DealerName
    GROUP BY DR.RegionName
    ORDER BY TotalTurnover DESC, RegionName ASC;

    DROP TABLE IF EXISTS #DealerRanked;
    DROP TABLE IF EXISTS #DealerMetrics;
    DROP TABLE IF EXISTS #OrdersBase;
    DROP TABLE IF EXISTS #PortalDealers;
END;
GO
