USE [portal_db]
GO
/****** Object:  StoredProcedure [dbo].[GetDealerAdvanceBalance_V3]    Script Date: 21.09.2026 12:32:22 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[GetDealerAdvanceBalance_V3]
    @Контрагент BINARY(16)
AS
BEGIN
    SET NOCOUNT ON;
    SET ANSI_WARNINGS OFF;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    ------------------------------------------------------------
    -- Основні параметри замовлень
    ------------------------------------------------------------
    DECLARE @RawStartDate DATETIME = '20230101';

    DECLARE @ShiftedStartDate DATETIME =
        DATEADD(YEAR, 2000, @RawStartDate);

    DECLARE @MainOrg BINARY(16) =
        0xA88A001B214EEE7A11E15373F04D8182;

    DECLARE @ClosedState BINARY(16) =
        0x99B94EA6CCA98189497428BD64C2692D;

    DECLARE @RouteState BINARY(16) =
        0x89715A4833951F054D34148D295CD149;

    DECLARE @OrderDocType BINARY(1) =
        0x08;

    DECLARE @OrderDocRTRef BINARY(4) =
        0x0000017D;

    ------------------------------------------------------------
    -- Параметри авансових договорів
    ------------------------------------------------------------
    DECLARE @AdvanceSettlementMode BINARY(16) =
        0xA419ED0D605750FC4477A808AB104405;

    DECLARE @AdvanceCurrencyType BINARY(16) =
        0xB32E002590633BB311E2C9044F63C177;

    DECLARE @AdvanceCashFlowArticle BINARY(16) =
        0x81B7002590554E9611E6AB17486133CE;

    DECLARE @SummaryType BINARY(1) =
        0x01;

    DECLARE @ZeroRTRef BINARY(4) =
        0x00000000;

    DECLARE @ZeroRRRef BINARY(16) =
        0x00000000000000000000000000000000;

    DECLARE @Today DATE =
        CAST(GETDATE() AS DATE);

    DECLARE @FinalBalancePeriod DATETIME =
        '59991101';

    ------------------------------------------------------------
    -- Підсумкові змінні
    ------------------------------------------------------------
    DECLARE @OrderDebt DECIMAL(18, 2) = 0;
    DECLARE @AdvanceBalance DECIMAL(18, 2) = 0;
    DECLARE @ContractorName NVARCHAR(255);

    ------------------------------------------------------------
    -- Ім’я контрагента
    ------------------------------------------------------------
  /* SELECT TOP (1)
        @ContractorName = C.Наименование
    FROM
        [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Контрагенты] AS C
    WHERE C.Ссылка = @Контрагент; */

    SELECT TOP (1)
                 @ContractorName =   U.FullName
    FROM [portal_db].[dbo].[User] AS U
    WHERE U.UserId1C = @Контрагент

    ------------------------------------------------------------
    -- Очищення тимчасових таблиць
    ------------------------------------------------------------
    DROP TABLE IF EXISTS #CustomerOrders;
    DROP TABLE IF EXISTS #OrderIDs;
    DROP TABLE IF EXISTS #PartnersDebt;
    DROP TABLE IF EXISTS #Avans;
    DROP TABLE IF EXISTS #Routes;
    DROP TABLE IF EXISTS #SalesDocs;
    DROP TABLE IF EXISTS #Sales;

    DROP TABLE IF EXISTS #AdvanceContractOrgLinks;
    DROP TABLE IF EXISTS #AdvanceContracts;
    DROP TABLE IF EXISTS #AdvanceBalanceRows;



    ------------------------------------------------------------
    -- 1. Замовлення контрагента
    ------------------------------------------------------------
    SELECT
        Z._IDRRef AS OrderID,

        CASE
            WHEN Z._Date_Time < '37530101'
                THEN Z._Date_Time
            ELSE DATEADD(YEAR, -2000, Z._Date_Time)
        END AS OrderDate,

        Z._Number AS OrderNumber,
        Z._Fld6216 AS ConstCount,

        CAST
        (
            Z._Fld6197
            AS FLOAT
        ) AS OrderSum,

        Z._Fld6177RRef AS CurrencyID

    INTO #CustomerOrders

    FROM [WST\WST].[oknastyle].[dbo].[_Document381] AS Z
        WITH
        (
            INDEX(_Document381_ByFieldFld6187_RR)
        )

    WHERE Z._Fld6187RRef = @Контрагент
      AND Z._Posted = 0x01
      AND Z._Marked = 0x00
      AND Z._Fld6191RRef = @MainOrg
      AND Z._Fld6252RRef = @ClosedState

      AND
      (
            (
                Z._Date_Time >= @RawStartDate
                AND Z._Date_Time < '37530101'
            )
            OR Z._Date_Time >= @ShiftedStartDate
      )

      AND LEFT(Z._Number, 2) IN
      (
          N'01',
          N'02',
          N'15',
          N'22',
          N'45',
          N'55',
          N'56',
          N'65',
          N'70'
      )

    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX PK_CustomerOrders
        ON #CustomerOrders(OrderID);

    ------------------------------------------------------------
    -- 2. ID замовлень
    ------------------------------------------------------------
    SELECT
        OrderID
    INTO #OrderIDs
    FROM #CustomerOrders;

    CREATE UNIQUE CLUSTERED INDEX PK_OrderIDs
        ON #OrderIDs(OrderID);

    ------------------------------------------------------------
    -- 3. Взаєморозрахунки
    ------------------------------------------------------------
    SELECT
        V.Сделка AS OrderID,

        SUM
        (
            CASE
                WHEN V.ВидДвижения = 0
                    THEN V.СуммаВзаиморасчетов

                WHEN V.ВидДвижения = 1
                    THEN V.СуммаВзаиморасчетов * -1

                ELSE 0
            END
        ) AS Summa

    INTO #PartnersDebt

    FROM #OrderIDs AS O

    INNER JOIN
        [WST\WST].[oknastyle_biV2].[dbo].[РегистрыНакопления.ВзаиморасчетыСКонтрагентами] AS V
        ON V.Сделка = O.OrderID

    WHERE V.Контрагент = @Контрагент
      AND V.Активность = 0x01

    GROUP BY
        V.Сделка

    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX PK_PartnersDebt
        ON #PartnersDebt(OrderID);

    ------------------------------------------------------------
    -- 4. Аванси, прив’язані до замовлень
    ------------------------------------------------------------
    SELECT
        R._Fld24772_RRRef AS OrderID,

        SUM
        (
            CASE
                WHEN R._RecordKind = 0
                    THEN R._Fld24776

                WHEN R._RecordKind = 1
                    THEN R._Fld24776 * -1

                ELSE 0
            END
        ) AS Summa

    INTO #Avans

    FROM #OrderIDs AS O

    INNER JOIN
        [WST\WST].[oknastyle].[dbo].[_AccumRg24770] AS R
        WITH
        (
            INDEX(_Accum24770_ByDims24778_RTRN)
        )
        ON R._Fld24772_TYPE = @OrderDocType
       AND R._Fld24772_RTRef = @OrderDocRTRef
       AND R._Fld24772_RRRef = O.OrderID

    WHERE R._Active = 0x01

    GROUP BY
        R._Fld24772_RRRef

    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX PK_Avans
        ON #Avans(OrderID);

    ------------------------------------------------------------
    -- 5. Маршрути
    ------------------------------------------------------------
    SELECT
        MR.ЗаказПокупателя AS OrderID,

        MAX
        (
            CASE
                WHEN M.ДатаЗавершенияМаршрута > '20010101'
                    THEN N'Завершено'
                ELSE ST.Наименование
            END
        ) AS RouteStatus,

        MAX
        (
            CASE
                WHEN M.ДатаЗавершенияМаршрута = '20010101'
                    THEN NULL
                ELSE M.ДатаЗавершенияМаршрута
            END
        ) AS EndOfRoute

    INTO #Routes

    FROM #OrderIDs AS O

    INNER JOIN
        [WST\WST].[oknastyle_biV2].[dbo].[Документы.ШБ_Маршрутизация.Маршрут] AS MR
        ON MR.ЗаказПокупателя = O.OrderID

    INNER JOIN
        [WST\WST].[oknastyle_biV2].[dbo].[Документы.ШБ_Маршрутизация] AS M
        ON M.Ссылка = MR.Ссылка

    LEFT JOIN
        [WST\WST].[oknastyle_biV2].[dbo].[Справочники.СостоянияМаршрутов] AS ST
        ON ST.Ссылка = M.СостояниеМаршрута

    WHERE M.Проведен = 0x01
      AND M.СостояниеМаршрута = @RouteState

    GROUP BY
        MR.ЗаказПокупателя

    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX PK_Routes
        ON #Routes(OrderID);

    ------------------------------------------------------------
    -- 6. Документи реалізації
    ------------------------------------------------------------
    SELECT
        R._IDRRef AS SaleDocID,
        R._Fld14982_RRRef AS OrderID,
        R._Fld14986 AS SumReal

    INTO #SalesDocs

    FROM #OrderIDs AS O

    INNER JOIN
        [WST\WST].[oknastyle].[dbo].[_Document566] AS R
        WITH
        (
            INDEX(_Documen566_ByField15124_R)
        )
        ON R._Fld14982_TYPE = @OrderDocType
       AND R._Fld14982_RTRef = @OrderDocRTRef
       AND R._Fld14982_RRRef = O.OrderID

    WHERE R._Posted = 0x01

    OPTION (RECOMPILE);

    CREATE CLUSTERED INDEX IX_SalesDocs_OrderID
        ON #SalesDocs(OrderID);

    ------------------------------------------------------------
    -- 7. Сума реалізації
    ------------------------------------------------------------
    SELECT
        SD.OrderID,
        SUM(SD.SumReal) AS SummaRealization

    INTO #Sales

    FROM #SalesDocs AS SD

    GROUP BY
        SD.OrderID

    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX PK_Sales
        ON #Sales(OrderID);

    ------------------------------------------------------------
    -- 8. Загальний борг за замовленнями
    ------------------------------------------------------------
    ;WITH CalculatedDetails AS
    (
        SELECT
            ----------------------------------------------------
            -- Залишок
            ----------------------------------------------------
            IIF
            (
                PD.Summa < 0,
                0,
                ISNULL(PD.Summa, 0)
            ) AS Summa,

            ----------------------------------------------------
            -- Борг за замовленням із маршрутом
            ----------------------------------------------------
            IIF
            (
                R.RouteStatus IS NOT NULL
                AND PD.Summa > 0,
                PD.Summa,
                NULL
            ) AS Debt,

            ----------------------------------------------------
            -- Partially paid order
            ----------------------------------------------------
            CASE
                WHEN R.RouteStatus IS NULL
                     AND AV.Summa > 0
                     AND AV.Summa < Z.OrderSum
                    THEN AV.Summa
                WHEN R.RouteStatus IS NULL
                     AND AV.Summa IS NULL
                     AND PD.Summa < 0
                     AND PD.Summa * -1 < Z.OrderSum
                    THEN Z.OrderSum + PD.Summa
                ELSE NULL
            END AS InWorkDebt,

            ----------------------------------------------------
            -- Замовлення без передоплати
            ----------------------------------------------------
            IIF
            (
                R.RouteStatus IS NULL
                AND ISNULL(S.SummaRealization, 0) <= 0
                AND
                (
                    (
                        CASE
                            WHEN AV.Summa IS NOT NULL
                                THEN Z.OrderSum - AV.Summa

                            WHEN AV.Summa IS NULL
                                 AND PD.Summa < 0
                                THEN PD.Summa * -1
                        END
                    ) IS NULL

                    OR

                    (
                        CASE
                            WHEN AV.Summa IS NOT NULL
                                THEN Z.OrderSum - AV.Summa

                            WHEN AV.Summa IS NULL
                                 AND PD.Summa < 0
                                THEN PD.Summa * -1
                        END
                    ) = 0
                ),
                Z.OrderSum,
                NULL
            ) AS BezPeredOplaty,

            ----------------------------------------------------
            -- Активність рядка
            ----------------------------------------------------
            CASE
                WHEN S.SummaRealization > 0
                     AND R.RouteStatus IS NOT NULL
                    THEN 0
                ELSE 1
            END AS IsActive

        FROM #CustomerOrders AS Z

        LEFT JOIN #PartnersDebt AS PD
            ON PD.OrderID = Z.OrderID

        LEFT JOIN #Avans AS AV
            ON AV.OrderID = Z.OrderID

        LEFT JOIN #Routes AS R
            ON R.OrderID = Z.OrderID

        LEFT JOIN #Sales AS S
            ON S.OrderID = Z.OrderID

        WHERE S.SummaRealization IS NULL
           OR PD.Summa <> 0
    )
    SELECT
        @OrderDebt =
            CAST
            (
                  ISNULL(SUM(ISNULL(Debt, 0)), 0)
                + ISNULL(SUM(ISNULL(InWorkDebt, 0)), 0)
                + ISNULL(SUM(ISNULL(BezPeredOplaty, 0)), 0)
                AS DECIMAL(18, 2)
            )
    FROM CalculatedDetails;



    ------------------------------------------------------------
    -- 9. Договори головної організації
    ------------------------------------------------------------
    SELECT
        Dog._IDRRef AS DogovorGuid

    INTO #AdvanceContractOrgLinks

    FROM [WST\WST].[oknastyle].[dbo].[_Reference86] AS Dog
        WITH
        (
            INDEX(_Reference86_ByFieldFld1892_RR),
            FORCESEEK
        )

    WHERE Dog._Fld1892RRef = @MainOrg

    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_AdvanceContractOrgLinks_Dogovor
        ON #AdvanceContractOrgLinks(DogovorGuid);

    ------------------------------------------------------------
    -- 10. Активні авансові договори
    ------------------------------------------------------------
    SELECT
        Dog._IDRRef AS DogovorGuid

    INTO #AdvanceContracts

    FROM #AdvanceContractOrgLinks AS L

    INNER JOIN
        [WST\WST].[oknastyle].[dbo].[_Reference86] AS Dog
        WITH (FORCESEEK)
        ON Dog._IDRRef = L.DogovorGuid

    WHERE Dog._Marked = 0x00
      AND Dog._Description LIKE N'%вансовий%'
      AND Dog._Description NOT LIKE N'%резерв%'
      AND Dog._Fld1882RRef = @AdvanceSettlementMode
      AND Dog._Fld1883RRef = @AdvanceCurrencyType
      AND Dog._Fld1909RRef = @AdvanceCashFlowArticle

      AND
      (
            Dog._Fld1910 > @Today
         OR Dog._Fld1910 = '20010101'
      )

    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_AdvanceContracts_Dogovor
        ON #AdvanceContracts(DogovorGuid);

    ------------------------------------------------------------
    -- 11. Залишки на авансових договорах
    ------------------------------------------------------------
    SELECT
        AC.DogovorGuid,
        O._Fld23257 AS BalancePart

    INTO #AdvanceBalanceRows

    FROM #AdvanceContracts AS AC

    INNER JOIN
        [WST\WST].[oknastyle].[dbo].[_AccumRgT23259] AS O
        WITH
        (
            FORCESEEK
            (
                _Accum23259_ByDims_TRRRRN
                (
                    _Period,
                    _Fld23253RRef,
                    _Fld23254_TYPE,
                    _Fld23254_RTRef,
                    _Fld23254_RRRef,
                    _Fld23255RRef,
                    _Fld23256RRef
                )
            )
        )
        ON O._Period = @FinalBalancePeriod
       AND O._Fld23253RRef = AC.DogovorGuid
       AND O._Fld23254_TYPE = @SummaryType
       AND O._Fld23254_RTRef = @ZeroRTRef
       AND O._Fld23254_RRRef = @ZeroRRRef
       AND O._Fld23255RRef = @MainOrg
       AND O._Fld23256RRef = @Контрагент

    OPTION
    (
        RECOMPILE,
        MAXDOP 4
    );

    CREATE CLUSTERED INDEX IX_AdvanceBalanceRows_Dogovor
        ON #AdvanceBalanceRows(DogovorGuid);

    ------------------------------------------------------------
    -- 12. Загальна сума на авансових договорах
    ------------------------------------------------------------
    SELECT
        @AdvanceBalance =
            CAST
            (
                ISNULL
                (
                    SUM(-BalancePart),
                    0
                )
                AS DECIMAL(18, 2)
            )
    FROM #AdvanceBalanceRows;

    ------------------------------------------------------------
    -- 13. Фінальний результат
    ------------------------------------------------------------
    SELECT
        ISNULL(@OrderDebt, 0)
            AS DebrSum,

        ISNULL(@AdvanceBalance, 0)
            AS MyWallet,

        ISNULL
        (
            @ContractorName,
            (
                SELECT TOP (1)
                    U.FullName
                FROM [portal_db].[dbo].[User] AS U
                WHERE U.UserId1C = @Контрагент
            )
        ) AS MyName,

        N'грн.' AS Currency;

    ------------------------------------------------------------
    -- 14. Очищення
    ------------------------------------------------------------
    DROP TABLE IF EXISTS #CustomerOrders;
    DROP TABLE IF EXISTS #OrderIDs;
    DROP TABLE IF EXISTS #PartnersDebt;
    DROP TABLE IF EXISTS #Avans;
    DROP TABLE IF EXISTS #Routes;
    DROP TABLE IF EXISTS #SalesDocs;
    DROP TABLE IF EXISTS #Sales;

    DROP TABLE IF EXISTS #AdvanceBalanceRows;
    DROP TABLE IF EXISTS #AdvanceContracts;
    DROP TABLE IF EXISTS #AdvanceContractOrgLinks;

    SET ANSI_WARNINGS ON;
END;

