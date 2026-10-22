
CREATE PROCEDURE [dbo].[GetContractorUnifiedAnalytics]
    @StartDate DATE,
    @EndDate DATE,
    @Contractor_ID BINARY(16)
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    DECLARE @NextEndDate DATE = DATEADD(DAY, 1, @EndDate);
    DECLARE @PrevYearStart DATE = DATEFROMPARTS(YEAR(@StartDate) - 1, 1, 1);
    DECLARE @MainItem BINARY(16) = 0x99B8002590633BB311E177FF631F08AD;
    DECLARE @OrderDocType BINARY(1) = 0x08;
    DECLARE @OrderDocRTRef BINARY(4) = 0x0000017D;
    DECLARE @RawStartDate DATETIME = CAST(@StartDate AS DATETIME);
    DECLARE @RawNextEndDate DATETIME = CAST(@NextEndDate AS DATETIME);
    DECLARE @ShiftedStartDate DATETIME = DATEADD(YEAR, 2000, CAST(@StartDate AS DATETIME));
    DECLARE @ShiftedNextEndDate DATETIME = DATEADD(YEAR, 2000, CAST(@NextEndDate AS DATETIME));
    DECLARE @RawPrevYearStart DATETIME = CAST(@PrevYearStart AS DATETIME);
    DECLARE @ShiftedPrevYearStart DATETIME = DATEADD(YEAR, 2000, CAST(@PrevYearStart AS DATETIME));

    DROP TABLE IF EXISTS #BaseOrderSource;
    DROP TABLE IF EXISTS #BaseOrderLinks;
    DROP TABLE IF EXISTS #BaseOrders;
    DROP TABLE IF EXISTS #ABC;
    DROP TABLE IF EXISTS #ProdOrders;
    DROP TABLE IF EXISTS #ProdReports;
    DROP TABLE IF EXISTS #Sales;
    DROP TABLE IF EXISTS #OrdersFinal;
    DROP TABLE IF EXISTS #OrderItems;

    SELECT
        ZP._IDRRef AS OrderID
    INTO #BaseOrderSource
    FROM [WST\WST].[oknastyle].[dbo].[_Document381] AS ZP
         WITH (INDEX(_Document381_ByFieldFld6187_RR), FORCESEEK)
    WHERE ZP._Fld6187RRef = @Contractor_ID
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_BaseOrderSource_OrderID
        ON #BaseOrderSource(OrderID);

    SELECT
        ZP._IDRRef AS OrderID
    INTO #BaseOrderLinks
    FROM #BaseOrderSource AS S
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document381] AS ZP
         WITH (FORCESEEK)
        ON ZP._IDRRef = S.OrderID
    WHERE ZP._Fld6187RRef = @Contractor_ID
      AND ZP._Marked = 0x00
      AND ZP._Posted = 0x01
      AND
      (
            (ZP._Date_Time >= @RawStartDate AND ZP._Date_Time < @RawNextEndDate)
         OR (ZP._Date_Time >= @ShiftedStartDate AND ZP._Date_Time < @ShiftedNextEndDate)
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

    SELECT
        ZP.Ссылка AS OrderID,
        ZP.Номер AS OrderNumber,
        ZP.Дата AS OrderDate,
        CONVERT(char(7), ZP.Дата, 120) AS PeriodLabel,
        DATEFROMPARTS(YEAR(ZP.Дата), MONTH(ZP.Дата), 1) AS PeriodSort,
        ZP.ГМ_НомерЗаказаКлиента AS ClientOrderNumber,
        ZP.Контрагент AS ContractorID,
        ZP.СуммаДокумента AS OrderSum,
        ZP.БВ_КоличествоКонструкций AS ConstructionsCount,
        ZP.БВ_ПрофильнаяСистема,
        ZP.БВ_ФурнитурныйНабор,
        ZP.БВ_ЦветПрофиля,
        ZP.БВ_СостояниеЗаказа,
        ZP.БВ_ДатаПроизводства AS OrderProductionDate,
        ZP.ДатаПроизводства AS ProductionDate,
        ZP.ДатаОтгрузки AS ShipmentDate,
        ZP.БВ_СложностьПродукции,
        OS.Наименование AS OrderStatusName,
        TRY_CAST(OS.Код AS INT) AS OrderStatusCode,
        LEFT(ZP.Номер, 2) AS OrderPrefix
    INTO #BaseOrders
    FROM #BaseOrderLinks AS L
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] AS ZP
        ON ZP.Ссылка = L.OrderID
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.БВ_СостоянияЗаказов] AS OS
        ON OS.Ссылка = ZP.БВ_СостояниеЗаказа
    WHERE ISNULL(OS.Наименование, N'') <> N'Отказ' AND OS.Наименование = N'Подтверждено'
      AND TRY_CAST(OS.Код AS INT) >= 2 
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_BaseOrders_OrderID
        ON #BaseOrders(OrderID);

    CREATE NONCLUSTERED INDEX IX_BaseOrders_PeriodSort
        ON #BaseOrders(PeriodSort)
        INCLUDE (OrderDate, OrderSum, ConstructionsCount);

    SELECT
        BO.OrderID,
        H.CalcPeriod,
        H.PlannedProductionDate,
        CAST(H.PlannedProductionDate AS DATE) AS PlanDate,
        H.Расшифровка,
        H.ABC
    INTO #ABC
    FROM #BaseOrders AS BO
    OUTER APPLY
    (
        SELECT TOP (1)
            HH.Период AS CalcPeriod,
            HH.ДатаПроизводства AS PlannedProductionDate,
            HH.Расшифровка,
            CASE
                WHEN HH.Расшифровка LIKE N'%ИТОГО ABC% - A%' THEN 'A'
                WHEN HH.Расшифровка LIKE N'%ИТОГО ABC% - B%' THEN 'B'
                WHEN HH.Расшифровка LIKE N'%ИТОГО ABC% - C%' THEN 'C'
                ELSE 'Other'
            END AS ABC
        FROM [WST\WST].[oknastyle_biV2].[dbo].[РегистрыСведений.ГМ_ИсторияРасчетаДатыПроизводства] AS HH WITH (NOLOCK)
        WHERE HH.ЗаказПокупателя = BO.OrderID
          AND HH.Расшифровка LIKE N'%ИТОГО ABC%'
        ORDER BY HH.Период DESC
    ) AS H
    WHERE H.CalcPeriod IS NOT NULL
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_ABC_OrderID
        ON #ABC(OrderID);

    SELECT
        BO.OrderID,
        MIN(CASE
                WHEN YEAR(ZNP._Fld6108) < 3753 THEN ZNP._Fld6108
                ELSE DATEADD(YEAR, -2000, ZNP._Fld6108)
            END) AS ProductionStartDateMin,
        MAX(CASE
                WHEN YEAR(ZNP._Fld6108) < 3753 THEN ZNP._Fld6108
                ELSE DATEADD(YEAR, -2000, ZNP._Fld6108)
            END) AS ProductionStartDateMax
    INTO #ProdOrders
    FROM #BaseOrders AS BO
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document380_VT6116] AS ZNPP
         WITH (INDEX(_Document380_VT6116_ByFieldFld6127_RR), FORCESEEK)
        ON ZNPP._Fld6127_TYPE = @OrderDocType
       AND ZNPP._Fld6127_RTRef = @OrderDocRTRef
       AND ZNPP._Fld6127_RRRef = BO.OrderID
       AND ZNPP._Fld6118RRef = @MainItem
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document380] AS ZNP
        ON ZNP._IDRRef = ZNPP._Document380_IDRRef
    WHERE ZNP._Posted = 0x01
      AND
      (
            (ZNP._Date_Time >= @RawPrevYearStart AND ZNP._Date_Time < '3753-01-01')
         OR ZNP._Date_Time >= @ShiftedPrevYearStart
      )
    GROUP BY
        BO.OrderID
    OPTION (FORCE ORDER, LOOP JOIN, RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_ProdOrders_OrderID
        ON #ProdOrders(OrderID);

    SELECT
        BO.OrderID,
        SUM(OPP._Fld10543) AS ProducedTotal,
        MIN(CASE
                WHEN YEAR(OP._Date_Time) < 3753 THEN OP._Date_Time
                ELSE DATEADD(YEAR, -2000, OP._Date_Time)
            END) AS ReadyProductionMin,
        MAX(CASE
                WHEN YEAR(OP._Date_Time) < 3753 THEN OP._Date_Time
                ELSE DATEADD(YEAR, -2000, OP._Date_Time)
            END) AS ReadyProductionMax,
        CAST(MAX(CASE
                    WHEN YEAR(OP._Date_Time) < 3753 THEN OP._Date_Time
                    ELSE DATEADD(YEAR, -2000, OP._Date_Time)
                END) AS DATE) AS ReadyDate
    INTO #ProdReports
    FROM #BaseOrders AS BO
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document488_VT10534] AS OPP
         WITH (INDEX(_Documen488_VT10534_ByField10583_RR), FORCESEEK)
        ON OPP._Fld10575_TYPE = @OrderDocType
       AND OPP._Fld10575_RTRef = @OrderDocRTRef
       AND OPP._Fld10575_RRRef = BO.OrderID
       AND OPP._Fld10548RRef = @MainItem
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document488] AS OP
        ON OP._IDRRef = OPP._Document488_IDRRef
    WHERE OP._Posted = 0x01
      AND
      (
            (OP._Date_Time >= @RawPrevYearStart AND OP._Date_Time < '3753-01-01')
         OR OP._Date_Time >= @ShiftedPrevYearStart
      )
    GROUP BY
        BO.OrderID
    OPTION (FORCE ORDER, LOOP JOIN, RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_ProdReports_OrderID
        ON #ProdReports(OrderID);

    SELECT
        BO.OrderID,
        MAX(CASE
                WHEN YEAR(RT._Date_Time) < 3753 THEN RT._Date_Time
                ELSE DATEADD(YEAR, -2000, RT._Date_Time)
            END) AS SaleDate,
        SUM(T._Fld15020) AS SoldQuantity
    INTO #Sales
    FROM #BaseOrders AS BO
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document566] AS RT
         WITH (INDEX(_Documen566_ByField15124_R), FORCESEEK)
        ON RT._Fld14982_TYPE = @OrderDocType
       AND RT._Fld14982_RTRef = @OrderDocRTRef
       AND RT._Fld14982_RRRef = BO.OrderID
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document566_VT15014] AS T
         WITH (INDEX(NonClusteredIndex_20260505_141334))
        ON T._Document566_IDRRef = RT._IDRRef
       AND T._Fld15023RRef = @MainItem
    WHERE RT._Posted = 0x01
      AND RT._Marked = 0x00
      AND
      (
            (RT._Date_Time >= @RawPrevYearStart AND RT._Date_Time < '3753-01-01')
         OR RT._Date_Time >= @ShiftedPrevYearStart
      )
    GROUP BY
        BO.OrderID
    OPTION (FORCE ORDER, LOOP JOIN, RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_Sales_OrderID
        ON #Sales(OrderID);

    SELECT
        BO.OrderID,
        BO.OrderNumber,
        BO.OrderDate,
        BO.PeriodLabel,
        BO.PeriodSort,
        BO.ClientOrderNumber,
        BO.ContractorID,
        BO.OrderSum,
        BO.ConstructionsCount,
        BO.БВ_ПрофильнаяСистема,
        BO.БВ_ФурнитурныйНабор,
        BO.БВ_ЦветПрофиля,
        BO.БВ_СостояниеЗаказа,
        BO.OrderProductionDate,
        BO.ProductionDate,
        BO.ShipmentDate,
        BO.БВ_СложностьПродукции,
        BO.OrderStatusName,
        BO.OrderStatusCode,
        BO.OrderPrefix,
        A.ABC,
        A.CalcPeriod,
        A.PlannedProductionDate,
        A.PlanDate,
        A.Расшифровка,
        PO.ProductionStartDateMin,
        PO.ProductionStartDateMax,
        PR.ProducedTotal,
        PR.ReadyProductionMin,
        PR.ReadyProductionMax,
        PR.ReadyDate,
        S.SaleDate,
        ISNULL(S.SoldQuantity, 0) AS SoldQuantity,
        CASE
            WHEN S.SaleDate IS NOT NULL THEN N'Відвантажений'
            WHEN PR.ReadyProductionMax IS NOT NULL THEN N'Готовий'
            WHEN PO.ProductionStartDateMax IS NOT NULL THEN N'У виробництві'
            WHEN BO.OrderStatusName = N'Подтверждено' THEN N'Підтверджений'
            ELSE N'Підтверджений'
        END AS OrderStage
    INTO #OrdersFinal
    FROM #BaseOrders AS BO
    LEFT JOIN #ABC AS A
        ON A.OrderID = BO.OrderID
    LEFT JOIN #ProdOrders AS PO
        ON PO.OrderID = BO.OrderID
    LEFT JOIN #ProdReports AS PR
        ON PR.OrderID = BO.OrderID
    LEFT JOIN #Sales AS S
        ON S.OrderID = BO.OrderID
    OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_OrdersFinal_OrderID
        ON #OrdersFinal(OrderID);

    CREATE NONCLUSTERED INDEX IX_OrdersFinal_PeriodSort
        ON #OrdersFinal(PeriodSort);

    CREATE NONCLUSTERED INDEX IX_OrdersFinal_ABC
        ON #OrdersFinal(ABC);

    SELECT
        OFN.OrderID,
        OFN.OrderNumber,
        ZPT.Количество,
        HP.Наименование AS RawHPName,
        CASE 
            WHEN OFN.OrderPrefix = '65' THEN N'Алюмінієві конструкції (Ponzio)'
            WHEN HP.Наименование LIKE N'%Каталог%' THEN N'Каталожна модель'
            WHEN HP.Наименование LIKE N'%Нестандарт%' AND OFN.OrderPrefix = '22' THEN N'Малі вікна'
            WHEN HP.Наименование LIKE N'%Нестандарт%' THEN N'Індивідуальна конструкція'
            WHEN HP.Наименование LIKE N'%Стандарт%' OR HP.Наименование IS NULL THEN N'Стандартна модель'
            WHEN HP.Наименование = N'ПВХ Двери техничные' THEN N'Двері технічні'
            WHEN HP.Наименование = N'ПВХ Стеклопакет в раме' THEN N'Склопакет у рамі'
            ELSE HP.Наименование
        END AS ProductionModel,
        CASE 
            WHEN OFN.OrderPrefix = '22' THEN N'Дільниця 22'
            WHEN OFN.OrderPrefix = '01' THEN N'Дільниця 01'
            WHEN OFN.OrderPrefix = '45' THEN N'Дільниця 45'
            WHEN OFN.OrderPrefix = '65' THEN N'Дільниця 65'
            WHEN OFN.OrderPrefix = '15' THEN N'Дільниця 15'
            WHEN OFN.OrderPrefix = '02' THEN N'Дільниця 02'
            WHEN OFN.OrderPrefix IN ('55', '56') THEN N'Дільниця 55/56'
            ELSE N'Дільниця ' + OFN.OrderPrefix
        END AS ProductionSection,
        CASE 
            WHEN OFN.OrderPrefix = '65' THEN N'Двері'
            WHEN TC.[БВ_ТипыКонструкций] = 'Окно' THEN N'Вікно'
            WHEN TC.[БВ_ТипыКонструкций] = 'МежкомнатнаяДверь' THEN N'Міжкімнатні двері'
            WHEN TC.БВ_ТипыКонструкций = 'ДвериБесшовнаяСпайка' THEN N'Двері безшовне зварювання'
            WHEN TC.БВ_ТипыКонструкций = 'ОкноБесшовнаяСпайка' THEN N'Вікна безшовне зварювання'
            WHEN TC.БВ_ТипыКонструкций = 'ТехническиеДвериПВХ' THEN N'Технічні двері ПВХ'
            WHEN TC.БВ_ТипыКонструкций = 'РаздвижныеСистемыSL76' THEN N'Розсувні системи SL76'
            WHEN TC.БВ_ТипыКонструкций = 'ДвериLampre' THEN N'Двері Lampre'
            WHEN TC.БВ_ТипыКонструкций = 'ОкноВклСП' THEN N'Вікно вкл склопакет'
            WHEN N.Наименование LIKE N'%Подоконник%' OR N.Наименование LIKE N'%Підвіконня%' OR N.Наименование LIKE N'%Заглушка%WDS%' THEN N'Підвіконня'
            WHEN N.Наименование LIKE N'%Лиштва%' THEN N'Лиштва'
            WHEN N.Наименование LIKE N'%Отлив%' OR N.Наименование LIKE N'%Відлив%' THEN N'Відливи'
            WHEN N.Наименование LIKE N'%сетка%' OR N.Наименование LIKE N'%Сітка%' THEN N'Москітні сітки'
            WHEN TC.БВ_ТипыКонструкций LIKE N'%ФранцузкийБалкон%' OR N.Наименование LIKE N'%ФранцузкийБалкон%' THEN N'Французький балкон'
            ELSE ISNULL(TC.[БВ_ТипыКонструкций], N'Інше')
        END AS ConstructionTypeName_UA,
        CASE 
            WHEN TC.[БВ_ТипыКонструкций] IS NOT NULL THEN N'М/П Конструкція'
            WHEN N.Наименование LIKE N'%Подоконник%' OR N.Наименование LIKE N'%Підвіконня%' OR N.Наименование LIKE N'%Заглушка%WDS%' THEN N'Підвіконня (всі типи)'
            WHEN N.Наименование LIKE N'%Лиштва%' THEN N'Лиштва (всі типи)'
            WHEN N.Наименование LIKE N'%сетка%' OR N.Наименование LIKE N'%Сітка%' THEN N'Москітна сітка (всі типи)'
            WHEN N.Наименование LIKE N'%Отлив%' OR N.Наименование LIKE N'%Відлив%' THEN N'Відлив (всі типи)'
            ELSE N.Наименование 
        END AS ItemName_UA,
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(HP.Наименование, N'Стандарт'), 
            'Конструкции', N'Конструкції'), 
            'Двери', N'Двері'), 
            'Стеклопакет в раме', N'Склопакет у рамі'),
            'БЕСШОВНАЯ СПАЙКА', N'безшовне зварювання'),
            'техничные', N'технічні'),
            'НЕстандарт', N'Нестандарт'),
            'алюминиевые', N'алюмінієві') AS Складність_UA
    INTO #OrderItems
    FROM #OrdersFinal AS OFN
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя.Товары] AS ZPT WITH (NOLOCK)
        ON ZPT.Ссылка = OFN.OrderID
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Номенклатура] AS N WITH (NOLOCK)
        ON ZPT.Номенклатура = N.Ссылка
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.ХарактеристикиНоменклатуры] AS HN WITH (NOLOCK)
        ON ZPT.ХарактеристикаНоменклатуры = HN.Ссылка
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Перечисления.БВ_ТипыКонструкций] AS TC WITH (NOLOCK)
        ON HN.БВ_ТипКонструкции = TC.Ссылка
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.БВ_СложностьГотовойПродукции] AS HP WITH (NOLOCK)
        ON HP.Ссылка = OFN.БВ_СложностьПродукции
    WHERE (ZPT.Номенклатура = @MainItem OR N.Услуга = 0)
      AND ISNULL(N.Наименование, N'') NOT LIKE N'%Пакет косметики%'
      AND ISNULL(N.Наименование, N'') NOT LIKE N'%Допы (ВС)%'
      AND ISNULL(HN.Наименование, N'') <> N''
    OPTION (RECOMPILE);

    CREATE CLUSTERED INDEX IX_OrderItems_Group
        ON #OrderItems(ProductionModel, ConstructionTypeName_UA, ItemName_UA, Складність_UA);

    CREATE NONCLUSTERED INDEX IX_OrderItems_OrderID
        ON #OrderItems(OrderID);

    SELECT
        ISNULL(OrderStatusName, N'Статус не знайдено') AS OrderStatusName,
        COUNT(*) AS OrdersCount,
        SUM(ISNULL(ConstructionsCount, 0)) AS TotalConstructions,
        SUM(ISNULL(OrderSum, 0)) AS TotalSum
    FROM #OrdersFinal
    GROUP BY OrderStatusName
    ORDER BY OrdersCount DESC
    OPTION (RECOMPILE);

    SELECT
        OrderStage,
        COUNT(*) AS OrdersCount,
        SUM(ISNULL(ConstructionsCount, 0)) AS TotalConstructions,
        SUM(ISNULL(OrderSum, 0)) AS TotalSum
    FROM #OrdersFinal
    GROUP BY OrderStage
    ORDER BY OrdersCount DESC
    OPTION (RECOMPILE);

    SELECT
        ISNULL(ABC, 'No ABC') AS ABC,
        COUNT(*) AS OrdersCount,
        SUM(CASE 
            WHEN ReadyDate IS NOT NULL
             AND PlanDate IS NOT NULL
             AND ReadyDate <= PlanDate
            THEN 1 ELSE 0 
        END) AS InTimeCount,
        SUM(CASE 
            WHEN ReadyDate IS NOT NULL
             AND PlanDate IS NOT NULL
             AND ReadyDate > PlanDate
            THEN 1 ELSE 0 
        END) AS DelayedCount,
        SUM(CASE 
            WHEN ReadyDate IS NULL
            THEN 1 ELSE 0 
        END) AS NotProducedCount,
        CAST(
            100.0 * SUM(CASE 
                WHEN ReadyDate IS NOT NULL
                 AND PlanDate IS NOT NULL
                 AND ReadyDate <= PlanDate
                THEN 1 ELSE 0 
            END) / NULLIF(SUM(CASE WHEN ReadyDate IS NOT NULL AND PlanDate IS NOT NULL THEN 1 ELSE 0 END), 0)
            AS DECIMAL(10,2)
        ) AS InTimePercent,
        AVG(CASE 
            WHEN ReadyProductionMax > PlannedProductionDate
            THEN DATEDIFF(DAY, PlannedProductionDate, ReadyProductionMax)
        END) AS AvgDelayDays,
        MAX(CASE 
            WHEN ReadyProductionMax > PlannedProductionDate
            THEN DATEDIFF(DAY, PlannedProductionDate, ReadyProductionMax)
        END) AS MaxDelayDays
    FROM #OrdersFinal
    GROUP BY ISNULL(ABC, 'No ABC')
    ORDER BY CASE ISNULL(ABC, 'No ABC')
        WHEN 'A' THEN 1
        WHEN 'B' THEN 2
        WHEN 'C' THEN 3
        ELSE 4
    END
    OPTION (RECOMPILE);

    SELECT
        ISNULL(PS.Наименование, N'проф. система не знайдена') AS ProfileSystem,
        SUM(ISNULL(OFN.ConstructionsCount, 0)) AS TotalConstructions,
        COUNT(*) AS OrdersCount,
        SUM(ISNULL(OFN.OrderSum, 0)) AS TotalSum,
        CAST(
            SUM(ISNULL(OFN.OrderSum, 0))
            / NULLIF(SUM(ISNULL(OFN.ConstructionsCount, 0)), 0)
            AS DECIMAL(18,2)
        ) AS AvgCheck
    FROM #OrdersFinal AS OFN
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.БВ_ПрофильныеСистемы] AS PS WITH (NOLOCK)
        ON PS.Ссылка = OFN.БВ_ПрофильнаяСистема
    GROUP BY PS.Наименование
    ORDER BY TotalConstructions DESC
    OPTION (RECOMPILE);

    SELECT
        PeriodLabel,
        PeriodSort,
        CAST(MIN(OrderSum) AS DECIMAL(18,2)) AS MinCheck,
        CAST(MAX(OrderSum) AS DECIMAL(18,2)) AS MaxCheck,
        CAST(AVG(OrderSum) AS DECIMAL(18,2)) AS AvgCheck,
        COUNT(*) AS OrdersCount,
        SUM(ISNULL(ConstructionsCount, 0)) AS TotalConstructions,
        CAST(SUM(ISNULL(OrderSum, 0)) AS DECIMAL(18,2)) AS TotalSum
    FROM #OrdersFinal
    GROUP BY PeriodLabel, PeriodSort
    ORDER BY PeriodSort
    OPTION (RECOMPILE);

    SELECT
        PeriodLabel,
        PeriodSort,
        SUM(ISNULL(ConstructionsCount, 0)) AS TotalConstructions,
        CAST(SUM(ISNULL(OrderSum, 0)) AS DECIMAL(18,2)) AS TotalTurnover
    FROM #OrdersFinal
    GROUP BY PeriodLabel, PeriodSort
    ORDER BY PeriodSort
    OPTION (RECOMPILE);

    SELECT
        ISNULL(F.Наименование, N'Фурнітура не знайдена') AS Furniture,
        COUNT(*) AS OrdersCount,
        SUM(ISNULL(OFN.ConstructionsCount, 0)) AS TotalConstructions,
        CAST(SUM(ISNULL(OFN.OrderSum, 0)) AS DECIMAL(18,2)) AS TotalSum
    FROM #OrdersFinal AS OFN
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.БВ_ФурнитурныеНаборы] AS F WITH (NOLOCK)
        ON F.Ссылка = OFN.БВ_ФурнитурныйНабор
    GROUP BY F.Наименование
    ORDER BY TotalConstructions DESC
    OPTION (RECOMPILE);

    SELECT
        ISNULL(C.Наименование, N'Колір не знайдено') AS ProfileColor,
        COUNT(*) AS OrdersCount,
        SUM(ISNULL(OFN.ConstructionsCount, 0)) AS TotalConstructions,
        CAST(SUM(ISNULL(OFN.OrderSum, 0)) AS DECIMAL(18,2)) AS TotalSum
    FROM #OrdersFinal AS OFN
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.БВ_ЦветоваяГамма] AS C WITH (NOLOCK)
        ON C.Ссылка = OFN.БВ_ЦветПрофиля
    GROUP BY C.Наименование
    ORDER BY TotalConstructions DESC
    OPTION (RECOMPILE);

    SELECT
        ISNULL(ABC, 'No ABC') AS ABC,
        COUNT(*) AS OrdersCount,
        SUM(ISNULL(ConstructionsCount, 0)) AS TotalConstructions,
        CAST(SUM(ISNULL(OrderSum, 0)) AS DECIMAL(18,2)) AS TotalSum,
        CAST(
            100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER(), 0)
            AS DECIMAL(10,2)
        ) AS PercentByOrders
    FROM #OrdersFinal
    GROUP BY ISNULL(ABC, 'No ABC')
    ORDER BY CASE ISNULL(ABC, 'No ABC')
        WHEN 'A' THEN 1
        WHEN 'B' THEN 2
        WHEN 'C' THEN 3
        ELSE 4
    END
    OPTION (RECOMPILE);

    SELECT
        ProductionModel,
        ProductionSection,
        ConstructionTypeName_UA,
        ItemName_UA,
        SUM(ISNULL(Количество, 0)) AS TotalQuantity,
        COUNT(DISTINCT OrderID) AS UniqueOrdersCount,
        STRING_AGG(CAST(OrderNumber AS NVARCHAR(MAX)), ', ') WITHIN GROUP (ORDER BY OrderNumber) AS OrderNumbers,
        Складність_UA
    FROM #OrderItems
    GROUP BY
        ProductionModel,
        ProductionSection,
        ConstructionTypeName_UA,
        ItemName_UA,
        Складність_UA
    ORDER BY
        ProductionModel,
        ConstructionTypeName_UA DESC
    OPTION (RECOMPILE);

    SELECT
        ISNULL(OFN.ABC, 'No ABC') AS ABC,
        OFN.OrderStage,
        OFN.OrderStatusName,
        OFN.OrderNumber,
        OFN.ClientOrderNumber,
        OFN.OrderDate,
        OFN.CalcPeriod,
        OFN.PlannedProductionDate,
        OFN.ProductionStartDateMin,
        OFN.ProductionStartDateMax,
        OFN.ReadyProductionMin,
        OFN.ReadyProductionMax,
        OFN.SaleDate,
        DATEDIFF(DAY, OFN.PlannedProductionDate, OFN.ReadyProductionMax) AS DelayDays,
        CASE
            WHEN OFN.PlannedProductionDate IS NULL THEN N'Немає планової дати'
            WHEN OFN.ReadyProductionMax IS NULL THEN N'Не виготовлено'
            WHEN OFN.ReadyDate < OFN.PlanDate THEN N'Раніше плану'
            WHEN OFN.ReadyDate = OFN.PlanDate THEN N'Вчасно'
            ELSE N'Запізнення'
        END AS ProductionStatus,
        CASE
            WHEN OFN.ReadyProductionMax > OFN.PlannedProductionDate
            THEN DATEDIFF(DAY, OFN.PlannedProductionDate, OFN.ReadyProductionMax)
            ELSE 0
        END AS LateDays,
        OFN.OrderSum,
        OFN.ConstructionsCount,
        ISNULL(OFN.ProducedTotal, 0) AS ProducedTotal,
        OFN.SoldQuantity,
        PS.Наименование AS ProfileSystem,
        F.Наименование AS Furniture,
        C.Наименование AS ProfileColor,
        OFN.Расшифровка,
        OFN.OrderID
    FROM #OrdersFinal AS OFN
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.БВ_ПрофильныеСистемы] AS PS WITH (NOLOCK)
        ON PS.Ссылка = OFN.БВ_ПрофильнаяСистема
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.БВ_ФурнитурныеНаборы] AS F WITH (NOLOCK)
        ON F.Ссылка = OFN.БВ_ФурнитурныйНабор
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.БВ_ЦветоваяГамма] AS C WITH (NOLOCK)
        ON C.Ссылка = OFN.БВ_ЦветПрофиля
    ORDER BY
        CASE ISNULL(OFN.ABC, 'No ABC')
            WHEN 'A' THEN 1
            WHEN 'B' THEN 2
            WHEN 'C' THEN 3
            ELSE 4
        END,
        LateDays DESC,
        OFN.OrderDate DESC
    OPTION (RECOMPILE);

    DROP TABLE IF EXISTS #BaseOrderSource;
    DROP TABLE IF EXISTS #BaseOrderLinks;
    DROP TABLE IF EXISTS #BaseOrders;
    DROP TABLE IF EXISTS #ABC;
    DROP TABLE IF EXISTS #ProdOrders;
    DROP TABLE IF EXISTS #ProdReports;
    DROP TABLE IF EXISTS #Sales;
    DROP TABLE IF EXISTS #OrdersFinal;
    DROP TABLE IF EXISTS #OrderItems;
END
