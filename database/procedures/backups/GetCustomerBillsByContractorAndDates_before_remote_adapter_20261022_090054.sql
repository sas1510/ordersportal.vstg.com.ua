CREATE PROCEDURE [dbo].[GetCustomerBillsByContractorAndDates]
(
    @ContractorBin  BINARY(16),
    @DateFrom       DATE = NULL,
    @DateTo         DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    DECLARE @ShiftedDateFrom DATETIME = CASE
        WHEN @DateFrom IS NULL THEN NULL
        ELSE DATEADD(YEAR, 2000, CAST(@DateFrom AS DATETIME))
    END;
    DECLARE @ShiftedDateToNext DATETIME = CASE
        WHEN @DateTo IS NULL THEN NULL
        ELSE DATEADD(DAY, 1, DATEADD(YEAR, 2000, CAST(@DateTo AS DATETIME)))
    END;

    DROP TABLE IF EXISTS #BillLinks;

    /*
        Physical source for [Документы.СчетНаОплатуПокупателю_РегБаза]
        is [_Document28378].

        Existing indexes:
        - _Documen28378_ByDocDate_TRL on (_Date_Time, _IDRRef, _Marked)
        - _Documen28378_ByField34905_RR on (_Fld34904RRef, _IDRRef)

        There is no index on [КонтрагентУпр] (_Fld29927RRef), so we use the
        date index only when a date range is supplied. Without dates, a direct
        read from the physical table is still cheaper than going through biV2.
    */

    IF @DateFrom IS NOT NULL OR @DateTo IS NOT NULL
    BEGIN
        SELECT
            D._IDRRef AS BillGuid
        INTO #BillLinks
        FROM [WST\WST].[oknastyle].[dbo].[_Document28378] AS D
             WITH (INDEX(_Documen28378_ByDocDate_TRL), FORCESEEK)
        WHERE D._Marked = 0x00
          AND (@ShiftedDateFrom IS NULL OR D._Date_Time >= @ShiftedDateFrom)
          AND (@ShiftedDateToNext IS NULL OR D._Date_Time < @ShiftedDateToNext)
        OPTION (RECOMPILE);

        CREATE UNIQUE CLUSTERED INDEX IX_BillLinks_Guid
            ON #BillLinks(BillGuid);

        SELECT
            D._IDRRef AS BillGuid,
            CASE
                WHEN YEAR(D._Date_Time) < 3753 THEN D._Date_Time
                ELSE DATEADD(YEAR, -2000, D._Date_Time)
            END AS BillDate,
            D._Number AS BillNumber,
            D._Fld28379 AS Receiver,
            D._Fld28387 AS InvoiceNumber,
            D._Fld28394 AS MFO,
            D._Fld28390 AS TotalAmount,
            V_Base.Наименование AS Currency,
            D._Posted AS IsPosted,
            ISNULL(D._Fld43538, 0x00) AS IsCanceled,
            CASE
                WHEN YEAR(D._Fld36415) < 3753 THEN D._Fld36415
                ELSE DATEADD(YEAR, -2000, D._Fld36415)
            END AS CreatedAt,
            ISNULL(D._Fld36939, 0x00) AS IsWebInvoice,
            CAST(ISNULL(D._Fld28392, 0x00) AS INT) AS IsVAT,
            CAST(ISNULL(D._Fld28393, 0x00) AS INT) AS SumIncludeVAT
        FROM #BillLinks AS BL
        INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document28378] AS D
            WITH (FORCESEEK)
            ON D._IDRRef = BL.BillGuid
        LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Валюты] AS V
            ON D._Fld28391RRef = V.Ссылка
        LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Валюты] AS V_Base
            ON V.ОсновнаяВалюта = V_Base.Ссылка
        WHERE D._Fld29927RRef = @ContractorBin
        ORDER BY
            D._Date_Time DESC
        OPTION (RECOMPILE);
    END
    ELSE
    BEGIN
        SELECT
            D._IDRRef AS BillGuid,
            CASE
                WHEN YEAR(D._Date_Time) < 3753 THEN D._Date_Time
                ELSE DATEADD(YEAR, -2000, D._Date_Time)
            END AS BillDate,
            D._Number AS BillNumber,
            D._Fld28379 AS Receiver,
            D._Fld28387 AS InvoiceNumber,
            D._Fld28394 AS MFO,
            D._Fld28390 AS TotalAmount,
            V_Base.Наименование AS Currency,
            D._Posted AS IsPosted,
            ISNULL(D._Fld43538, 0x00) AS IsCanceled,
            CASE
                WHEN YEAR(D._Fld36415) < 3753 THEN D._Fld36415
                ELSE DATEADD(YEAR, -2000, D._Fld36415)
            END AS CreatedAt,
            ISNULL(D._Fld36939, 0x00) AS IsWebInvoice,
            CAST(ISNULL(D._Fld28392, 0x00) AS INT) AS IsVAT,
            CAST(ISNULL(D._Fld28393, 0x00) AS INT) AS SumIncludeVAT
        FROM [WST\WST].[oknastyle].[dbo].[_Document28378] AS D
        LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Валюты] AS V
            ON D._Fld28391RRef = V.Ссылка
        LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Валюты] AS V_Base
            ON V.ОсновнаяВалюта = V_Base.Ссылка
        WHERE D._Fld29927RRef = @ContractorBin
          AND D._Marked = 0x00
        ORDER BY
            D._Date_Time DESC
        OPTION (RECOMPILE);
    END;

    SELECT
        org.[НаименованиеПолное] AS OrgName,
        codes.[КодПоЕДРПОУ] AS [EDRPOU],
        codes.[ИНН] AS INN
    FROM [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Организации] AS org
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[РегистрыСведений.КодыОрганизации] AS codes
        ON org.[Ссылка] = codes.[Организация]
    WHERE org.[Код] = '000000001';
END;
