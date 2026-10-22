ALTER PROCEDURE [dbo].[GetWDSCodes_ByContractor]
    @Контрагент BINARY(16),
    @DateFrom   DATE = NULL,
    @DateTo     DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    DROP TABLE IF EXISTS #OrderIDs;
    DROP TABLE IF EXISTS #OrderLinks;

    IF @Контрагент IS NULL
    BEGIN
        SELECT TOP 0
            CAST(NULL AS NVARCHAR(255)) AS WDSCode,
            CAST(NULL AS DATETIME) AS [Date],
            CAST(NULL AS NVARCHAR(50)) AS OrderNumber,
            CAST(NULL AS NVARCHAR(50)) AS SerieCode,
            CAST(NULL AS NVARCHAR(255)) AS SerieName;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 1. Спочатку тільки ID замовлень по існуючому індексу:
    -- _Document381_ByFieldFld6187_RR (_Fld6187RRef, _IDRRef)
    ------------------------------------------------------------
    SELECT
        D._IDRRef AS OrderGuid
    INTO #OrderIDs
    FROM [WST\WST].[oknastyle].[dbo].[_Document381] AS D
        
    WHERE D._Fld6187RRef = @Контрагент
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_OrderIDs_OrderGuid
    ON #OrderIDs(OrderGuid);

    ------------------------------------------------------------
    -- 2. Потім точково дістаємо номер і відсікаємо видалені
    ------------------------------------------------------------
    SELECT
        D._IDRRef AS OrderGuid,
        D._Number AS OrderNumber
    INTO #OrderLinks
    FROM #OrderIDs O
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document381] AS D
        ON D._IDRRef = O.OrderGuid
    WHERE D._Marked = 0x00
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_OrderLinks_OrderGuid
    ON #OrderLinks(OrderGuid);

    IF NOT EXISTS (SELECT 1 FROM #OrderLinks)
    BEGIN
        SELECT TOP 0
            CAST(NULL AS NVARCHAR(255)) AS WDSCode,
            CAST(NULL AS DATETIME) AS [Date],
            CAST(NULL AS NVARCHAR(50)) AS OrderNumber,
            CAST(NULL AS NVARCHAR(50)) AS SerieCode,
            CAST(NULL AS NVARCHAR(255)) AS SerieName;

        DROP TABLE IF EXISTS #OrderIDs;
        DROP TABLE IF EXISTS #OrderLinks;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 3. WDS codes
    ------------------------------------------------------------
    IF @DateFrom IS NULL AND @DateTo IS NULL
    BEGIN
        SELECT
            W.[Код] AS WDSCode,
            W.[Дата] AS [Date],
            O.OrderNumber,
            S._Code AS SerieCode,
            S._Description AS SerieName
        FROM #OrderLinks AS O
        INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[РегистрыСведений.КодыАкцияWDS] AS W
            ON W.[ЗаказПокупателя] = O.OrderGuid
        LEFT JOIN [WST\WST].[oknastyle].[dbo].[_Reference194] AS S
            ON S._IDRRef = W.[Серия]
        ORDER BY
            W.[Дата] DESC
        OPTION (RECOMPILE);
    END
    ELSE
    BEGIN
        SELECT
            W.[Код] AS WDSCode,
            W.[Дата] AS [Date],
            O.OrderNumber,
            S._Code AS SerieCode,
            S._Description AS SerieName
        FROM #OrderLinks AS O
        INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[РегистрыСведений.КодыАкцияWDS] AS W
            ON W.[ЗаказПокупателя] = O.OrderGuid
        LEFT JOIN [WST\WST].[oknastyle].[dbo].[_Reference194] AS S
            ON S._IDRRef = W.[Серия]
        WHERE (@DateFrom IS NULL OR W.[Дата] >= @DateFrom)
          AND (@DateTo IS NULL OR W.[Дата] < DATEADD(DAY, 1, @DateTo))
        ORDER BY
            W.[Дата] DESC
        OPTION (RECOMPILE);
    END;

    DROP TABLE IF EXISTS #OrderIDs;
    DROP TABLE IF EXISTS #OrderLinks;
END;