USE [portal_db];
GO
ALTER PROCEDURE [dbo].[GetPartnerDebtsDirect_V2]
    @TargetPartnerID BINARY(16)
AS
BEGIN
    SET NOCOUNT ON;
    SET ANSI_WARNINGS OFF;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    DECLARE @StartDate DATE = '20230101';
    DECLARE @RawStartDate DATETIME = '20230101';
    DECLARE @ShiftedStartDate DATETIME = DATEADD(YEAR, 2000, @RawStartDate);

    DECLARE @MainOrg BINARY(16) = 0xA88A001B214EEE7A11E15373F04D8182;
    DECLARE @ClosedState BINARY(16) = 0x99B94EA6CCA98189497428BD64C2692D;

    DECLARE @OrderDocType BINARY(1) = 0x08;
    DECLARE @OrderDocRTRef BINARY(4) = 0x0000017D;

    DROP TABLE IF EXISTS #CustomerOrders;
    DROP TABLE IF EXISTS #OrderIDs;
    DROP TABLE IF EXISTS #PartnersDebt;
    DROP TABLE IF EXISTS #Avans;
    DROP TABLE IF EXISTS #Routes;
    DROP TABLE IF EXISTS #SalesDocs;
    DROP TABLE IF EXISTS #Sales;

    ------------------------------------------------------------
    -- 1. Ліміт боргу
    ------------------------------------------------------------
    DECLARE @CustomerLimit FLOAT =
    (
        SELECT TOP (1) ISNULL(LD.Сумма, 0)
        FROM [WST\WST].[oknastyle_biV2].[dbo].[Справочники.ЛимитыДолгов] LD
        WHERE LD.Контрагент = @TargetPartnerID
    );

    ------------------------------------------------------------
    -- 2. Замовлення через фізичну _Document381
    -- індекс: _Document381_ByFieldFld6187_RR
    ------------------------------------------------------------
    SELECT
    Z._IDRRef AS OrderID,
    CASE
        WHEN Z._Date_Time < '37530101' THEN Z._Date_Time
        ELSE DATEADD(YEAR, -2000, Z._Date_Time)
    END AS OrderDate,

    Z._Fld6205_TYPE AS BaseDocumentType,
    Z._Fld6205_RTRef AS BaseDocumentRTRef,
    Z._Fld6205_RRRef AS BaseDocumentID,

    Z._Number AS OrderNumber,
    Z._Fld6216 AS ConstCount,
    CAST(Z._Fld6197 AS FLOAT) AS OrderSum,
    Z._Fld6177RRef AS CurrencyID,
    SZ.Наименование AS OrderState
INTO #CustomerOrders
FROM [WST\WST].[oknastyle].[dbo].[_Document381] Z
    WITH (INDEX(_Document381_ByFieldFld6187_RR))
LEFT JOIN [oknastyle_biV2].[dbo].[Справочники.БВ_СостоянияЗаказов] SZ
    ON SZ.Ссылка = Z._Fld6252RRef
    WHERE Z._Fld6187RRef = @TargetPartnerID
      AND Z._Posted = 0x01
      AND Z._Marked = 0x00
      AND Z._Fld6191RRef = @MainOrg
      AND Z._Fld6252RRef = @ClosedState
      AND
      (
            (Z._Date_Time >= @RawStartDate AND Z._Date_Time < '37530101')
         OR Z._Date_Time >= @ShiftedStartDate
      )
      AND LEFT(Z._Number, 2) IN
      (
          N'01', N'02', N'15', N'22', N'45', N'55', N'56', N'65', N'70'
      )
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX PK_CustomerOrders
    ON #CustomerOrders(OrderID);

    IF NOT EXISTS (SELECT 1 FROM #CustomerOrders)
    BEGIN
        SELECT TOP 0
            CAST(NULL AS DATETIME) AS ZakazDate,
            CAST(NULL AS NVARCHAR(50)) AS ZakazNum,
            CAST(NULL AS NVARCHAR(50)) AS BaseDocumentNumber,
            CAST(NULL AS INT) AS ConstCount,
            CAST(NULL AS NVARCHAR(200)) AS OrderState,
            CAST(NULL AS NVARCHAR(200)) AS RouteStatus,
            CAST(NULL AS DATETIME) AS EndOfRoute,
            CAST(NULL AS DATETIME) AS ObrobkaKassa,
            CAST(NULL AS FLOAT) AS ZakazSumma,
            CAST(NULL AS FLOAT) AS PaidAmount,
            CAST(NULL AS FLOAT) AS SummaRealization,
            CAST(NULL AS FLOAT) AS Summa,
            CAST(NULL AS FLOAT) AS NedoAvans,
            CAST(NULL AS FLOAT) AS BezPeredOplaty,
            CAST(NULL AS FLOAT) AS Debt,
            CAST(NULL AS FLOAT) AS InWorkDebt,
            CAST(NULL AS FLOAT) AS DebtMoreTen,
            CAST(NULL AS NVARCHAR(100)) AS CurrencyName,
            @CustomerLimit AS CustomerLimit,
            CAST(NULL AS INT) AS SortOrder;

        SET ANSI_WARNINGS ON;
        RETURN;
    END;

    SELECT OrderID
    INTO #OrderIDs
    FROM #CustomerOrders;

    CREATE UNIQUE CLUSTERED INDEX PK_OrderIDs
    ON #OrderIDs(OrderID);

    ------------------------------------------------------------
    -- 3. Борг з регістру ВзаиморасчетыСКонтрагентами
    -- фізичні поля не чіпаю, бо ти не давала структуру цього регістру.
    -- Але обмежуємо читання тільки #OrderIDs.
    ------------------------------------------------------------
    SELECT
        V.Сделка AS OrderID,
        SUM
        (
            CASE
                WHEN V.ВидДвижения = 0 THEN V.СуммаВзаиморасчетов
                WHEN V.ВидДвижения = 1 THEN V.СуммаВзаиморасчетов * -1
                ELSE 0
            END
        ) AS Summa
    INTO #PartnersDebt
    FROM #OrderIDs O
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[РегистрыНакопления.ВзаиморасчетыСКонтрагентами] V
        ON V.Сделка = O.OrderID
    WHERE V.Контрагент = @TargetPartnerID
      AND V.Активность = 0x01
    GROUP BY V.Сделка
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX PK_PartnersDebt
    ON #PartnersDebt(OrderID);

    ------------------------------------------------------------
    -- 4. Аванси через фізичну _AccumRg24770
    -- індекс: _Accum24770_ByDims24778_RTRN
    ------------------------------------------------------------
    SELECT
        R._Fld24772_RRRef AS OrderID,
        SUM
        (
            CASE
                WHEN R._RecordKind = 0 THEN R._Fld24776
                WHEN R._RecordKind = 1 THEN R._Fld24776 * -1
                ELSE 0
            END
        ) AS Summa
    INTO #Avans
    FROM #OrderIDs O
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_AccumRg24770] R
        WITH (INDEX(_Accum24770_ByDims24778_RTRN))
        ON R._Fld24772_TYPE = @OrderDocType
       AND R._Fld24772_RTRef = @OrderDocRTRef
       AND R._Fld24772_RRRef = O.OrderID
    WHERE R._Active = 0x01
    GROUP BY R._Fld24772_RRRef
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX PK_Avans
    ON #Avans(OrderID);

    ------------------------------------------------------------
    -- 5. Маршрути тільки по потрібних замовленнях
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
        ) AS EndOfRoute,
        MAX
        (
            CASE
                WHEN M.ОбработаноКассиром = '20010101'
                    THEN NULL
                ELSE M.ОбработаноКассиром
            END
        ) AS ObrobkaKassa
    INTO #Routes
    FROM #OrderIDs O
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ШБ_Маршрутизация.Маршрут] MR
        ON MR.ЗаказПокупателя = O.OrderID
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ШБ_Маршрутизация] M
        ON M.Ссылка = MR.Ссылка
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.СостоянияМаршрутов] ST
        ON ST.Ссылка = M.СостояниеМаршрута
    WHERE M.Проведен = 0x01
      AND M.СостояниеМаршрута = 0x89715A4833951F054D34148D295CD149
    GROUP BY MR.ЗаказПокупателя
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX PK_Routes
    ON #Routes(OrderID);

    ------------------------------------------------------------
    -- 6. Реалізації через фізичну _Document566
    -- індекс: _Documen566_ByField15124_R
    -- сума документа = _Fld14986
    ------------------------------------------------------------
    SELECT
        R._IDRRef AS SaleDocID,
        R._Fld14982_RRRef AS OrderID,
        R._Fld14986 AS SumReal
    INTO #SalesDocs
    FROM #OrderIDs O
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document566] R
        WITH (INDEX(_Documen566_ByField15124_R))
        ON R._Fld14982_TYPE = @OrderDocType
       AND R._Fld14982_RTRef = @OrderDocRTRef
       AND R._Fld14982_RRRef = O.OrderID
    WHERE R._Posted = 0x01
    OPTION (RECOMPILE);

    CREATE CLUSTERED INDEX IX_SalesDocs_OrderID
    ON #SalesDocs(OrderID);

    SELECT
        SD.OrderID,
        SUM(SD.SumReal) AS SummaRealization
    INTO #Sales
    FROM #SalesDocs SD
    GROUP BY SD.OrderID
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX PK_Sales
    ON #Sales(OrderID);

    ------------------------------------------------------------
    -- 7. Фінальний розрахунок
    ------------------------------------------------------------
    WITH CalculatedDetails AS
    (
        SELECT
            Z.OrderDate AS ZakazDate,
            Z.OrderNumber AS ZakazNum,
            BaseDoc.Номер AS BaseDocumentNumber,
            Z.ConstCount,
            Z.OrderState,
            R.RouteStatus,
            R.EndOfRoute,
            R.ObrobkaKassa,
            Z.OrderSum AS ZakazSumma,
            CASE
                WHEN AV.Summa IS NOT NULL AND Z.OrderSum - AV.Summa <= 0 THEN 0
                WHEN AV.Summa IS NOT NULL AND Z.OrderSum - AV.Summa >= Z.OrderSum THEN Z.OrderSum
                WHEN AV.Summa IS NOT NULL THEN Z.OrderSum - AV.Summa
                WHEN PD.Summa < 0 AND PD.Summa * -1 >= Z.OrderSum THEN Z.OrderSum
                WHEN PD.Summa < 0 THEN PD.Summa * -1
                ELSE 0
            END AS PaidAmount,
            ISNULL(S.SummaRealization, 0) AS SummaRealization,
            IIF(PD.Summa < 0, 0, ISNULL(PD.Summa, 0)) AS Summa,

            ISNULL(V_Base.Наименование, V.Наименование) AS CurrencyName,

            IIF
            (
                ISNULL(S.SummaRealization, 0) <= 0
                AND PD.Summa IS NOT NULL
                AND PD.Summa <> 0
                AND Z.OrderSum <> PD.Summa
                AND Z.OrderSum / 2 < PD.Summa,
                PD.Summa - Z.OrderSum / 2,
                NULL
            ) AS NedoAvans,

            IIF
            (
                ISNULL(S.SummaRealization, 0) <= 0
                AND
                (
                    (
                        CASE
                            WHEN AV.Summa IS NOT NULL THEN Z.OrderSum - AV.Summa
                            WHEN AV.Summa IS NULL AND PD.Summa < 0 THEN PD.Summa * -1
                        END
                    ) IS NULL
                    OR
                    (
                        CASE
                            WHEN AV.Summa IS NOT NULL THEN Z.OrderSum - AV.Summa
                            WHEN AV.Summa IS NULL AND PD.Summa < 0 THEN PD.Summa * -1
                        END
                    ) = 0
                ),
                Z.OrderSum,
                NULL
            ) AS BezPeredOplaty,

            IIF
            (
                R.RouteStatus IS NOT NULL AND PD.Summa > 0,
                PD.Summa,
                NULL
            ) AS Debt,

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

            IIF
            (
                R.RouteStatus IS NOT NULL
                AND CAST(DATEADD(DAY, 10, R.EndOfRoute) AS DATE) <= CAST(GETDATE() AS DATE)
                AND PD.Summa > 0,
                PD.Summa,
                NULL
            ) AS DebtMoreTen,

            CASE
                WHEN S.SummaRealization > 0 AND R.RouteStatus IS NOT NULL THEN 0
                ELSE 1
            END AS IsActive
        FROM #CustomerOrders Z
        LEFT JOIN #PartnersDebt PD
            ON PD.OrderID = Z.OrderID
        LEFT JOIN #Avans AV
            ON AV.OrderID = Z.OrderID
        LEFT JOIN #Routes R
            ON R.OrderID = Z.OrderID
        LEFT JOIN #Sales S
            ON S.OrderID = Z.OrderID
        LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] BaseDoc
            ON BaseDoc.Ссылка = Z.BaseDocumentID
        LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Валюты] V
            ON V.Ссылка = Z.CurrencyID
        LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Валюты] V_Base
            ON V_Base.Ссылка = V.ОсновнаяВалюта
        WHERE
            S.SummaRealization IS NULL
            OR PD.Summa <> 0
    )
    SELECT *
    FROM
    (
        SELECT
            ZakazDate,
            ZakazNum,
            BaseDocumentNumber,
            ConstCount,
            OrderState,
            RouteStatus,
            EndOfRoute,
            ObrobkaKassa,
            ZakazSumma,
            PaidAmount,
            SummaRealization,
            Summa,
            NedoAvans,
            BezPeredOplaty,
            Debt,
            InWorkDebt,
            DebtMoreTen,
            CurrencyName,
            @CustomerLimit AS CustomerLimit,
            0 AS SortOrder
        FROM CalculatedDetails

        UNION ALL

        SELECT
            NULL,
            CONCAT(N'РАЗОМ (', CurrencyName, N'):'),
            NULL,
            SUM(ConstCount * IsActive),
            NULL,
            NULL,
            NULL,
            NULL,
            SUM(ZakazSumma * IsActive),
            SUM(PaidAmount * IsActive),
            SUM(SummaRealization * IsActive),
            SUM(Summa * IsActive),
            SUM(ISNULL(NedoAvans, 0)),
            SUM(ISNULL(BezPeredOplaty, 0)),
            SUM(ISNULL(Debt, 0)),
            SUM(ISNULL(InWorkDebt, 0)),
            SUM(ISNULL(DebtMoreTen, 0)),
            CurrencyName,
            @CustomerLimit,
            1 AS SortOrder
        FROM CalculatedDetails
        GROUP BY CurrencyName
    ) Res
    ORDER BY
        CurrencyName,
        SortOrder,
        ZakazDate DESC
    OPTION (RECOMPILE);

    DROP TABLE IF EXISTS #CustomerOrders;
    DROP TABLE IF EXISTS #OrderIDs;
    DROP TABLE IF EXISTS #PartnersDebt;
    DROP TABLE IF EXISTS #Avans;
    DROP TABLE IF EXISTS #Routes;
    DROP TABLE IF EXISTS #SalesDocs;
    DROP TABLE IF EXISTS #Sales;

    SET ANSI_WARNINGS ON;
END;
GO
