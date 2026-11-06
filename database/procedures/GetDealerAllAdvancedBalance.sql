ALTER PROCEDURE [dbo].[GetDealerAllAdvancedBalance]
    @Контрагент BINARY(16),
    @IncludeZeroBalance BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    DECLARE @MainOrg BINARY(16) = 0xA88A001B214EEE7A11E15373F04D8182;
    DECLARE @AdvanceSettlementMode BINARY(16) = 0xA419ED0D605750FC4477A808AB104405;
    DECLARE @AdvanceCurrencyType BINARY(16) = 0xB32E002590633BB311E2C9044F63C177;
    DECLARE @AdvanceCashFlowArticle BINARY(16) = 0x81B7002590554E9611E6AB17486133CE;
    DECLARE @SummaryType BINARY(1) = 0x01;
    DECLARE @ZeroRTRef BINARY(4) = 0x00000000;
    DECLARE @ZeroRRRef BINARY(16) = 0x00000000000000000000000000000000;
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);
    DECLARE @FinalBalancePeriod DATETIME = '59991101';

    DROP TABLE IF EXISTS #AdvanceContractOrgLinks;
    DROP TABLE IF EXISTS #AdvanceContracts;
    DROP TABLE IF EXISTS #AdvanceBalanceRows;
    DROP TABLE IF EXISTS #AdvanceBalances;

    /*
        Main optimization ideas:
        - first get contract links by org via [_Reference86_ByFieldFld1892_RR];
        - then apply the remaining business filters by PK lookups on
          [_Reference86] to avoid expensive biV2 contract/dictionary joins;
        - read current balances from [_AccumRgT23259] on the service final
          period used for current totals, instead of summing the full
          movements register.
    */

    SELECT
        Dog._IDRRef AS DogovorGuid
    INTO #AdvanceContractOrgLinks
    FROM [WST\WST].[oknastyle].[dbo].[_Reference86] AS Dog
         WITH (INDEX(_Reference86_ByFieldFld1892_RR), FORCESEEK)
    WHERE Dog._Fld1892RRef = @MainOrg
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_AdvanceContractOrgLinks_Dogovor
        ON #AdvanceContractOrgLinks(DogovorGuid);

    SELECT
        Dog._IDRRef AS DogovorGuid,
        Dog._Description AS DogovorName,
        Dog._OwnerIDRRef AS ContractorID,
        ISNULL(V_Base.Наименование, V.Наименование) AS CurrencyName
    INTO #AdvanceContracts
    FROM #AdvanceContractOrgLinks AS L
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Reference86] AS Dog
         WITH (FORCESEEK)
        ON Dog._IDRRef = L.DogovorGuid
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Валюты] AS V
        ON V.Ссылка = Dog._Fld1881RRef
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Валюты] AS V_Base
        ON V.ОсновнаяВалюта = V_Base.Ссылка
    WHERE Dog._Marked = 0x00
      AND Dog._Description LIKE N'%вансовий%'
      AND Dog._Description NOT LIKE N'%резерв%'
      AND Dog._Fld1882RRef = @AdvanceSettlementMode
      AND Dog._Fld1883RRef = @AdvanceCurrencyType
      AND Dog._Fld1909RRef = @AdvanceCashFlowArticle
      AND
      (
            Dog._Fld1910 > @Today
         OR Dog._Fld1910 = '2001-01-01 00:00:00.000'
      );

    CREATE UNIQUE CLUSTERED INDEX IX_AdvanceContracts_Dogovor
        ON #AdvanceContracts(DogovorGuid);

    IF NOT EXISTS (SELECT 1 FROM #AdvanceContracts)
    BEGIN
        SELECT TOP 0
            CAST(NULL AS BINARY(16)) AS Dogovor_ID,
            CAST(NULL AS NVARCHAR(255)) AS Dogovor_Name,
            CAST(NULL AS FLOAT) AS DogovorSum,
            CAST(NULL AS NVARCHAR(255)) AS CurrencyName,
            CAST(NULL AS NVARCHAR(255)) AS ContragentName;
        RETURN;
    END;

    SELECT
        AC.DogovorGuid,
        O._Fld23257 AS BalancePart
    INTO #AdvanceBalanceRows
    FROM #AdvanceContracts AS AC
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_AccumRgT23259] AS O
         WITH (FORCESEEK(_Accum23259_ByDims_TRRRRN
         (
             _Period,
             _Fld23253RRef,
             _Fld23254_TYPE,
             _Fld23254_RTRef,
             _Fld23254_RRRef,
             _Fld23255RRef,
             _Fld23256RRef
         )))
        ON O._Period = @FinalBalancePeriod
       AND O._Fld23253RRef = AC.DogovorGuid
       AND O._Fld23254_TYPE = @SummaryType
       AND O._Fld23254_RTRef = @ZeroRTRef
       AND O._Fld23254_RRRef = @ZeroRRRef
       AND O._Fld23255RRef = @MainOrg
       AND O._Fld23256RRef = @Контрагент
    OPTION (RECOMPILE, MAXDOP 4);

    CREATE CLUSTERED INDEX IX_AdvanceBalanceRows_Dogovor
        ON #AdvanceBalanceRows(DogovorGuid);

    SELECT
        ABR.DogovorGuid,
        SUM(-ABR.BalancePart) AS DogovorSum
    INTO #AdvanceBalances
    FROM #AdvanceBalanceRows AS ABR
    group by
        ABR.DogovorGuid
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_AdvanceBalances_Dogovor
        ON #AdvanceBalances(DogovorGuid);

    ;WITH CTE_Contractor AS
    (
        SELECT Наименование AS ContractorName
        FROM [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Контрагенты]
        WHERE Ссылка = @Контрагент
    )
    SELECT
        AC.DogovorGuid AS Dogovor_ID,
        AC.DogovorName AS Dogovor_Name,
        CAST(COALESCE(AB.DogovorSum, 0) AS FLOAT) AS DogovorSum,
        AC.CurrencyName,
        C.ContractorName AS ContragentName
    FROM #AdvanceContracts AS AC
    LEFT JOIN #AdvanceBalances AS AB
        ON AC.DogovorGuid = AB.DogovorGuid
    CROSS JOIN CTE_Contractor AS C
    WHERE AB.DogovorSum <> 0
       OR (@IncludeZeroBalance = 1 AND AC.ContractorID = @Контрагент)
    ORDER BY
        AC.DogovorName
    OPTION (RECOMPILE);

    DROP TABLE IF EXISTS #AdvanceBalanceRows;
    DROP TABLE IF EXISTS #AdvanceBalances;
    DROP TABLE IF EXISTS #AdvanceContracts;
    DROP TABLE IF EXISTS #AdvanceContractOrgLinks;
END;
