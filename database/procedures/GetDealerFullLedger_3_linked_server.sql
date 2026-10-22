ALTER PROCEDURE [dbo].[GetDealerFullLedger_3]
(
    @Контрагент BINARY(16),
    @ДатаЗ      DATE,
    @ДатаПо     DATE
)
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    DECLARE @ZeroGuid BINARY(16) = 0x00000000000000000000000000000000;
    DECLARE @MainOrganization BINARY(16) = 0xA88A001B214EEE7A11E15373F04D8182;
    DECLARE @MinDate DATE = '2023-01-01';
    DECLARE @DateToExclusive DATE = DATEADD(DAY, 1, @ДатаПо);
    DECLARE @FromDate DATE = IIF(@ДатаЗ < @MinDate, @MinDate, @ДатаЗ);
    DECLARE @RawMinDate DATETIME = DATEADD(YEAR, 2000, CAST(@MinDate AS DATETIME));
    DECLARE @RawDateToExclusive DATETIME = DATEADD(YEAR, 2000, CAST(DATEADD(DAY, 1, @ДатаПо) AS DATETIME));
    IF OBJECT_ID('tempdb..#RegisterSlice') IS NOT NULL DROP TABLE #RegisterSlice;
    IF OBJECT_ID('tempdb..#AllMovements') IS NOT NULL DROP TABLE #AllMovements;

    SELECT
        DATEADD(YEAR, -2000, R._Period) AS [Date],
        R._RecorderRRef AS [Регистратор],
        R._LineNo AS [НомерСтроки],
        R._RecordKind AS [ВидДвижения],
        R._Fld23253RRef AS [ДоговорКонтрагента],
        R._Fld23256RRef AS [Контрагент],
        R._Fld23255RRef AS [Организация],
        R._Fld23258 AS [СуммаУпр],
        CASE
            WHEN R._RecordKind = 1 THEN R._Fld23257
            WHEN R._RecordKind = 0 THEN -R._Fld23257
            ELSE 0
        END AS DeltaRow
    INTO #RegisterSlice
    FROM [WST\WST].[oknastyle].[dbo].[_AccumRg23252] AS R
         
    WHERE R._Period >= @RawMinDate
      AND R._Period < @RawDateToExclusive
      AND R._Active = 0x01
      AND R._Fld23255RRef = @MainOrganization
      AND R._Fld23256RRef = @Контрагент
    OPTION (RECOMPILE);

    CREATE CLUSTERED INDEX IX_RegisterSlice_DogovorDate
        ON #RegisterSlice([ДоговорКонтрагента], [Date], [Регистратор], [НомерСтроки]);
    CREATE NONCLUSTERED INDEX IX_RegisterSlice_RegistrarLine
        ON #RegisterSlice([Регистратор], [НомерСтроки]);

    SELECT
        RS.[Date],
        RS.[Регистратор],
        RS.[НомерСтроки],
        RS.[ВидДвижения],
        RS.[ДоговорКонтрагента],
        RS.[Контрагент],
        RS.[Организация],
        RS.[СуммаУпр],
        RS.DeltaRow,
        RS.CumSaldo
    INTO #AllMovements
    FROM
    (
        SELECT
            R.[Date],
            R.[Регистратор],
            R.[НомерСтроки],
            R.[ВидДвижения],
            R.[ДоговорКонтрагента],
            R.[Контрагент],
            R.[Организация],
            R.[СуммаУпр],
            R.DeltaRow,
            SUM(R.DeltaRow) OVER (
                PARTITION BY R.[ДоговорКонтрагента]
                ORDER BY R.[Date], R.[Регистратор], R.[НомерСтроки]
                ROWS UNBOUNDED PRECEDING
            ) AS CumSaldo
        FROM #RegisterSlice AS R
    ) AS RS
    WHERE RS.[Date] >= @FromDate;

    CREATE CLUSTERED INDEX IX_AllMovements_RegistrarLine
        ON #AllMovements([Регистратор], [НомерСтроки]);
    CREATE NONCLUSTERED INDEX IX_AllMovements_DogovorDate
        ON #AllMovements([ДоговорКонтрагента], [Date], [Регистратор], [НомерСтроки])
        INCLUDE ([DeltaRow], [CumSaldo], [ВидДвижения], [Контрагент]);

    IF OBJECT_ID('tempdb..#Registrars') IS NOT NULL DROP TABLE #Registrars;

    SELECT DISTINCT
        M.[Регистратор]
    INTO #Registrars
    FROM #AllMovements AS M;

    CREATE UNIQUE CLUSTERED INDEX IX_Registrars_Registrar
        ON #Registrars([Регистратор]);

    IF OBJECT_ID('tempdb..#Docs') IS NOT NULL DROP TABLE #Docs;

    CREATE TABLE #Docs
    (
        Регистратор BINARY(16) NOT NULL,
        ВидДокумента NVARCHAR(100) NULL,
        PaymentChannel NVARCHAR(50) NULL,
        InOut NVARCHAR(50) NULL,
        SplitType NVARCHAR(100) NULL,
        Номер NVARCHAR(100) NULL,
        Дата DATETIME NULL,
        Инфо NVARCHAR(MAX) NULL,
        Dogovor BINARY(16) NULL,
        SumDoc NUMERIC(15, 2) NULL,
        SignSumDoc NUMERIC(15, 2) NULL,
        Сделка BINARY(16) NULL,
        RowNumDoc INT NULL,
        DescriptionCor NVARCHAR(255) NULL,
        Currency BINARY(16) NULL
    );

    INSERT INTO #Docs
    SELECT
        T1.Ссылка,
        N'ПКО',
        N'КАСА',
        N'Прихід',
        CASE
            WHEN T2.Сделка <> @ZeroGuid THEN N'На сделку'
            ELSE N'Готівка'
        END,
        T1.Номер,
        T1.Дата,
        T1.Комментарий,
        T2.ДоговорКонтрагента,
        T2.СуммаПлатежа,
        T2.СуммаПлатежа,
        CASE
            WHEN T2.Сделка = @ZeroGuid THEN NULL
            ELSE T2.Сделка
        END,
        ROW_NUMBER() OVER (
            PARTITION BY T1.Ссылка
            ORDER BY T2.ДоговорКонтрагента, T2.Сделка, T2.СуммаПлатежа
        ),
        NULL,
        T1.ВалютаДокумента
    FROM #Registrars AS R
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ПриходныйКассовыйОрдер] AS T1
        ON T1.Ссылка = R.Регистратор
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ПриходныйКассовыйОрдер.РасшифровкаПлатежа] AS T2
        ON T2.Ссылка = T1.Ссылка
    WHERE T1.Дата >= @MinDate
      AND T1.Дата < @DateToExclusive
      AND T1.Контрагент = @Контрагент;

    INSERT INTO #Docs
    SELECT
        T3.Ссылка,
        N'ППВход',
        N'БАНК',
        N'Прихід',
        CASE
            WHEN T4.Сделка <> @ZeroGuid THEN N'На сделку'
            ELSE N'Без сделки'
        END,
        T3.Номер,
        T3.Дата,
        T3.НазначениеПлатежа,
        T4.ДоговорКонтрагента,
        T4.СуммаПлатежа,
        T4.СуммаПлатежа,
        CASE
            WHEN T4.Сделка = @ZeroGuid THEN NULL
            ELSE T4.Сделка
        END,
        T4.НомерСтроки,
        NULL,
        T3.ВалютаДокумента
    FROM #Registrars AS R
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ПлатежноеПоручениеВходящее] AS T3
        ON T3.Ссылка = R.Регистратор
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ПлатежноеПоручениеВходящее.РасшифровкаПлатежа] AS T4
        ON T4.Ссылка = T3.Ссылка
    WHERE T3.Дата >= @MinDate
      AND T3.Дата < @DateToExclusive
      AND T3.Контрагент = @Контрагент;

    INSERT INTO #Docs
    SELECT
        Head.Ссылка,
        N'ППИсход',
        N'БАНК',
        N'Витрата',
        CASE
            WHEN RowPay.ДокументРасчетовСКонтрагентом <> @ZeroGuid THEN N'Оплата по заказу'
            ELSE N'Оплата поза заказом'
        END,
        Head.Номер,
        Head.Дата,
        Head.НазначениеПлатежа,
        RowPay.ДоговорКонтрагента,
        ISNULL(RowPay.СуммаВзаиморасчетов, Head.СуммаДокумента),
        -1 * ISNULL(RowPay.СуммаВзаиморасчетов, Head.СуммаДокумента),
        CASE
            WHEN RowPay.ДокументРасчетовСКонтрагентом = @ZeroGuid THEN NULL
            ELSE RowPay.ДокументРасчетовСКонтрагентом
        END,
        ROW_NUMBER() OVER (
            PARTITION BY Head.Ссылка
            ORDER BY RowPay.ДоговорКонтрагента, RowPay.ДокументРасчетовСКонтрагентом, RowPay.СуммаВзаиморасчетов
        ),
        NULL,
        Head.ВалютаДокумента
    FROM #Registrars AS R
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ПлатежноеПоручениеИсходящее] AS Head
        ON Head.Ссылка = R.Регистратор
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ПлатежноеПоручениеИсходящее.РасшифровкаПлатежа] AS RowPay
        ON RowPay.Ссылка = Head.Ссылка
    WHERE Head.Дата >= @MinDate
      AND Head.Дата < @DateToExclusive
      AND Head.Контрагент = @Контрагент;

    INSERT INTO #Docs
    SELECT
        Head.Ссылка,
        N'РКО',
        N'КАСА',
        N'Витрата',
        CASE
            WHEN RowCash.Сделка <> @ZeroGuid THEN N'На сделку'
            ELSE N'Прихід коштів'
        END,
        Head.Номер,
        Head.Дата,
        Head.Основание,
        RowCash.ДоговорКонтрагента,
        RowCash.СуммаПлатежа,
        -RowCash.СуммаПлатежа,
        CASE
            WHEN RowCash.Сделка = @ZeroGuid THEN NULL
            ELSE RowCash.Сделка
        END,
        ROW_NUMBER() OVER (
            PARTITION BY Head.Ссылка
            ORDER BY RowCash.ДоговорКонтрагента, RowCash.Сделка, RowCash.СуммаПлатежа
        ),
        NULL,
        Head.ВалютаДокумента
    FROM #Registrars AS R
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.РасходныйКассовыйОрдер] AS Head
        ON Head.Ссылка = R.Регистратор
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.РасходныйКассовыйОрдер.РасшифровкаПлатежа] AS RowCash
        ON RowCash.Ссылка = Head.Ссылка
    WHERE Head.Дата >= @MinDate
      AND Head.Дата < @DateToExclusive
      AND Head.Контрагент = @Контрагент;

    INSERT INTO #Docs
    SELECT
        Doc.Ссылка,
        N'КорректировкаДолга',
        N'ІНШЕ',
        NULL,
        N'Корректировка',
        Doc.Номер,
        Doc.Дата,
        CONCAT(N'Корректировка долга | ', Doc.Комментарий),
        NULL,
        NULL,
        NULL,
        CASE
            WHEN C.ЗаказПокупателя = @ZeroGuid THEN NULL
            ELSE C.ЗаказПокупателя
        END,
        M.НомерСтроки,
        SZ.Наименование,
        Doc.ВалютаДокумента
    FROM #AllMovements AS M
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.КорректировкаДолга] AS Doc
        ON Doc.Ссылка = M.Регистратор
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.СтатьиЗатрат] AS SZ
        ON SZ.Ссылка = Doc.БВ_СтатьяЗатрат
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.БВ_Претензия] AS C
        ON C.Ссылка = Doc.Сделка
    WHERE Doc.Дата >= @MinDate
      AND Doc.Дата < @DateToExclusive;

    INSERT INTO #Docs
    SELECT
        Doc.Ссылка,
        N'КорректировкаЗаписейРегистров',
        N'ІНШЕ',
        N'Інше',
        N'Корректировка',
        Doc.Номер,
        Doc.Дата,
        Doc.Комментарий,
        M.ДоговорКонтрагента,
        M.DeltaRow,
        M.DeltaRow,
        NULL,
        M.НомерСтроки,
        NULL,
        NULL
    FROM #Registrars AS R
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.КорректировкаЗаписейРегистров] AS Doc
        ON Doc.Ссылка = R.Регистратор
    INNER JOIN #AllMovements AS M
        ON M.Регистратор = Doc.Ссылка
    WHERE Doc.Дата >= @MinDate
      AND Doc.Дата < @DateToExclusive;

    INSERT INTO #Docs
    SELECT
        P.Ссылка,
        N'Поступление',
        N'ПОСТ',
        IIF(DR.СуммаВзаиморасчетов > 0, N'Прихід', N'Витрата'),
        N'Поступление',
        P.Номер,
        P.Дата,
        P.Комментарий,
        P.ДоговорКонтрагента,
        P.СуммаДокумента,
        P.СуммаДокумента,
        CASE
            WHEN DR.Сделка = @ZeroGuid THEN NULL
            ELSE DR.Сделка
        END,
        ROW_NUMBER() OVER (
            PARTITION BY P.Ссылка
            ORDER BY DR.Сделка, P.СуммаДокумента
        ),
        NULL,
        P.ВалютаДокумента
    FROM #Registrars AS R
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ПоступлениеТоваровУслуг] AS P
        ON P.Ссылка = R.Регистратор
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ПоступлениеТоваровУслуг.ДокументыРасчетовСКонтрагентом] AS DR
        ON DR.Ссылка = P.Ссылка
    WHERE P.Дата >= @MinDate
      AND P.Дата < @DateToExclusive
      AND P.Контрагент = @Контрагент;

    INSERT INTO #Docs
    SELECT
        T.Ссылка,
        N'ВозвратОтПокупателя',
        N'ПОВЕРНЕННЯ',
        N'Прихід',
        N'Повернення',
        T.Номер,
        T.Дата,
        T.Комментарий,
        T.ДоговорКонтрагента,
        T.СуммаДокумента,
        T.СуммаДокумента,
        CASE
            WHEN T.Сделка = @ZeroGuid THEN NULL
            ELSE T.Сделка
        END,
        ROW_NUMBER() OVER (
            PARTITION BY T.Ссылка
            ORDER BY T.Сделка, T.СуммаДокумента
        ),
        NULL,
        T.ВалютаДокумента
    FROM #Registrars AS R
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ВозвратТоваровОтПокупателя] AS T
        ON T.Ссылка = R.Регистратор
    WHERE T.Дата >= @MinDate
      AND T.Дата < @DateToExclusive
      AND T.Контрагент = @Контрагент;

    /*
        These document types stay hidden in the final output, but their
        movements must remain in #AllMovements so the running saldo for the
        main contract is correct.
    */
    INSERT INTO #Docs
    SELECT
        T.Ссылка,
        N'Реалізація',
        N'РЕАЛ',
        N'Витрата',
        N'Реалізація',
        T.Номер,
        T.Дата,
        T.Комментарий,
        T.ДоговорКонтрагента,
        T.СуммаДокумента,
        -T.СуммаДокумента,
        CASE
            WHEN DR.Сделка = @ZeroGuid THEN NULL
            ELSE DR.Сделка
        END,
        ROW_NUMBER() OVER (
            PARTITION BY T.Ссылка
            ORDER BY T.Ссылка
        ),
        NULL,
        T.ВалютаДокумента
    FROM #Registrars AS R
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.РеализацияТоваровУслуг] AS T
        ON T.Ссылка = R.Регистратор
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.РеализацияТоваровУслуг.ДокументыРасчетовСКонтрагентом] AS DR
        ON DR.Ссылка = T.Ссылка
    WHERE T.Дата >= @MinDate
      AND T.Дата < @DateToExclusive
      AND T.Контрагент = @Контрагент;

    INSERT INTO #Docs
    SELECT
        T.Ссылка,
        N'Удержания',
        N'УТРИМАННЯ',
        N'Витрата',
        N'Утримання',
        T.Номер,
        T.Дата,
        T.Комментарий,
        T.Контрагент,
        -T.СуммаДокумента,
        -T.СуммаДокумента,
        CASE
            WHEN T.ЗаказПокупателя = @ZeroGuid THEN NULL
            ELSE T.ЗаказПокупателя
        END,
        ROW_NUMBER() OVER (
            PARTITION BY T.Ссылка
            ORDER BY T.Ссылка
        ),
        NULL,
        NULL
    FROM #Registrars AS R
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.GM_УдержанияИзСотрудниковОрганизации] AS T
        ON T.Ссылка = R.Регистратор
    WHERE T.Дата >= @MinDate
      AND T.Дата < @DateToExclusive;

    CREATE NONCLUSTERED INDEX IX_Docs_RegistrarRow
        ON #Docs(Регистратор, RowNumDoc)
        INCLUDE (ВидДокумента, PaymentChannel, InOut, SplitType, Номер, Дата, Dogovor, SumDoc, SignSumDoc, Сделка, DescriptionCor, Currency);
    CREATE NONCLUSTERED INDEX IX_Docs_Deal
        ON #Docs(Сделка)
        INCLUDE (Регистратор, ВидДокумента, Дата, RowNumDoc, SumDoc);

    IF OBJECT_ID('tempdb..#DealLinks') IS NOT NULL DROP TABLE #DealLinks;

    SELECT DISTINCT
        D.Сделка
    INTO #DealLinks
    FROM #Docs AS D
    WHERE D.Сделка IS NOT NULL
      AND D.Сделка <> @ZeroGuid;

    CREATE UNIQUE CLUSTERED INDEX IX_DealLinks_Deal
        ON #DealLinks(Сделка);

    IF OBJECT_ID('tempdb..#DealInfo') IS NOT NULL DROP TABLE #DealInfo;

    SELECT
        ZP.Ссылка AS Сделка,
        ZP.Номер AS OrderNumber,
        ZP.Дата AS OrderDate,
        ZP.СуммаДокумента AS OrderAmount
    INTO #DealInfo
    FROM #DealLinks AS DL
    INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] AS ZP
        ON ZP.Ссылка = DL.Сделка;

    CREATE UNIQUE CLUSTERED INDEX IX_DealInfo_Deal
        ON #DealInfo(Сделка);

    IF OBJECT_ID('tempdb..#DogovorLinks') IS NOT NULL DROP TABLE #DogovorLinks;

    SELECT DISTINCT
        X.Dogovor
    INTO #DogovorLinks
    FROM
    (
        SELECT M.ДоговорКонтрагента AS Dogovor
        FROM #AllMovements AS M
        WHERE M.ДоговорКонтрагента IS NOT NULL
          AND M.ДоговорКонтрагента <> @ZeroGuid

        UNION

        SELECT D.Dogovor
        FROM #Docs AS D
        WHERE D.Dogovor IS NOT NULL
          AND D.Dogovor <> @ZeroGuid
    ) AS X;

    CREATE UNIQUE CLUSTERED INDEX IX_DogovorLinks_Dogovor
        ON #DogovorLinks(Dogovor);

    IF OBJECT_ID('tempdb..#DogovorInfo') IS NOT NULL DROP TABLE #DogovorInfo;

    SELECT
        DL.Dogovor,
        DC.Наименование AS DogovorName
    INTO #DogovorInfo
    FROM #DogovorLinks AS DL
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.ДоговорыКонтрагентов] AS DC
        ON DC.Ссылка = DL.Dogovor;

    CREATE UNIQUE CLUSTERED INDEX IX_DogovorInfo_Dogovor
        ON #DogovorInfo(Dogovor);

    IF OBJECT_ID('tempdb..#CumulativePayments') IS NOT NULL DROP TABLE #CumulativePayments;

    SELECT
        D.Сделка,
        D.Регистратор,
        D.RowNumDoc,
        D.SumDoc AS SumPay,
        SUM(D.SumDoc) OVER (
            PARTITION BY D.Сделка
            ORDER BY D.Дата, D.Регистратор, D.RowNumDoc
            ROWS UNBOUNDED PRECEDING
        ) AS PaidIncl,
        ISNULL(
            SUM(D.SumDoc) OVER (
                PARTITION BY D.Сделка
                ORDER BY D.Дата, D.Регистратор, D.RowNumDoc
                ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
            ),
            0
        ) AS PaidBefore
    INTO #CumulativePayments
    FROM #Docs AS D
    WHERE D.Сделка IS NOT NULL
      AND D.ВидДокумента IN (N'ППВход', N'ПКО');

    CREATE CLUSTERED INDEX IX_CumulativePayments_RegistrarDeal
        ON #CumulativePayments(Регистратор, Сделка, RowNumDoc);

    SELECT
        M.[Date],
        M.Регистратор AS RegistrarId,
        M.НомерСтроки AS LineNumber,
        D.ВидДокумента AS DocumentType,
        CASE
            WHEN D.ВидДокумента = N'КорректировкаДолга' THEN
                CASE
                    WHEN M.ВидДвижения = 1 THEN N'Прихід'
                    ELSE N'Розхід'
                END
            ELSE D.InOut
        END AS FlowDirection,
        D.PaymentChannel,
        D.SplitType,
        D.Номер AS DocumentNumber,
        D.Дата AS DocumentDate,
        D.Инфо AS Description,
        D.DescriptionCor AS CorrectionDescription,
        ISNULL(D.Dogovor, M.ДоговорКонтрагента) AS FinalDogovor,
        COALESCE(DND.DogovorName, DNM.DogovorName) AS FinalDogovorName,
        M.DeltaRow,
        (M.CumSaldo - M.DeltaRow) AS CumSaldoStart,
        M.CumSaldo,
        D.Сделка AS Deal,
        OI.OrderDate AS DealData,
        OI.OrderNumber AS DealNumber,
        CASE
            WHEN D.ВидДокумента = N'ПКО' THEN
                CASE WHEN OI.Сделка IS NOT NULL THEN N'Оплата по заказу' ELSE N'Прихід коштів' END
            WHEN D.ВидДокумента = N'ППВход' THEN
                CASE WHEN OI.Сделка IS NOT NULL THEN N'Оплата по заказу' ELSE N'Прихід коштів' END
            WHEN D.ВидДокумента = N'ППИсход' THEN
                CASE WHEN OI.Сделка IS NOT NULL THEN N'Оплата замовлення' ELSE N'Списання з авансового договору' END
            WHEN D.ВидДокумента = N'РКО' THEN
                CASE WHEN OI.Сделка IS NOT NULL THEN N'Оплата замовлення' ELSE N'Готівка витрата' END
            WHEN D.ВидДокумента = N'КорректировкаДолга' THEN N'Коригування'
            WHEN D.ВидДокумента = N'КорректировкаЗаписейРегистров' THEN N'Коригування регістрів'
            WHEN D.ВидДокумента = N'Поступление' THEN
                CASE WHEN OI.Сделка IS NOT NULL THEN N'Надходження за замовленням' ELSE N'Надходження без замовлення' END
            WHEN D.ВидДокумента = N'ВозвратОтПокупателя' THEN
                CASE WHEN OI.Сделка IS NOT NULL THEN N'Повернення по замовленню' ELSE N'Повернення без замовлення' END
            ELSE NULL
        END AS DealType,
        M.ВидДвижения AS TypeOfMovement,
        M.ДоговорКонтрагента AS DogovorCustomer,
        M.Контрагент AS Customer,
        CASE
            WHEN D.ВидДокумента = N'КорректировкаДолга' THEN M.DeltaRow
            ELSE D.SumDoc
        END AS SumDocFinal,
        SUM(M.DeltaRow) OVER (
            PARTITION BY D.Сделка
            ORDER BY M.[Date], M.Регистратор, M.НомерСтроки
            ROWS UNBOUNDED PRECEDING
        ) AS CumSaldoOrder,
        OI.OrderNumber AS OrderNumber,
        OI.OrderDate AS OrderDate,
        OI.OrderAmount AS OrderAmount,
        CASE
            WHEN OI.Сделка IS NULL THEN N'Немає'
            WHEN OI.OrderAmount <= 0 THEN N'Невідомо'
            ELSE N'Замовлення знайдене'
        END AS OrderStatus,
        ISNULL(CP.PaidBefore, 0) AS PaidBefore,
        ISNULL(CP.PaidIncl, 0) AS PaidIncluding,
        CASE
            WHEN OI.OrderAmount IS NULL THEN NULL
            ELSE OI.OrderAmount - ISNULL(CP.PaidIncl, 0)
        END AS OrderBalance,
        CP.SumPay AS PaymentApplied,
        CASE
            WHEN OI.OrderAmount = 0 OR OI.OrderAmount IS NULL THEN 0
            ELSE ROUND(ISNULL(CP.PaidIncl, 0) * 100.0 / OI.OrderAmount, 2)
        END AS PaymentStatus,
        D.Currency,
        V_Base.Наименование AS Currency_2
    FROM #AllMovements AS M
    LEFT JOIN #Docs AS D
        ON D.Регистратор = M.Регистратор
       AND (D.RowNumDoc = M.НомерСтроки OR D.RowNumDoc IS NULL)
    LEFT JOIN #DogovorInfo AS DND
        ON DND.Dogovor = D.Dogovor
    LEFT JOIN #DogovorInfo AS DNM
        ON DNM.Dogovor = M.ДоговорКонтрагента
    LEFT JOIN #DealInfo AS OI
        ON OI.Сделка = D.Сделка
    LEFT JOIN #CumulativePayments AS CP
        ON CP.Регистратор = M.Регистратор
       AND CP.Сделка = D.Сделка
       AND CP.RowNumDoc = D.RowNumDoc
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Валюты] AS V
        ON V.Ссылка = D.Currency
    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].[Справочники.Валюты] AS V_Base
        ON V.ОсновнаяВалюта = V_Base.Ссылка
    WHERE M.[Date] >= @FromDate
      AND COALESCE(DND.DogovorName, DNM.DogovorName, N'') NOT LIKE N'%резерв%'
      AND ISNULL(D.ВидДокумента, N'') <> N'Удержания'
      AND ISNULL(D.ВидДокумента, N'') NOT IN (N'РеализацияТоваровУслуг', N'Реалізація')
      AND M.DeltaRow <> 0
    ORDER BY
        M.[Date] ASC,
        M.НомерСтроки ASC
    OPTION (RECOMPILE);

    DROP TABLE IF EXISTS #CumulativePayments;
    DROP TABLE IF EXISTS #DogovorInfo;
    DROP TABLE IF EXISTS #DogovorLinks;
    DROP TABLE IF EXISTS #DealInfo;
    DROP TABLE IF EXISTS #DealLinks;
    DROP TABLE IF EXISTS #Docs;
    DROP TABLE IF EXISTS #Registrars;
    DROP TABLE IF EXISTS #AllMovements;
    DROP TABLE IF EXISTS #RegisterSlice;
END;
