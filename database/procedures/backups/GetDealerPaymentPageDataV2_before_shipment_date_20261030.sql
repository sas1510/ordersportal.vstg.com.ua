
CREATE PROCEDURE [dbo].[GetDealerPaymentPageDataV2]
    @Contractor BINARY(16)
AS
BEGIN
    SET NOCOUNT ON;
    SET ANSI_WARNINGS OFF;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    DECLARE @MainOrg BINARY(16) = 0xA88A001B214EEE7A11E15373F04D8182;
    DECLARE @OrderDocType BINARY(1) = 0x08;
    DECLARE @OrderDocRTRef BINARY(4) = 0x0000017D;
    DECLARE @RawStartDate DATETIME = '20230101';
    DECLARE @ShiftedStartDate DATETIME =
        DATEADD(YEAR, 2000, CAST('20230101' AS DATETIME));
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    DROP TABLE IF EXISTS #AllowedStates;
    DROP TABLE IF EXISTS #CustomerOrders;
    DROP TABLE IF EXISTS #Payments;
    DROP TABLE IF EXISTS #ProdOrders;
    DROP TABLE IF EXISTS #ProdReports;
    DROP TABLE IF EXISTS #Sales;
    DROP TABLE IF EXISTS #AdvanceContractLinks;
    DROP TABLE IF EXISTS #AdvanceContracts;
    DROP TABLE IF EXISTS #AdvanceBalances;

    SELECT
        OS.Ссылка AS StateID,
        OS.Наименование AS StateName
    INTO #AllowedStates
    FROM [WST\WST].[oknastyle_biV2].[dbo].[Справочники.БВ_СостоянияЗаказов] AS OS
    WHERE OS.Наименование NOT IN (
        N'Отказ',
        N'Ждем подтверждения',
        N'Автоматический отказ-неоплачено',
        N'Для просчета',
        N'Коммерция',
        N''
    );

    CREATE UNIQUE CLUSTERED INDEX IX_AllowedStates_State
        ON #AllowedStates(StateID);

    SELECT
        ZP._IDRRef AS OrderID,
        ZP._Number AS OrderNumber,
        CASE
            WHEN YEAR(ZP._Date_Time) < 3753 THEN ZP._Date_Time
            ELSE DATEADD(YEAR, -2000, ZP._Date_Time)
        END AS OrderDate,
        ZP._Fld6197 AS OrderSum,
        ZP._Fld6252RRef AS OrderStateID,
        ZP._Fld6187RRef AS ContractorID,
        ZP._Fld6263RRef AS DogovorID,
        ZP._Fld6205_TYPE AS BaseDocumentType,
        ZP._Fld6205_RTRef AS BaseDocumentRTRef,
        ZP._Fld6205_RRRef AS BaseDocumentID,
        S.StateName AS OrderStateName,
        ZP._Fld6177RRef AS CurrencyID
    INTO #CustomerOrders
    FROM [WST\WST].[oknastyle].[dbo].[_Document381] AS ZP
         WITH (INDEX(_Document381_ByFieldFld6187_RR), FORCESEEK)
    INNER JOIN #AllowedStates AS S
        ON S.StateID = ZP._Fld6252RRef
    WHERE ZP._Fld6187RRef = @Contractor
      AND ZP._Marked = 0x00
      AND ZP._Posted = 0x01
      AND (
            (ZP._Date_Time >= @RawStartDate
             AND ZP._Date_Time < '30000101')
         OR ZP._Date_Time >= @ShiftedStartDate
      )
      AND (
            ZP._Number LIKE N'01-%'
         OR ZP._Number LIKE N'02-%'
         OR ZP._Number LIKE N'15-%'
         OR ZP._Number LIKE N'22-%'
         OR ZP._Number LIKE N'45-%'
         OR ZP._Number LIKE N'55-%'
         OR ZP._Number LIKE N'56-%'
         OR ZP._Number LIKE N'65-%'
         OR ZP._Number LIKE N'70-%'
      )
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_CO_ID
        ON #CustomerOrders(OrderID);

    CREATE NONCLUSTERED INDEX IX_CO_Dogovor
        ON #CustomerOrders(DogovorID)
        INCLUDE (OrderDate, OrderSum, OrderStateName, CurrencyID, OrderNumber);

    CREATE NONCLUSTERED INDEX IX_CO_Date
        ON #CustomerOrders(OrderDate);

    IF NOT EXISTS (SELECT 1 FROM #CustomerOrders)
    BEGIN
        SELECT TOP 0 1 AS OrderID_GUID;
        RETURN;
    END;

    SELECT
        R._Fld24772_RRRef AS OrderID,
        SUM(
            CASE
                WHEN R._RecordKind = 0 THEN -R._Fld24776
                ELSE R._Fld24776
            END
        ) AS Payments,
        SUM(
            CASE
                WHEN R._RecordKind = 1 THEN R._Fld24776
                ELSE 0
            END
        ) AS TotalPayments,
        CAST(NULL AS NUMERIC(15, 2)) AS ChargeAmount
    INTO #Payments
    FROM #CustomerOrders AS CO
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_AccumRg24770] AS R
        WITH (INDEX(_Accum24770_ByDims24778_RTRN), FORCESEEK)
        ON R._Fld24772_TYPE = @OrderDocType
       AND R._Fld24772_RTRef = @OrderDocRTRef
       AND R._Fld24772_RRRef = CO.OrderID
    WHERE R._Fld24775RRef = @Contractor
      AND R._Active = 0x01
    GROUP BY R._Fld24772_RRRef
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_P_ID
        ON #Payments(OrderID);

    SELECT
        CO.OrderID,
        MAX(
            CASE
                WHEN YEAR(ZNP._Fld6108) < 3753 THEN ZNP._Fld6108
                ELSE DATEADD(YEAR, -2000, ZNP._Fld6108)
            END
        ) AS StartDate
    INTO #ProdOrders
    FROM #CustomerOrders AS CO
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document380_VT6116] AS ZNPP
        WITH (INDEX(_Document380_VT6116_ByFieldFld6127_RR), FORCESEEK)
        ON ZNPP._Fld6127_TYPE = @OrderDocType
       AND ZNPP._Fld6127_RTRef = @OrderDocRTRef
       AND ZNPP._Fld6127_RRRef = CO.OrderID
       AND ZNPP._Fld6118RRef = 0x99B8002590633BB311E177FF631F08AD
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document380] AS ZNP
        WITH (FORCESEEK)
        ON ZNP._IDRRef = ZNPP._Document380_IDRRef
    WHERE ZNP._Posted = 0x01
    GROUP BY CO.OrderID
    OPTION (RECOMPILE);

    -- V2: у табличній частині звіту виробництва замовлення
    -- прив'язане через _Fld10575_*, як у процедурах сторінки замовлень.
    SELECT
        CO.OrderID,
        MAX(
            CASE
                WHEN YEAR(OP._Date_Time) < 3753 THEN OP._Date_Time
                ELSE DATEADD(YEAR, -2000, OP._Date_Time)
            END
        ) AS ReadyDate
    INTO #ProdReports
    FROM #CustomerOrders AS CO
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document488_VT10534] AS OPP
        WITH (INDEX(_Documen488_VT10534_ByField10583_RR), FORCESEEK)
        ON OPP._Fld10575_TYPE = @OrderDocType
       AND OPP._Fld10575_RTRef = @OrderDocRTRef
       AND OPP._Fld10575_RRRef = CO.OrderID
       AND OPP._Fld10548RRef = 0x99B8002590633BB311E177FF631F08AD
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document488] AS OP
        WITH (FORCESEEK)
        ON OP._IDRRef = OPP._Document488_IDRRef
    WHERE OP._Posted = 0x01
    GROUP BY CO.OrderID
    OPTION (RECOMPILE);

    SELECT
        CO.OrderID,
        MAX(
            CASE
                WHEN YEAR(RT._Date_Time) < 3753 THEN RT._Date_Time
                ELSE DATEADD(YEAR, -2000, RT._Date_Time)
            END
        ) AS SaleDate
    INTO #Sales
    FROM #CustomerOrders AS CO
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document566] AS RT
        WITH (INDEX(_Documen566_ByField15124_R), FORCESEEK)
        ON RT._Fld14982_TYPE = @OrderDocType
       AND RT._Fld14982_RTRef = @OrderDocRTRef
       AND RT._Fld14982_RRRef = CO.OrderID
    WHERE RT._Posted = 0x01
    GROUP BY CO.OrderID
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_PO_ID
        ON #ProdOrders(OrderID);

    CREATE UNIQUE CLUSTERED INDEX IX_PR_ID
        ON #ProdReports(OrderID);

    CREATE UNIQUE CLUSTERED INDEX IX_S_ID
        ON #Sales(OrderID);

    -- Перший набір результатів: замовлення для сторінки оплат.
    SELECT
        CO.OrderID AS OrderID_GUID,
        CO.OrderNumber,
        BaseDoc.Номер AS BaseDocumentNumber,
        CAST(CO.OrderDate AS DATE) AS OrderDate,
        CO.OrderSum,
        ISNULL(P.TotalPayments, 0) AS PaidAmount,
        CO.OrderSum - ISNULL(P.TotalPayments, 0) AS DebtAmount,
        CO.DogovorID AS Dogovor_GUID,
        Dog.Наименование AS DogovorName,
        V_Base.Наименование AS CurrencyName,
        CASE
            WHEN SLS.SaleDate IS NOT NULL THEN N'Відвантажений'
            WHEN PR.ReadyDate IS NOT NULL THEN N'Готовий'
            WHEN PO.StartDate IS NOT NULL THEN N'У виробництві'
            WHEN CO.OrderStateName = N'Подтверждено'
                THEN N'Підтверджений'
            WHEN CO.OrderStateName = N'Ждем оплати'
                THEN N'Очікуємо оплату'
            WHEN CO.OrderStateName = N'Неликвид'
                THEN N'Неліквід'
            ELSE CO.OrderStateName
        END AS OrderStage
    FROM #CustomerOrders AS CO
    LEFT JOIN #Payments AS P
        ON P.OrderID = CO.OrderID
    LEFT JOIN #ProdOrders AS PO
        ON PO.OrderID = CO.OrderID
    LEFT JOIN #ProdReports AS PR
        ON PR.OrderID = CO.OrderID
    LEFT JOIN #Sales AS SLS
        ON SLS.OrderID = CO.OrderID
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.ДоговорыКонтрагентов] AS Dog
        ON Dog.Ссылка = CO.DogovorID
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Валюты] AS V
        ON V.Ссылка = CO.CurrencyID
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Валюты] AS V_Base
        ON V.ОсновнаяВалюта = V_Base.Ссылка
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] AS BaseDoc
        ON BaseDoc.Ссылка = CO.BaseDocumentID
    WHERE ISNULL(P.Payments, 0) <> 0
      AND (CO.OrderSum - ISNULL(P.TotalPayments, 0)) > 0.01
      AND Dog.ПометкаУдаления = 0
      AND (
            Dog.СрокДействия > @Today
         OR Dog.СрокДействия = '2001-01-01 00:00:00.000'
      )
    ORDER BY CO.OrderDate ASC
    OPTION (RECOMPILE, MAXDOP 8);

    SELECT
        Dog._IDRRef AS DogovorGuid
    INTO #AdvanceContractLinks
    FROM [WST\WST].[oknastyle].[dbo].[_Reference86] AS Dog
         WITH (INDEX(_Reference86_ByFieldFld1892_RR), FORCESEEK)
    WHERE Dog._Fld1892RRef = @MainOrg
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_AdvanceContractLinks_Dogovor
        ON #AdvanceContractLinks(DogovorGuid);

    SELECT
        Dog.Ссылка AS DogovorGuid,
        Dog.Наименование AS DogovorName,
        V.Наименование AS CurrencyName
    INTO #AdvanceContracts
    FROM #AdvanceContractLinks AS ACL
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.ДоговорыКонтрагентов] AS Dog
        ON Dog.Ссылка = ACL.DogovorGuid
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.ВидыВзаиморасчетов] AS VV
        ON VV.Ссылка = Dog.ВидВзаиморасчетов
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.СтатьиДвиженияДенежныхСредств] AS MM
        ON MM.Ссылка = Dog.ОсновнаяСтатьяДвиженияДенежныхСредств
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Перечисления.ВедениеВзаиморасчетовПоДоговорам] AS VVD
        ON VVD.Ссылка = Dog.ВедениеВзаиморасчетов
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Валюты] AS V
        ON V.Ссылка = Dog.ВалютаВзаиморасчетов
    WHERE Dog.ПометкаУдаления = 0
      AND Dog.Наименование LIKE N'%вансовий%'
      AND VV.Наименование = N'Отримані аванси від покупців (С покупателем)'
      AND MM.Наименование = N'Отримані аванси від покупців'
      AND VVD.ВедениеВзаиморасчетовПоДоговорам = N'ПоДоговоруВЦелом'
      AND (
            Dog.СрокДействия > @Today
         OR Dog.СрокДействия = '2001-01-01 00:00:00.000'
      );

    CREATE UNIQUE CLUSTERED INDEX IX_AdvanceContracts_Dogovor
        ON #AdvanceContracts(DogovorGuid);

    SELECT
        R._Fld23253RRef AS DogovorGuid,
        SUM(
            CASE
                WHEN R._RecordKind = 1 THEN R._Fld23257
                ELSE -R._Fld23257
            END
        ) AS DogovorBalance
    INTO #AdvanceBalances
    FROM [WST\WST].[oknastyle].[dbo].[_AccumRg23252] AS R
    INNER JOIN #AdvanceContracts AS AC
        ON AC.DogovorGuid = R._Fld23253RRef
    WHERE R._Fld23256RRef = @Contractor
      AND R._Fld23255RRef = @MainOrg
      AND R._Active = 0x01
    GROUP BY R._Fld23253RRef
    OPTION (RECOMPILE, MAXDOP 4);

    CREATE UNIQUE CLUSTERED INDEX IX_AdvanceBalances_Dogovor
        ON #AdvanceBalances(DogovorGuid);

    -- Другий набір результатів: авансові договори.
    SELECT
        AB.DogovorGuid,
        AC.DogovorName,
        AC.CurrencyName,
        AB.DogovorBalance
    FROM #AdvanceBalances AS AB
    INNER JOIN #AdvanceContracts AS AC
        ON AC.DogovorGuid = AB.DogovorGuid
    OPTION (RECOMPILE, MAXDOP 4);

    DROP TABLE IF EXISTS #AdvanceBalances;
    DROP TABLE IF EXISTS #AdvanceContracts;
    DROP TABLE IF EXISTS #AdvanceContractLinks;
    DROP TABLE IF EXISTS #Sales;
    DROP TABLE IF EXISTS #ProdReports;
    DROP TABLE IF EXISTS #ProdOrders;
    DROP TABLE IF EXISTS #Payments;
    DROP TABLE IF EXISTS #CustomerOrders;
    DROP TABLE IF EXISTS #AllowedStates;
END;
