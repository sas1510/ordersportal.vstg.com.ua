CREATE PROCEDURE [dbo].[GetCalculationsWithOrdersByYearAndContractor7]
    @DateFrom DATE = NULL,
    @DateTo DATE = NULL,
    @Contractor_ID BINARY(16) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    DECLARE @LocalDateFrom DATE = @DateFrom;
    DECLARE @LocalDateTo DATE = @DateTo;
    DECLARE @LocalContractor BINARY(16) = @Contractor_ID;

    DECLARE @OrderDocType BINARY(1) = 0x08;
    DECLARE @OrderDocRTRef BINARY(4) = 0x0000017D;

    DECLARE @ZeroGuid BINARY(16) =
        0x00000000000000000000000000000000;

    DECLARE @OrderLinkPropertyCode NVARCHAR(20) =
        N'00000000257';

    DECLARE @OrderLinkProperty BINARY(16) = NULL;


    DECLARE @StartDate DATE;
    DECLARE @EndDate DATE;
    DECLARE @PrevYearStart DATE;

    DECLARE @RawStartDate DATETIME;
    DECLARE @RawEndDate DATETIME;

    DECLARE @ShiftedStartDate DATETIME;
    DECLARE @ShiftedEndDate DATETIME;

    DECLARE @RawPrevYearStart DATETIME;
    DECLARE @ShiftedPrevYearStart DATETIME;


    IF @LocalDateFrom IS NULL
        SET @StartDate = '19000101';
    ELSE
        SET @StartDate = @LocalDateFrom;


    IF @LocalDateTo IS NULL
        SET @EndDate = '29991231';
    ELSE
        SET @EndDate = DATEADD(DAY, 1, @LocalDateTo);


    IF @StartDate > @EndDate
        THROW 50001,
              N'Дата початку періоду не може бути більшою за дату завершення.',
              1;


    IF @LocalDateFrom IS NULL
        SET @PrevYearStart = '19000101';
    ELSE
        SET @PrevYearStart = DATEADD(YEAR, -1, @StartDate);


    SET @RawStartDate = CAST(@StartDate AS DATETIME);
    SET @RawEndDate = CAST(@EndDate AS DATETIME);

    SET @ShiftedStartDate =
        DATEADD(YEAR, 2000, @RawStartDate);

    SET @ShiftedEndDate =
        DATEADD(YEAR, 2000, @RawEndDate);

    SET @RawPrevYearStart =
        CAST(@PrevYearStart AS DATETIME);

    SET @ShiftedPrevYearStart =
        DATEADD(YEAR, 2000, @RawPrevYearStart);



    SELECT TOP (1)
        @OrderLinkProperty = P.Ссылка
    FROM [WST\WST].[oknastyle_biV2].[dbo].
         [ПланыВидовХарактеристик.СвойстваОбъектов] AS P
    WHERE P.Код = @OrderLinkPropertyCode;



    DROP TABLE IF EXISTS #CalcRequests;
    DROP TABLE IF EXISTS #OrderCandidates;
    DROP TABLE IF EXISTS #OrderLinksByContractor;


    SELECT
        Z._IDRRef AS CalcID,
        Z._Number AS CalcNumber,

        CASE
            WHEN YEAR(Z._Date_Time) < 3753
                THEN Z._Date_Time
            ELSE DATEADD(YEAR, -2000, Z._Date_Time)
        END AS CalcDate,

        Z._Fld44858 AS НомерДилера,
        Z._Fld44859RRef AS CalcContractorID,
        Z._Fld44860 AS CalcComment,
        Z._Fld44861 AS CalcConstructionsCount,
        Z._Fld44862RRef AS CalcState,
        Z._Fld44966_RRRef AS Автор,
        Z._Fld44967 AS Получатель,
        Z._Fld44968 AS ТелефонПолучателя,
        Z._Fld44969 AS [Дополнительно]

    INTO #CalcRequests

    FROM
    (
        SELECT
            D._IDRRef,
            D._Number,
            D._Date_Time,
            D._Fld44858,
            D._Fld44859RRef,
            D._Fld44860,
            D._Fld44861,
            D._Fld44862RRef,
            D._Fld44966_RRRef,
            D._Fld44967,
            D._Fld44968,
            D._Fld44969

        FROM [WST\WST].[oknastyle].[dbo].[_Document44856] AS D
             

        WHERE D._Marked = 0x00
          AND D._Posted = 0x01
          AND D._Date_Time >= @RawStartDate
          AND D._Date_Time < @RawEndDate
          AND
          (
              @LocalContractor IS NULL
              OR D._Fld44859RRef = @LocalContractor
          )


        UNION ALL


        SELECT
            D._IDRRef,
            D._Number,
            D._Date_Time,
            D._Fld44858,
            D._Fld44859RRef,
            D._Fld44860,
            D._Fld44861,
            D._Fld44862RRef,
            D._Fld44966_RRRef,
            D._Fld44967,
            D._Fld44968,
            D._Fld44969

        FROM [WST\WST].[oknastyle].[dbo].[_Document44856] AS D
             

        WHERE D._Marked = 0x00
          AND D._Posted = 0x01
          AND D._Date_Time >= @ShiftedStartDate
          AND D._Date_Time < @ShiftedEndDate
          AND
          (
              @LocalContractor IS NULL
              OR D._Fld44859RRef = @LocalContractor
          )

    ) AS Z

    OPTION (RECOMPILE);


    IF @@ROWCOUNT = 0
    BEGIN
        SELECT TOP 0
            CAST(NULL AS NVARCHAR(36)) AS OrderID_GUID,
            CAST(NULL AS NVARCHAR(36)) AS CalcID_GUID,
            CAST(NULL AS NVARCHAR(36)) AS LinkedOrderID_GUID,
            CAST(NULL AS NVARCHAR(50)) AS LinkedOrderNumber;

        RETURN;
    END;


    CREATE CLUSTERED INDEX IX_CalcRequests_CalcID
        ON #CalcRequests(CalcID);



    /* ============================================================
       АДРЕСИ ЗАЯВКИ
       ============================================================ */

    DROP TABLE IF EXISTS #CalcAddresses;


    SELECT
        AD._Document44856_IDRRef AS CalcID,

        STRING_AGG(
            CONCAT(
                ISNULL(AD._Fld44972, N''),
                ISNULL(
                    N' (' +
                    NULLIF(AD._Fld44973, N'') +
                    N')',
                    N''
                ),
                ISNULL(
                    N' ' +
                    NULLIF(AD._Fld44974, N''),
                    N''
                )
            ),
            CHAR(10)
        )
        WITHIN GROUP
        (
            ORDER BY AD._LineNo44971
        ) AS DeliveryAddresses

    INTO #CalcAddresses

    FROM [WST\WST].[oknastyle].[dbo].
         [_Document44856_VT44970] AS AD
         

    INNER JOIN #CalcRequests AS CR
        ON CR.CalcID =
           AD._Document44856_IDRRef

    GROUP BY
        AD._Document44856_IDRRef;


    CREATE CLUSTERED INDEX IX_CalcAddresses_CalcID
        ON #CalcAddresses(CalcID);



    /* ============================================================
       ЗВ'ЯЗОК ЗАЯВКА -> ЗАМОВЛЕННЯ
       ============================================================ */

    DROP TABLE IF EXISTS #CalcOrders;


    SELECT
        X.CalcID,
        X.OrderID

    INTO #CalcOrders

    FROM
    (
        /* Старий зв'язок через табличну частину */

        SELECT
            L._Document44856_IDRRef AS CalcID,
            L._Fld44865RRef AS OrderID

        FROM [WST\WST].[oknastyle].[dbo].
             [_Document44856_VT44863] AS L
             

        INNER JOIN #CalcRequests AS CR
            ON CR.CalcID =
               L._Document44856_IDRRef

        WHERE L._Fld44865RRef IS NOT NULL


        UNION


        /* Новий зв'язок через ДокументОснование */

        SELECT
            CR.CalcID,
            ZP._IDRRef AS OrderID

        FROM #CalcRequests AS CR

        INNER JOIN [WST\WST].[oknastyle].[dbo].
             [_Document381] AS ZP

            ON ZP._Fld6205_RRRef = CR.CalcID
           AND ZP._Fld6205_TYPE = 0x08
           AND ZP._Fld6205_RTRef = 0x0000AF38

        WHERE ZP._Marked = 0x00
          AND ZP._IDRRef IS NOT NULL

    ) AS X

    WHERE X.OrderID IS NOT NULL

    OPTION (RECOMPILE);


    CREATE CLUSTERED INDEX IX_CalcOrders_OrderID
        ON #CalcOrders(OrderID);

    CREATE NONCLUSTERED INDEX IX_CalcOrders_CalcID
        ON #CalcOrders(CalcID);



    /* ============================================================
       ВІДБІР ЗАМОВЛЕНЬ
       ============================================================ */

    DROP TABLE IF EXISTS #CustomerOrders;
    DROP TABLE IF EXISTS #OrderCandidates;
    DROP TABLE IF EXISTS #OrderLinksByContractor;


    CREATE TABLE #OrderCandidates
    (
        OrderID BINARY(16) NOT NULL
    );


    IF @LocalContractor IS NOT NULL
    BEGIN

        CREATE TABLE #OrderLinksByContractor
        (
            OrderID BINARY(16) NOT NULL
        );


        INSERT INTO #OrderLinksByContractor(OrderID)

        SELECT
            D._IDRRef

        FROM [WST\WST].[oknastyle].[dbo].
             [_Document381] AS D
             

        WHERE D._Fld6187RRef = @LocalContractor

        OPTION (RECOMPILE);


        CREATE UNIQUE CLUSTERED INDEX
            IX_OrderLinksByContractor_OrderID
            ON #OrderLinksByContractor(OrderID);



        INSERT INTO #OrderCandidates(OrderID)

        SELECT DISTINCT
            D._IDRRef

        FROM #CalcOrders AS CO

        INNER JOIN [WST\WST].[oknastyle].[dbo].
             [_Document381] AS D
            ON D._IDRRef = CO.OrderID

        WHERE D._Marked = 0x00

          AND
          (
              D._Posted = 0x01
              OR D._Number LIKE N'34-%'
          )

          AND
          (
                 (
                     D._Date_Time >= @RawPrevYearStart
                     AND D._Date_Time < '3753-01-01'
                 )
              OR D._Date_Time >= @ShiftedPrevYearStart
          )

          AND
          (
                 D._Number LIKE N'15-%'
              OR D._Number LIKE N'01-%'
              OR D._Number LIKE N'02-%'
              OR D._Number LIKE N'04-%'
              OR D._Number LIKE N'22-%'
              OR D._Number LIKE N'34-%'
              OR D._Number LIKE N'45-%'
              OR D._Number LIKE N'55-%'
              OR D._Number LIKE N'56-%'
              OR D._Number LIKE N'65-%'
              OR D._Number LIKE N'90-%'
          )

        OPTION (RECOMPILE);

    END
    ELSE
    BEGIN

        INSERT INTO #OrderCandidates(OrderID)

        SELECT
            D._IDRRef AS OrderID

        FROM
        (
            SELECT
                Z._IDRRef,
                Z._Number

            FROM [WST\WST].[oknastyle].[dbo].
                 [_Document381] AS Z
                 

            WHERE Z._Marked = 0x00

              AND
              (
                  Z._Posted = 0x01
                  OR Z._Number LIKE N'34-%'
              )

              AND Z._Date_Time >= @RawPrevYearStart
              AND Z._Date_Time < '3753-01-01'


            UNION ALL


            SELECT
                Z._IDRRef,
                Z._Number

            FROM [WST\WST].[oknastyle].[dbo].
                 [_Document381] AS Z
                 

            WHERE Z._Marked = 0x00

              AND
              (
                  Z._Posted = 0x01
                  OR Z._Number LIKE N'34-%'
              )

              AND Z._Date_Time >= @ShiftedPrevYearStart

        ) AS D

        WHERE
        (
               D._Number LIKE N'15-%'
            OR D._Number LIKE N'01-%'
            OR D._Number LIKE N'02-%'
            OR D._Number LIKE N'04-%'
            OR D._Number LIKE N'22-%'
            OR D._Number LIKE N'34-%'
            OR D._Number LIKE N'45-%'
            OR D._Number LIKE N'55-%'
            OR D._Number LIKE N'56-%'
            OR D._Number LIKE N'65-%'
            OR D._Number LIKE N'90-%'
        )

        OPTION (RECOMPILE);

    END;


    CREATE UNIQUE CLUSTERED INDEX
        IX_OrderCandidates_OrderID
        ON #OrderCandidates(OrderID);



    SELECT
        ZP.Ссылка AS OrderID,
        ZP.Номер AS OrderNumber,
        ZP.Дата AS OrderDate,
        ZP.ДокументОснование AS BaseOrderID,
        ZP_Base.Номер AS BaseOrderNumber,
        ZP.ГМ_НомерЗаказаКлиента AS ClientOrderNumber,
        ZP.СуммаДокумента AS OrderSum,
        ZP.БВ_КоличествоКонструкций AS ConstructionsCount,
        ZP.БВ_СостояниеЗаказа AS OrderStateID,
        ZP.Контрагент AS ContractorID,
        ZP.Организация AS OrganizationID,
        ZP.ВалютаДокумента,
        ZP.ГМ_НомерЗаказаКлиента AS WebNumber,
        CO.CalcID,

        CAST(
            ZP.АдресДоставки AS NVARCHAR(MAX)
        ) AS OrderAddress,

        CASE
            WHEN YEAR(ZP.[БВ_ДатаЗадержки]) <= 2001
                THEN NULL
            ELSE ZP.[БВ_ДатаЗадержки]
        END AS DateDelays

    INTO #CustomerOrders

    FROM [oknastyle_biV2].[dbo].
         [Документы.ЗаказПокупателя] AS ZP

    INNER JOIN #OrderCandidates AS OC
        ON OC.OrderID = ZP.Ссылка

    INNER JOIN #CalcOrders AS CO
        ON CO.OrderID = ZP.Ссылка

    LEFT JOIN [oknastyle_biV2].[dbo].
         [Документы.ЗаказПокупателя] AS ZP_Base
        ON ZP_Base.Ссылка =
           ZP.ДокументОснование

    OPTION (RECOMPILE);



    CREATE CLUSTERED INDEX
        IX_CustomerOrders_OrderID
        ON #CustomerOrders(OrderID);


    CREATE NONCLUSTERED INDEX
        IX_CustomerOrders_CalcID
        ON #CustomerOrders(CalcID)
        INCLUDE
        (
            OrderID,
            OrderNumber,
            BaseOrderID,
            BaseOrderNumber,
            OrderStateID,
            ContractorID,
            OrganizationID,
            ВалютаДокумента
        );



    /* ============================================================
       ЗВ'ЯЗОК ЗАМОВЛЕНЬ 34-
       ============================================================ */

    DROP TABLE IF EXISTS #Order34Bindings;


    CREATE TABLE #Order34Bindings
    (
        OrderID BINARY(16) NOT NULL,
        LinkedOrderID BINARY(16) NULL,
        LinkedOrderNumber
            NVARCHAR(50)
            COLLATE DATABASE_DEFAULT NULL
    );


    CREATE UNIQUE CLUSTERED INDEX
        IX_Order34Bindings_OrderID
        ON #Order34Bindings(OrderID);



    INSERT INTO #Order34Bindings
    (
        OrderID,
        LinkedOrderID,
        LinkedOrderNumber
    )

    SELECT
        CO.OrderID,
        CO.BaseOrderID,
        CO.BaseOrderNumber
            COLLATE DATABASE_DEFAULT

    FROM #CustomerOrders AS CO

    WHERE CO.OrderNumber LIKE N'34-%'
      AND CO.BaseOrderID IS NOT NULL
      AND CO.BaseOrderID <> @ZeroGuid
      AND NULLIF(
            CO.BaseOrderNumber,
            N''
          ) IS NOT NULL;



    IF @OrderLinkProperty IS NOT NULL
    BEGIN

        ;WITH BindingRows AS
        (
            SELECT
                CO.OrderID,
                REG.Период,
                REG.Значение AS LinkedValueRef,
                REG.Значение_S AS LinkedValueText,

                ROW_NUMBER() OVER
                (
                    PARTITION BY CO.OrderID
                    ORDER BY REG.Период DESC
                ) AS rn

            FROM #CustomerOrders AS CO

            INNER JOIN [WST\WST].[oknastyle_biV2].[dbo].
                 [РегистрыСведений.ДополнительныеСвойстваОбъектов]
                 AS REG

                ON REG.Объект = CO.OrderID
               AND REG.Свойство = @OrderLinkProperty

            WHERE CO.OrderNumber LIKE N'34-%'

              AND NOT EXISTS
              (
                  SELECT 1
                  FROM #Order34Bindings AS B
                  WHERE B.OrderID = CO.OrderID
              )
        )

        INSERT INTO #Order34Bindings
        (
            OrderID,
            LinkedOrderID,
            LinkedOrderNumber
        )

        SELECT
            BR.OrderID,
            ZP_Link.Ссылка AS LinkedOrderID,

            COALESCE(
                ZP_Link.Номер
                    COLLATE DATABASE_DEFAULT,

                NULLIF(
                    BR.LinkedValueText
                        COLLATE DATABASE_DEFAULT,
                    N''
                )
            ) AS LinkedOrderNumber

        FROM BindingRows AS BR

        LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].
             [Документы.ЗаказПокупателя] AS ZP_Link
            ON ZP_Link.Ссылка =
               BR.LinkedValueRef

        WHERE BR.rn = 1

          AND COALESCE(
                  ZP_Link.Номер,
                  NULLIF(BR.LinkedValueText, N'')
              ) IS NOT NULL;

    END;



    ;WITH RawBindingRows AS
    (
        SELECT
            CO.OrderID,
            REG._Period AS BindingPeriod,
            REG._Fld30533_RRRef AS LinkedValueRef,
            REG._Fld30533_S AS LinkedValueText,

            ROW_NUMBER() OVER
            (
                PARTITION BY CO.OrderID
                ORDER BY REG._Period DESC
            ) AS rn

        FROM #CustomerOrders AS CO

        INNER JOIN [WST\WST].[oknastyle].[dbo].
             [_InfoRg30529] AS REG

            ON REG._Fld30530_TYPE = @OrderDocType
           AND REG._Fld30530_RTRef = @OrderDocRTRef
           AND REG._Fld30530_RRRef = CO.OrderID

        INNER JOIN [WST\WST].[oknastyle].[dbo].
             [_Chrc1161] AS PROP

            ON PROP._IDRRef =
               REG._Fld30531RRef

           AND PROP._Code =
               @OrderLinkPropertyCode

        WHERE CO.OrderNumber LIKE N'34-%'

          AND NOT EXISTS
          (
              SELECT 1
              FROM #Order34Bindings AS B
              WHERE B.OrderID = CO.OrderID
          )
    )

    INSERT INTO #Order34Bindings
    (
        OrderID,
        LinkedOrderID,
        LinkedOrderNumber
    )

    SELECT
        BR.OrderID,
        ZP_Link.Ссылка AS LinkedOrderID,

        COALESCE(
            ZP_Link.Номер,
            NULLIF(BR.LinkedValueText, N'')
        ) AS LinkedOrderNumber

    FROM RawBindingRows AS BR

    LEFT JOIN [WST\WST].[oknastyle_biV2].[dbo].
         [Документы.ЗаказПокупателя] AS ZP_Link

        ON ZP_Link.Ссылка =
           BR.LinkedValueRef

    WHERE BR.rn = 1

      AND COALESCE(
              ZP_Link.Номер,
              NULLIF(BR.LinkedValueText, N'')
          ) IS NOT NULL;



    /* ============================================================
       ID ЗАМОВЛЕНЬ
       ============================================================ */

    DROP TABLE IF EXISTS #OrderIDs;


    SELECT DISTINCT
        CO.OrderID

    INTO #OrderIDs

    FROM #CustomerOrders AS CO

    WHERE CO.OrderID IS NOT NULL;


    CREATE CLUSTERED INDEX IX_OrderIDs_OrderID
        ON #OrderIDs(OrderID);



    /* ============================================================
       ДАТИ ВИРОБНИЦТВА
       ============================================================ */

    DROP TABLE IF EXISTS #OrderProductionDates;


    SELECT
        DSO._Fld30530_RRRef AS OrderID,

        MAX(
            CASE
                WHEN YEAR(DSO._Fld30533_T) < 3753
                    THEN DSO._Fld30533_T

                WHEN YEAR(
                    DATEADD(
                        YEAR,
                        -2000,
                        DSO._Fld30533_T
                    )
                ) <= 2001
                    THEN NULL

                ELSE DATEADD(
                    YEAR,
                    -2000,
                    DSO._Fld30533_T
                )
            END
        ) AS ProductionDateMax,


        MIN(
            CASE
                WHEN YEAR(DSO._Fld30533_T) < 3753
                    THEN DSO._Fld30533_T

                WHEN YEAR(
                    DATEADD(
                        YEAR,
                        -2000,
                        DSO._Fld30533_T
                    )
                ) <= 2001
                    THEN NULL

                ELSE DATEADD(
                    YEAR,
                    -2000,
                    DSO._Fld30533_T
                )
            END
        ) AS ProductionDateMin

    INTO #OrderProductionDates

    FROM [WST\WST].[oknastyle].[dbo].
         [_InfoRg30529] AS DSO
         

    INNER JOIN #OrderIDs AS O
        ON O.OrderID =
           DSO._Fld30530_RRRef

    WHERE DSO._Fld30531RRef IN
    (
        0xAFF46B686D7852BF4567D9CBD730D906,
        0x9BE28B5B76DCADD14007549C644AEB8A
    )

      AND DSO._Fld30530_TYPE =
          @OrderDocType

      AND DSO._Fld30530_RTRef =
          @OrderDocRTRef

    GROUP BY
        DSO._Fld30530_RRRef

    OPTION (RECOMPILE);


    CREATE CLUSTERED INDEX
        IX_OrderProductionDates_OrderID
        ON #OrderProductionDates(OrderID);



    /* ============================================================
       ДАТА СТВОРЕННЯ / ПЕРЕОФОРМЛЕННЯ
       ============================================================ */

    DROP TABLE IF EXISTS #OrderCreateDates;


    SELECT
        RSPP.Заказ AS OrderID,

        MIN(
            CASE
                WHEN YEAR(RSPP.Период) <= 2001
                    THEN NULL
                ELSE RSPP.Период
            END
        ) AS CreateDate

    INTO #OrderCreateDates

    FROM [oknastyle_biV2].[dbo].
         [РегистрыСведений.ПП_ПричиныПереоформления]
         AS RSPP

    INNER JOIN #CustomerOrders AS CO
        ON CO.OrderID = RSPP.Заказ

    GROUP BY
        RSPP.Заказ;


    CREATE CLUSTERED INDEX
        IX_OrderCreateDates_OrderID
        ON #OrderCreateDates(OrderID);



    /* ============================================================
       ФАЙЛИ
       ============================================================ */

    DROP TABLE IF EXISTS #CalcIDs;


    SELECT DISTINCT
        CR.CalcID

    INTO #CalcIDs

    FROM #CalcRequests AS CR

    WHERE CR.CalcID IS NOT NULL;


    CREATE CLUSTERED INDEX IX_CalcIDs_CalcID
        ON #CalcIDs(CalcID);



    DROP TABLE IF EXISTS #Files;


    SELECT
        I.Ссылка AS FileLink,
        C.CalcID AS CalcLink,
        I.ИмяФайла AS CalcFileName

    INTO #Files

    FROM #CalcIDs AS C

    INNER JOIN [oknastyle_biV2].[dbo].
         [ХранилищеДопИнформации] AS I

        ON I.Объект = C.CalcID
       AND I.Объект_ТипСсылки =
           0x0000AF38

    WHERE I.ПометкаУдаления = 0x00

    OPTION (RECOMPILE);


    CREATE CLUSTERED INDEX IX_Files_CalcLink
        ON #Files(CalcLink);



    DROP TABLE IF EXISTS #FilesAgg;


    SELECT
        F.CalcLink,

        STRING_AGG(
            dbo.СonvertorBinToGuid1C(F.FileLink),
            ','
        ) AS AllFileGUIDs,

        STRING_AGG(
            CAST(
                F.CalcFileName AS NVARCHAR(MAX)
            ),
            N' | '
        ) AS AllFileNames

    INTO #FilesAgg

    FROM #Files AS F

    GROUP BY
        F.CalcLink;


    CREATE CLUSTERED INDEX IX_FilesAgg_CalcLink
        ON #FilesAgg(CalcLink);



    /* ============================================================
       ОПЛАТИ
       ============================================================ */

    DROP TABLE IF EXISTS #Payments;


    SELECT
        R._Fld24772_RRRef AS OrderID,
        SUM(R._Fld24776) AS TotalPayments

    INTO #Payments

    FROM #OrderIDs AS O

    INNER JOIN [WST\WST].[oknastyle].[dbo].
         [_AccumRg24770] AS R
         

        ON R._Fld24772_TYPE =
           @OrderDocType

       AND R._Fld24772_RTRef =
           @OrderDocRTRef

       AND R._Fld24772_RRRef =
           O.OrderID

    WHERE R._Active = 0x01
      AND R._RecordKind = 1

    GROUP BY
        R._Fld24772_RRRef

    OPTION (RECOMPILE);


    CREATE UNIQUE CLUSTERED INDEX
        PK_Payments
        ON #Payments(OrderID);



    /* ============================================================
       ЗАПУСК У ВИРОБНИЦТВО
       ============================================================ */

    DROP TABLE IF EXISTS #ProdOrders;


    SELECT
        O.OrderID AS Заказ,

        MIN(
            CASE
                WHEN YEAR(ZNP._Fld6108) < 3753
                    THEN ZNP._Fld6108
                ELSE DATEADD(
                    YEAR,
                    -2000,
                    ZNP._Fld6108
                )
            END
        ) AS StartMin,

        MAX(
            CASE
                WHEN YEAR(ZNP._Fld6108) < 3753
                    THEN ZNP._Fld6108
                ELSE DATEADD(
                    YEAR,
                    -2000,
                    ZNP._Fld6108
                )
            END
        ) AS StartMax

    INTO #ProdOrders

    FROM #OrderIDs AS O

    INNER JOIN [WST\WST].[oknastyle].[dbo].
         [_Document380_VT6116] AS ZNPP
         

        ON ZNPP._Fld6127_TYPE =
           @OrderDocType

       AND ZNPP._Fld6127_RTRef =
           @OrderDocRTRef

       AND ZNPP._Fld6127_RRRef =
           O.OrderID

       AND ZNPP._Fld6118RRef =
           0x99B8002590633BB311E177FF631F08AD


    INNER JOIN [WST\WST].[oknastyle].[dbo].
         [_Document380] AS ZNP

        ON ZNP._IDRRef =
           ZNPP._Document380_IDRRef


    WHERE ZNP._Posted = 0x01

      AND
      (
             (
                 ZNP._Date_Time >= @RawPrevYearStart
                 AND ZNP._Date_Time < '3753-01-01'
             )
          OR ZNP._Date_Time >= @ShiftedPrevYearStart
      )

    GROUP BY
        O.OrderID

    OPTION (RECOMPILE);


    CREATE CLUSTERED INDEX
        IX_ProdOrders_OrderID
        ON #ProdOrders(Заказ);



    /* ============================================================
       ГОТОВНІСТЬ
       ============================================================ */

    -- VNext: purchased accessories require supplier receipts; manufactured items require production.
    DROP TABLE IF EXISTS #PurchasedCatalog;
    ;WITH CatalogTree AS (
        SELECT N.Ссылка AS ItemID
        FROM [oknastyle_biV2].[dbo].[Справочники.Номенклатура] N
        WHERE LTRIM(RTRIM(N.Наименование)) IN
            (N'Підвіконня', N'Подоконники', N'Подоконник', N'Відлив метал', N'Відливи', N'Отливы')
        UNION ALL
        SELECT N.Ссылка
        FROM [oknastyle_biV2].[dbo].[Справочники.Номенклатура] N
        INNER JOIN CatalogTree C ON N.Родитель=C.ItemID
    )
    SELECT DISTINCT ItemID INTO #PurchasedCatalog FROM CatalogTree
    OPTION (MAXRECURSION 100);
    CREATE UNIQUE CLUSTERED INDEX IX_PurchasedCatalog ON #PurchasedCatalog(ItemID);

    DROP TABLE IF EXISTS #RequiredItems;
    SELECT T.Ссылка AS OrderID, T.Номенклатура AS ItemID,
           ISNULL(T.ХарактеристикаНоменклатуры, 0x00000000000000000000000000000000) AS CharacteristicID,
           SUM(T.Количество) AS RequiredQty,
           SUM(T.Количество * ISNULL(NULLIF(T.Коэффициент,0),1)) AS RequiredBaseQty,
           MAX(CASE WHEN C.ItemID IS NOT NULL THEN 1 ELSE 0 END) AS IsPurchased
    INTO #RequiredItems
    FROM #OrderIDs O
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя.Товары] T ON T.Ссылка=O.OrderID
    LEFT JOIN #PurchasedCatalog C ON C.ItemID=T.Номенклатура
    WHERE T.Номенклатура NOT IN (0x89AF92BF3734FEC94BFAB4E884CAE5C5, 0x99DC002590633BB311E22E3A03435ED0, 0xA7009E14FF7CCB2E424091FF00E66DDA)
    GROUP BY T.Ссылка,T.Номенклатура,ISNULL(T.ХарактеристикаНоменклатуры,0x00000000000000000000000000000000)
    HAVING SUM(T.Количество)>0
    OPTION (RECOMPILE);
    CREATE UNIQUE CLUSTERED INDEX IX_RequiredItems ON #RequiredItems(OrderID,ItemID,CharacteristicID);

    -- Materialize only relevant purchase keys once. Avoid correlated remote
    -- scans of supplier/customer lines for each candidate link.
    DROP TABLE IF EXISTS #PurchaseKeys;
    SELECT DISTINCT ItemID,CharacteristicID INTO #PurchaseKeys
    FROM #RequiredItems WHERE IsPurchased=1;
    CREATE UNIQUE CLUSTERED INDEX IX_PurchaseKeys ON #PurchaseKeys(ItemID,CharacteristicID);

    DROP TABLE IF EXISTS #PurchaseOwners;
    SELECT K.ItemID,K.CharacteristicID,COUNT(DISTINCT X.Ссылка) AS OwnerCount,
           MIN(X.Ссылка) AS OnlyOrderID
    INTO #PurchaseOwners
    FROM #PurchaseKeys K
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя.Товары] X
      ON X.Номенклатура=K.ItemID AND X.ХарактеристикаНоменклатуры=K.CharacteristicID
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] D ON D.Ссылка=X.Ссылка
    WHERE K.CharacteristicID<>0x00000000000000000000000000000000 AND X.Количество>0
      AND D.Проведен=0x01 AND D.ПометкаУдаления=0x00
    GROUP BY K.ItemID,K.CharacteristicID
    OPTION (RECOMPILE);
    CREATE UNIQUE CLUSTERED INDEX IX_PurchaseOwners ON #PurchaseOwners(ItemID,CharacteristicID);

    DROP TABLE IF EXISTS #PurchaseRows;
    SELECT DISTINCT T.Ссылка AS PurchaseID,T.Номенклатура AS ItemID,
           T.ХарактеристикаНоменклатуры AS CharacteristicID,T.Заказ AS CustomerOrderID
    INTO #PurchaseRows
    FROM #PurchaseKeys K
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПоставщику.Товары] T
      ON T.Номенклатура=K.ItemID AND T.ХарактеристикаНоменклатуры=K.CharacteristicID
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПоставщику] D ON D.Ссылка=T.Ссылка
    WHERE T.Количество>0 AND D.Проведен=0x01 AND D.ПометкаУдаления=0x00
    OPTION (RECOMPILE);
    CREATE UNIQUE CLUSTERED INDEX IX_PurchaseRows ON #PurchaseRows(PurchaseID,ItemID,CharacteristicID,CustomerOrderID);

    DROP TABLE IF EXISTS #PurchaseLinks;
    SELECT DISTINCT R.OrderID,R.ItemID,R.CharacteristicID,T.PurchaseID
    INTO #PurchaseLinks
    FROM #RequiredItems R
    INNER JOIN #PurchaseRows T ON T.ItemID=R.ItemID AND T.CharacteristicID=R.CharacteristicID
    LEFT JOIN #PurchaseOwners O ON O.ItemID=R.ItemID AND O.CharacteristicID=R.CharacteristicID
    WHERE R.IsPurchased=1
      AND (T.CustomerOrderID=R.OrderID OR
          (T.CustomerOrderID=0x00000000000000000000000000000000
           AND R.CharacteristicID<>0x00000000000000000000000000000000
           AND (ISNULL(O.OwnerCount,0)=0 OR (O.OwnerCount=1 AND O.OnlyOrderID=R.OrderID))))
      AND NOT EXISTS (
          SELECT 1 FROM #PurchaseRows X
          WHERE X.PurchaseID=T.PurchaseID AND X.ItemID=R.ItemID AND X.CharacteristicID=R.CharacteristicID
            AND X.CustomerOrderID<>R.OrderID AND X.CustomerOrderID<>0x00000000000000000000000000000000
      )
    OPTION (RECOMPILE);
    CREATE UNIQUE CLUSTERED INDEX IX_PurchaseLinks ON #PurchaseLinks(PurchaseID,ItemID,CharacteristicID,OrderID);
    DROP TABLE #PurchaseKeys;
    DROP TABLE #PurchaseOwners;
    DROP TABLE #PurchaseRows;

    DROP TABLE IF EXISTS #PurchasedEvents;
    SELECT L.OrderID,L.ItemID,L.CharacteristicID,
           T.Количество * ISNULL(NULLIF(T.Коэффициент,0),1) AS BaseQty,
           CASE WHEN YEAR(D.Дата)>=3753 THEN DATEADD(YEAR,-2000,D.Дата) ELSE D.Дата END AS ReceiptDate
    INTO #PurchasedEvents
    FROM #PurchaseLinks L
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ПоступлениеТоваровУслуг.Товары] T
      ON COALESCE(NULLIF(T.ЗаказПоставщику,0x00000000000000000000000000000000),T.Заказ)=L.PurchaseID
     AND T.Номенклатура=L.ItemID
     AND ISNULL(T.ХарактеристикаНоменклатуры,0x00000000000000000000000000000000)=L.CharacteristicID
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ПоступлениеТоваровУслуг] D ON D.Ссылка=T.Ссылка
    WHERE D.Проведен=0x01 AND D.ПометкаУдаления=0x00
    UNION ALL
    SELECT L.OrderID,L.ItemID,L.CharacteristicID,
           -T.Количество * ISNULL(NULLIF(T.Коэффициент,0),1), NULL
    FROM #PurchaseLinks L
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ВозвратТоваровПоставщику.Товары] T
      ON T.Номенклатура=L.ItemID
     AND ISNULL(T.ХарактеристикаНоменклатуры,0x00000000000000000000000000000000)=L.CharacteristicID
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ВозвратТоваровПоставщику] D ON D.Ссылка=T.Ссылка
    WHERE D.Проведен=0x01 AND D.ПометкаУдаления=0x00
      AND COALESCE(NULLIF(T.Заказ,0x00000000000000000000000000000000),D.Сделка)=L.PurchaseID
    OPTION (RECOMPILE);

    DROP TABLE IF EXISTS #PurchasedItems;
    SELECT OrderID,ItemID,CharacteristicID,SUM(BaseQty) AS ReceivedQty,
           MIN(ReceiptDate) AS ReadyMin,MAX(ReceiptDate) AS ReadyMax
    INTO #PurchasedItems FROM #PurchasedEvents
    GROUP BY OrderID,ItemID,CharacteristicID;
    CREATE UNIQUE CLUSTERED INDEX IX_PurchasedItems ON #PurchasedItems(OrderID,ItemID,CharacteristicID);

    DROP TABLE IF EXISTS #ProducedItems;
    SELECT O.OrderID, P._Fld10548RRef AS ItemID,
           ISNULL(P._Fld10565RRef, 0x00000000000000000000000000000000) AS CharacteristicID,
           SUM(P._Fld10543) AS ProducedQty,
           MIN(CASE WHEN YEAR(D._Date_Time) < 3753 THEN D._Date_Time ELSE DATEADD(YEAR,-2000,D._Date_Time) END) AS ReadyMin,
           MAX(CASE WHEN YEAR(D._Date_Time) < 3753 THEN D._Date_Time ELSE DATEADD(YEAR,-2000,D._Date_Time) END) AS ReadyMax
    INTO #ProducedItems
    FROM #OrderIDs O
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document488_VT10534] P
        
        ON P._Fld10575_TYPE = @OrderDocType AND P._Fld10575_RTRef = @OrderDocRTRef
       AND P._Fld10575_RRRef = O.OrderID
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document488] D ON D._IDRRef = P._Document488_IDRRef
    WHERE D._Posted = 0x01
      AND P._Fld10548RRef NOT IN (0x89AF92BF3734FEC94BFAB4E884CAE5C5, 0x99DC002590633BB311E22E3A03435ED0, 0xA7009E14FF7CCB2E424091FF00E66DDA)
      AND ((D._Date_Time >= @RawPrevYearStart AND D._Date_Time < '3753-01-01') OR D._Date_Time >= @ShiftedPrevYearStart)
    GROUP BY O.OrderID, P._Fld10548RRef, ISNULL(P._Fld10565RRef, 0x00000000000000000000000000000000)
    OPTION (RECOMPILE);
    CREATE UNIQUE CLUSTERED INDEX IX_ProducedItems ON #ProducedItems(OrderID, ItemID, CharacteristicID);

    DROP TABLE IF EXISTS #ProdReports;
    ;WITH ItemReadiness AS (
        SELECT R.OrderID,R.ItemID,
               CASE WHEN R.IsPurchased=1 THEN CASE WHEN ISNULL(B.ReceivedQty,0)>=R.RequiredBaseQty AND B.ReadyMax IS NOT NULL THEN 1 ELSE 0 END
                    ELSE CASE WHEN ISNULL(P.ProducedQty,0)>=R.RequiredQty AND P.ReadyMax IS NOT NULL THEN 1 ELSE 0 END END AS IsComplete,
               CASE WHEN R.IsPurchased=1 THEN B.ReadyMin ELSE P.ReadyMin END AS ReadyMin,
               CASE WHEN R.IsPurchased=1 THEN B.ReadyMax ELSE P.ReadyMax END AS ReadyMax,
               CASE WHEN R.IsPurchased=0 THEN ISNULL(P.ProducedQty,0) ELSE 0 END AS ProducedQty
        FROM #RequiredItems R
        LEFT JOIN #ProducedItems P ON P.OrderID=R.OrderID AND P.ItemID=R.ItemID AND P.CharacteristicID=R.CharacteristicID
        LEFT JOIN #PurchasedItems B ON B.OrderID=R.OrderID AND B.ItemID=R.ItemID AND B.CharacteristicID=R.CharacteristicID
    )
    SELECT OrderID AS ЗаказРезерв,
           SUM(CASE WHEN ItemID=0x99B8002590633BB311E177FF631F08AD THEN ProducedQty ELSE 0 END) AS ProducedTotal,
           CASE WHEN MIN(IsComplete)=1 THEN MIN(ReadyMin) END AS ReadyMin,
           CASE WHEN MIN(IsComplete)=1 THEN MAX(ReadyMax) END AS ReadyMax
    INTO #ProdReports FROM ItemReadiness GROUP BY OrderID
    OPTION (RECOMPILE);
    CREATE UNIQUE CLUSTERED INDEX IX_ProdReports_OrderID ON #ProdReports(ЗаказРезерв);
    DROP TABLE #RequiredItems;
    DROP TABLE #ProducedItems;
    DROP TABLE #PurchasedCatalog;
    DROP TABLE #PurchaseLinks;
    DROP TABLE #PurchasedEvents;
    DROP TABLE #PurchasedItems;


    DROP TABLE IF EXISTS #SalesDocs;


    SELECT
        D._IDRRef AS SaleDocID,
        D._Fld14982_RRRef AS OrderID,

        CASE
            WHEN YEAR(D._Date_Time) < 3753
                THEN D._Date_Time
            ELSE DATEADD(
                YEAR,
                -2000,
                D._Date_Time
            )
        END AS SaleDate

    INTO #SalesDocs

    FROM #OrderIDs AS O

    INNER JOIN [WST\WST].[oknastyle].[dbo].
         [_Document566] AS D
         

        ON D._Fld14982_RRRef =
           O.OrderID

       AND D._Fld14982_TYPE =
           @OrderDocType

       AND D._Fld14982_RTRef =
           @OrderDocRTRef


    WHERE D._Posted = 0x01

      AND
      (
             (
                 D._Date_Time >= @PrevYearStart
                 AND D._Date_Time < '3753-01-01'
             )

          OR
             (
                 D._Date_Time >=
                     DATEADD(
                         YEAR,
                         2000,
                         @PrevYearStart
                     )

                 AND D._Date_Time >=
                     '3753-01-01'
             )
      )

    OPTION (RECOMPILE);


    CREATE CLUSTERED INDEX
        IX_SalesDocs_SaleDocID
        ON #SalesDocs(SaleDocID);

    CREATE NONCLUSTERED INDEX
        IX_SalesDocs_OrderID
        ON #SalesDocs(OrderID);



    DROP TABLE IF EXISTS #Sales;


    SELECT
        SD.OrderID AS Сделка,

        MAX(SD.SaleDate) AS SaleDate,

        SUM(T._Fld15020) AS SoldQuantity

    INTO #Sales

    FROM #SalesDocs AS SD

    INNER JOIN [WST\WST].[oknastyle].[dbo].
         [_Document566_VT15014] AS T
         

        ON T._Document566_IDRRef =
           SD.SaleDocID

       AND T._Fld15023RRef IN (
           0x99B8002590633BB311E177FF631F08AD,
           0x811B74867AD9D52511ECD4F5167A7E31
       )

    GROUP BY
        SD.OrderID

    OPTION (RECOMPILE);


    CREATE CLUSTERED INDEX
        IX_Sales_OrderID
        ON #Sales(Сделка);



    /* ============================================================
       АВТОРИ
       ============================================================ */

    DROP TABLE IF EXISTS #Authors;


    SELECT DISTINCT
        CR.Автор AS AuthorID,

        ISNULL(
            U.Наименование,
            C.Наименование
        ) AS AuthorName

    INTO #Authors

    FROM #CalcRequests AS CR

    LEFT JOIN [oknastyle_biV2].[dbo].
         [Справочники.Пользователи] AS U
        ON U.Ссылка = CR.Автор

    LEFT JOIN [oknastyle_biV2].[dbo].
         [Справочники.Контрагенты] AS C
        ON C.Ссылка = CR.Автор

    WHERE CR.Автор IS NOT NULL;


    CREATE CLUSTERED INDEX IX_Authors_AuthorID
        ON #Authors(AuthorID);



    /* ============================================================
       ДОКУМЕНТИ ДОСТАВКИ
       ============================================================ */

    DROP TABLE IF EXISTS #DeliveryLines;
    DROP TABLE IF EXISTS #RoutingOrders;
    DROP TABLE IF EXISTS #RoutingDelivery;
    DROP TABLE IF EXISTS #RouteRows;
    DROP TABLE IF EXISTS #RouteSchedule;



    SELECT
        T._Document628_IDRRef AS Ссылка,
        T._Fld17267RRef AS OrderID,

        MAX(T._Fld17281) AS ArrivalTime,

        COUNT_BIG(*) AS ItemsInDeliveryCount

    INTO #DeliveryLines

    FROM #OrderIDs AS O

    INNER JOIN [WST\WST].[oknastyle].[dbo].
         [_Document628_VT17263] AS T
         

        ON T._Fld17267RRef =
           O.OrderID

    WHERE T._Fld17270RRef =
          0x99B8002590633BB311E177FF631F08AD

    GROUP BY
        T._Document628_IDRRef,
        T._Fld17267RRef

    OPTION (RECOMPILE);


    CREATE CLUSTERED INDEX
        IX_DeliveryLines_Link
        ON #DeliveryLines(Ссылка);

    CREATE NONCLUSTERED INDEX
        IX_DeliveryLines_OrderID
        ON #DeliveryLines(OrderID);



    /* ============================================================
       МАРШРУТИ ЗАМОВЛЕНЬ
       ============================================================ */

    SELECT DISTINCT
        R.Ссылка AS RoutingID,
        R.ЗаказПокупателя AS OrderID

    INTO #RoutingOrders

    FROM #OrderIDs AS O

    INNER JOIN [oknastyle_biV2].[dbo].
         [Документы.ШБ_Маршрутизация.Маршрут] AS R

        ON R.ЗаказПокупателя =
           O.OrderID

    WHERE R.ЗаказПокупателя IS NOT NULL

    OPTION (RECOMPILE);


    CREATE UNIQUE CLUSTERED INDEX
        IX_RoutingOrders_RoutingOrder
        ON #RoutingOrders
           (
               RoutingID,
               OrderID
           );




    /* ============================================================
       ВСІ РЯДКИ ПОТРІБНИХ МАРШРУТІВ

       День доставки рахуємо по переходу часу через 00:00,
       але НЕ вважаємо це новим днем, якщо:
       - ПорядковыйНомер = 1;
       - порядковий номер не змінився;
       - контрагент не змінився.

       Додатково DeliveryDayOffset обмежуємо діапазоном
       FirstUnloadDate -> LastUnloadDate.
       ============================================================ */

    ;WITH TargetRoutes AS
    (
        SELECT DISTINCT
            RoutingID
        FROM #RoutingOrders
    )
    SELECT
        R.Ссылка AS RoutingID,
        R.НомерСтроки,
        R.ПорядковыйНомер AS DeliverySequence,
        R.ЗаказПокупателя AS OrderID,
        ZP.Контрагент AS ContractorID,

        CASE
            WHEN R.ЧасПрибытия IS NULL THEN NULL
            ELSE CONVERT(TIME(0), R.ЧасПрибытия)
        END AS ArrivalTime,

        RAW._Number AS RouteNumber,

        /* Первый день разгрузки */
        CASE
            WHEN RAW._Fld25861 IS NULL THEN NULL
            WHEN YEAR(RAW._Fld25861) >= 4000
                THEN CONVERT(DATE, DATEADD(YEAR, -2000, RAW._Fld25861))
            WHEN YEAR(RAW._Fld25861) <= 2001
                THEN NULL
            ELSE CONVERT(DATE, RAW._Fld25861)
        END AS FirstUnloadDate,

        /* Последний день разгрузки */
        CASE
            WHEN RAW._Fld31463 IS NULL THEN NULL
            WHEN YEAR(RAW._Fld31463) >= 4000
                THEN CONVERT(DATE, DATEADD(YEAR, -2000, RAW._Fld31463))
            WHEN YEAR(RAW._Fld31463) <= 2001
                THEN NULL
            ELSE CONVERT(DATE, RAW._Fld31463)
        END AS LastUnloadDate

    INTO #RouteRows
    FROM TargetRoutes AS TR
    INNER JOIN [oknastyle_biV2].[dbo].[Документы.ШБ_Маршрутизация.Маршрут] AS R
        ON R.Ссылка = TR.RoutingID
    LEFT JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] AS ZP
        ON ZP.Ссылка = R.ЗаказПокупателя
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document25843] AS RAW
        ON RAW._IDRRef = R.Ссылка
    WHERE R.ЧасПрибытия IS NOT NULL
    OPTION (RECOMPILE);

    CREATE CLUSTERED INDEX IX_RouteRows_RouteLine
        ON #RouteRows(RoutingID, НомерСтроки);

    CREATE NONCLUSTERED INDEX IX_RouteRows_OrderID
        ON #RouteRows(OrderID);

    /* ============================================================
       ВИЗНАЧЕННЯ КОНКРЕТНОГО ДНЯ ДОСТАВКИ
       ============================================================ */

    ;WITH PreviousTimes AS
    (
        SELECT
            RR.*,

            LAG(RR.ArrivalTime) OVER
            (
                PARTITION BY RR.RoutingID
                ORDER BY RR.НомерСтроки
            ) AS PreviousArrivalTime,

            LAG(RR.DeliverySequence) OVER
            (
                PARTITION BY RR.RoutingID
                ORDER BY RR.НомерСтроки
            ) AS PreviousDeliverySequence,

            LAG(RR.ContractorID) OVER
            (
                PARTITION BY RR.RoutingID
                ORDER BY RR.НомерСтроки
            ) AS PreviousContractorID

        FROM #RouteRows AS RR
    ),
    RawDayOffsets AS
    (
        SELECT
            P.*,

            SUM
            (
                CASE
                    WHEN P.PreviousArrivalTime IS NOT NULL
                     AND P.ArrivalTime < P.PreviousArrivalTime

                     /* Порядковий номер 1 завжди перший день */
                     /* Порядковий номер 1 завжди перший день.
                           Якщо значення не числове (наприклад KL001), цю перевірку пропускаємо */
                        AND (
                            TRY_CONVERT(INT, P.DeliverySequence) IS NULL
                            OR TRY_CONVERT(INT, P.DeliverySequence) > 1
                        )

                        /* Має бути інша точка маршруту */
                        AND ISNULL(
                                CONVERT(NVARCHAR(100), P.DeliverySequence),
                                N''
                            )
                            <>
                            ISNULL(
                                CONVERT(NVARCHAR(100), P.PreviousDeliverySequence),
                                N''
                            )

                     /* І інший контрагент */
                     AND ISNULL(
                             P.ContractorID,
                             0x00000000000000000000000000000000
                         )
                         <>
                         ISNULL(
                             P.PreviousContractorID,
                             0x00000000000000000000000000000000
                         )
                        THEN 1
                    ELSE 0
                END
            ) OVER
            (
                PARTITION BY P.RoutingID
                ORDER BY P.НомерСтроки
                ROWS UNBOUNDED PRECEDING
            ) AS RawDeliveryDayOffset

        FROM PreviousTimes AS P
    ),
    FixedDayOffsets AS
    (
        SELECT
            W.*,

            CASE
                WHEN W.FirstUnloadDate IS NULL
                    THEN NULL

                WHEN W.LastUnloadDate IS NULL
                    THEN W.RawDeliveryDayOffset

                WHEN W.RawDeliveryDayOffset >
                     DATEDIFF(DAY, W.FirstUnloadDate, W.LastUnloadDate)
                    THEN DATEDIFF(DAY, W.FirstUnloadDate, W.LastUnloadDate)

                ELSE W.RawDeliveryDayOffset
            END AS DeliveryDayOffset

        FROM RawDayOffsets AS W
    )
    SELECT
        D.RoutingID,
        D.НомерСтроки,
        D.DeliverySequence,
        D.OrderID,
        D.ContractorID,
        D.RouteNumber,
        D.FirstUnloadDate,
        D.LastUnloadDate,
        D.ArrivalTime,
        D.RawDeliveryDayOffset,
        D.DeliveryDayOffset,

        CASE
            WHEN D.FirstUnloadDate IS NULL THEN NULL
            ELSE DATEADD(DAY, D.DeliveryDayOffset, D.FirstUnloadDate)
        END AS DeliveryDate,

        CASE
            WHEN D.FirstUnloadDate IS NULL
              OR D.ArrivalTime IS NULL
                THEN NULL
            ELSE DATEADD
            (
                SECOND,
                DATEDIFF
                (
                    SECOND,
                    CAST('00:00:00' AS TIME),
                    D.ArrivalTime
                ),
                CAST
                (
                    DATEADD
                    (
                        DAY,
                        D.DeliveryDayOffset,
                        D.FirstUnloadDate
                    ) AS DATETIME
                )
            )
        END AS PlannedDeliveryDateTime

    INTO #RouteSchedule
    FROM FixedDayOffsets AS D;

    CREATE CLUSTERED INDEX IX_RouteSchedule_RouteLine
        ON #RouteSchedule(RoutingID, НомерСтроки);

    CREATE NONCLUSTERED INDEX IX_RouteSchedule_OrderID
        ON #RouteSchedule(OrderID);

    /* ============================================================
       ОДИН РЯДОК МАРШРУТУ НА ЗАМОВЛЕННЯ
       ============================================================ */

    SELECT
        RO.OrderID,


        /*
            Старе поле.
            Залишаємо для сумісності.
        */
        MAX(
            CASE
                WHEN M.ДатаЗагрузкиМаршрута IS NULL
                    THEN NULL

                WHEN YEAR(
                    M.ДатаЗагрузкиМаршрута
                ) >= 4000
                    THEN DATEADD(
                        YEAR,
                        -2000,
                        M.ДатаЗагрузкиМаршрута
                    )

                WHEN YEAR(
                    M.ДатаЗагрузкиМаршрута
                ) <= 2001
                    THEN NULL

                ELSE M.ДатаЗагрузкиМаршрута
            END
        ) AS PlannedDeliveryDate,


        /* Первый день разгрузки */
        MAX(
            RS.FirstUnloadDate
        ) AS FirstUnloadDate,


        /* Последний день разгрузки */
        MAX(
            RS.LastUnloadDate
        ) AS LastUnloadDate,


        /* Час прибуття конкретного замовлення */
        MAX(
            RS.ArrivalTime
        ) AS RouteArrivalTime,


        /*
            НОВЕ ПОЛЕ:
            конкретна дата + час прибуття
            конкретного замовлення.
        */
        MAX(
            RS.PlannedDeliveryDateTime
        ) AS PlannedDeliveryDateTime,


        MAX(
            SM.Наименование
        ) AS RouteStatus

    INTO #RoutingDelivery

    FROM #RoutingOrders AS RO

    INNER JOIN [oknastyle_biV2].[dbo].
         [Документы.ШБ_Маршрутизация] AS M

        ON M.Ссылка =
           RO.RoutingID


    LEFT JOIN #RouteSchedule AS RS

        ON RS.RoutingID =
           RO.RoutingID

       AND RS.OrderID =
           RO.OrderID


    LEFT JOIN [oknastyle_biV2].[dbo].
         [Справочники.СостоянияМаршрутов] AS SM

        ON SM.Ссылка =
           M.СостояниеМаршрута


    GROUP BY
        RO.OrderID

    OPTION (RECOMPILE);



    CREATE UNIQUE CLUSTERED INDEX
        IX_RoutingDelivery_OrderID
        ON #RoutingDelivery(OrderID);



    /* ============================================================
       ФАКТИЧНИЙ ДОКУМЕНТ ДОСТАВКИ
       ============================================================ */

    DROP TABLE IF EXISTS #Delivery;


    SELECT
        DL.OrderID,

        MAX(
            DL.ArrivalTime
        ) AS ArrivalTime,

        MAX(
            CASE
                WHEN D._Fld17254 IS NULL
                    THEN NULL

                WHEN YEAR(D._Fld17254) >= 4000
                    THEN DATEADD(
                        YEAR,
                        -2000,
                        D._Fld17254
                    )

                WHEN YEAR(D._Fld17254) <= 2001
                    THEN NULL

                ELSE D._Fld17254
            END
        ) AS PlannedDepartureDate,

        SUM(
            DL.ItemsInDeliveryCount
        ) AS ItemsInDeliveryCount

    INTO #Delivery

    FROM #DeliveryLines AS DL

    INNER JOIN [WST\WST].[oknastyle].[dbo].
         [_Document628] AS D

        ON D._IDRRef =
           DL.Ссылка

    WHERE D._Posted = 0x01
      AND D._Marked = 0x00

      AND
      (
             (
                 D._Date_Time >= @PrevYearStart
                 AND D._Date_Time < '3753-01-01'
             )

          OR
             (
                 D._Date_Time >=
                     DATEADD(
                         YEAR,
                         2000,
                         @PrevYearStart
                     )

                 AND D._Date_Time >=
                     '3753-01-01'
             )
      )

    GROUP BY
        DL.OrderID

    OPTION (RECOMPILE);


    CREATE CLUSTERED INDEX
        IX_Delivery_OrderID
        ON #Delivery(OrderID);



    /* ============================================================
       ФІНАЛЬНИЙ SELECT
       ============================================================ */

    SELECT
        dbo.СonvertorBinToGuid1C(
            CO.OrderID
        ) AS OrderID_GUID,

        dbo.СonvertorBinToGuid1C(
            CR.CalcID
        ) AS CalcID_GUID,

        CR.CalcNumber,

        CR.CalcDate,

        CR.НомерДилера AS CalcDealerNumber,

        CR.CalcState,

        CR.CalcConstructionsCount,

        CR.CalcComment,

        A.AuthorName AS CalcAuthorName,

        dbo.СonvertorBinToGuid1C(
            CR.Автор
        ) AS CalcAuthor_GUID,

        CR.Получатель AS Recipient,

        V_Base.Наименование AS Currency,

        CR.ТелефонПолучателя AS RecipientPhone,

        CR.Дополнительно AS RecipientAdditionalInfo,

        FA.AllFileGUIDs,

        FA.AllFileNames,

        CA.DeliveryAddresses,

        CO.OrderNumber,

        CO.ClientOrderNumber,

        C.Наименование AS Customer,

        C.Ссылка AS ContractorID,

        ORG.Наименование AS OrganizationName,

        OS.Наименование AS OrderState,

        CO.OrderSum,

        CO.ConstructionsCount,

        OPD.ProductionDateMax,

        OPD.ProductionDateMin,

        CO.WebNumber,

        CO.OrderAddress,

        CO.DateDelays,

        ISNULL(
            P.TotalPayments,
            0
        ) AS PaidAmount,

        PO.StartMin AS ProductionStartDateMin,

        PO.StartMax AS ProductionStartDateMax,

        ISNULL(
            PR.ProducedTotal,
            0
        ) AS ProducedTotal,

        PR.ReadyMin AS ProductionReadyDateMin,

        PR.ReadyMax AS ProductionReadyDateMax,

        S.SaleDate,

        ISNULL(
            S.SoldQuantity,
            0
        ) AS SoldQuantity,


        /* Старі поля доставки */
        DD.PlannedDepartureDate,

        RD.PlannedDeliveryDate,


        /* ========================================================
           НОВІ ПОЛЯ МАРШРУТУ
           ======================================================== */

        RD.FirstUnloadDate,

        RD.LastUnloadDate,

        RD.RouteArrivalTime,

        RD.PlannedDeliveryDateTime,


        /* ======================================================== */

        DD.ItemsInDeliveryCount,

        DD.ArrivalTime,

        RD.RouteStatus,

        C.[ОсновнойМенеджерПокупателя] AS Manager,


        CASE

            WHEN S.SaleDate IS NOT NULL
                THEN N'Відвантажений'

            WHEN PR.ReadyMax IS NOT NULL
                THEN N'Готовий'

            WHEN PO.StartMax IS NOT NULL
                THEN N'У виробництві'

            WHEN OS.Наименование =
                 N'Ждем подтверждения'
                THEN N'Очікуємо підтвердження'

            WHEN OS.Наименование =
                 N'Подтверждено'
                THEN N'Підтверджений'

            WHEN OS.Наименование =
                 N'Ждем оплати'
                THEN N'Очікуємо оплату'

            WHEN OS.Наименование =
                 N'Отказ'
                THEN N'Відмова'

           WHEN OS.Наименование =
                 N'Автоматический отказ-неоплачено'
                THEN N'Відмова'

           WHEN CR.CalcState =
                 0xA267AAA90D55301D4E455425612DA59E
                THEN N'В обробці'

           WHEN CR.CalcState =
                 0x91618BA8D8C91242425CCC244564E77B
                THEN N'Відмова'

           WHEN CR.CalcState =
                0x96005C9EEF9736DB4F9F3ECF1CBB54A3
            THEN N'Очікуємо підтвердження'

            WHEN OS.Наименование =
                 N'Для просчета'
              --OR OS.Наименование IS NULL
                THEN N'Для прорахунку'

            WHEN OS.Наименование =
                 N'Рисунок без подтверждения'
                THEN N'Ескіз без підтвердження'

            WHEN OS.Наименование =
                 N'Рисунок - подтвержден'
                THEN N'Ескіз підтверджено'

            WHEN OS.Наименование =
                 N'Разработка рисунка'
                THEN N'Розробка ескізу'

            ELSE N'Новий'

        END AS OrderStage,


        OCD.CreateDate AS OrderDate,


        dbo.СonvertorBinToGuid1C
        (
            COALESCE(
                CO.BaseOrderID,
                O34.LinkedOrderID
            )
        ) AS LinkedOrderID_GUID,


        CASE
            WHEN CO.OrderNumber LIKE N'34-%'
                THEN COALESCE(
                    CO.BaseOrderNumber
                        COLLATE DATABASE_DEFAULT,

                    O34.LinkedOrderNumber
                        COLLATE DATABASE_DEFAULT
                )
            ELSE NULL
        END AS LinkedOrderNumber


    FROM #CalcRequests AS CR


    LEFT JOIN #Authors AS A
        ON A.AuthorID =
           CR.Автор


    LEFT JOIN #CustomerOrders AS CO
        ON CO.CalcID =
           CR.CalcID


    LEFT JOIN #Order34Bindings AS O34
        ON O34.OrderID =
           CO.OrderID


    LEFT JOIN #OrderProductionDates AS OPD
        ON OPD.OrderID =
           CO.OrderID


    LEFT JOIN #OrderCreateDates AS OCD
        ON OCD.OrderID =
           CO.OrderID


    LEFT JOIN [oknastyle_biV2].[dbo].
         [Справочники.Валюты] AS V

        ON V.Ссылка =
           CO.ВалютаДокумента


    LEFT JOIN [oknastyle_biV2].[dbo].
         [Справочники.Валюты] AS V_Base

        ON V_Base.Ссылка =
           V.ОсновнаяВалюта


    LEFT JOIN #CalcAddresses AS CA
        ON CA.CalcID =
           CR.CalcID


    LEFT JOIN #FilesAgg AS FA
        ON FA.CalcLink =
           CR.CalcID


    LEFT JOIN [oknastyle_biV2].[dbo].
         [Справочники.Контрагенты] AS C

        ON C.Ссылка =
           ISNULL(
               CO.ContractorID,
               CR.CalcContractorID
           )


    LEFT JOIN [oknastyle_biV2].[dbo].
         [Справочники.БВ_СостоянияЗаказов] AS OS

        ON OS.Ссылка =
           CO.OrderStateID

       AND OS.ПометкаУдаления =
           0x00


    LEFT JOIN #Payments AS P
        ON P.OrderID =
           CO.OrderID


    LEFT JOIN #ProdOrders AS PO
        ON PO.Заказ =
           CO.OrderID


    LEFT JOIN #ProdReports AS PR
        ON PR.ЗаказРезерв =
           CO.OrderID


    LEFT JOIN #Sales AS S
        ON S.Сделка =
           CO.OrderID


    LEFT JOIN #Delivery AS DD
        ON DD.OrderID =
           CO.OrderID


    LEFT JOIN #RoutingDelivery AS RD
        ON RD.OrderID =
           CO.OrderID


    LEFT JOIN [oknastyle_biV2].[dbo].
         [Справочники.Организации] AS ORG

        ON ORG.Ссылка =
           CO.OrganizationID


    ORDER BY
        CR.CalcDate DESC,
        CR.CalcNumber DESC

    OPTION (RECOMPILE);



    /* ============================================================
       CLEANUP
       ============================================================ */

    DROP TABLE IF EXISTS #CalcRequests;
    DROP TABLE IF EXISTS #CalcAddresses;
    DROP TABLE IF EXISTS #CalcOrders;
    DROP TABLE IF EXISTS #CustomerOrders;
    DROP TABLE IF EXISTS #Order34Bindings;
    DROP TABLE IF EXISTS #OrderCandidates;
    DROP TABLE IF EXISTS #OrderLinksByContractor;
    DROP TABLE IF EXISTS #OrderIDs;
    DROP TABLE IF EXISTS #OrderProductionDates;
    DROP TABLE IF EXISTS #OrderCreateDates;
    DROP TABLE IF EXISTS #CalcIDs;
    DROP TABLE IF EXISTS #Files;
    DROP TABLE IF EXISTS #FilesAgg;
    DROP TABLE IF EXISTS #Payments;
    DROP TABLE IF EXISTS #ProdOrders;
    DROP TABLE IF EXISTS #ProdReports;
    DROP TABLE IF EXISTS #SalesDocs;
    DROP TABLE IF EXISTS #Sales;
    DROP TABLE IF EXISTS #Authors;
    DROP TABLE IF EXISTS #DeliveryLines;

    /* нові таблиці */
    DROP TABLE IF EXISTS #RouteRows;
    DROP TABLE IF EXISTS #RouteSchedule;

    DROP TABLE IF EXISTS #RoutingOrders;
    DROP TABLE IF EXISTS #RoutingDelivery;

    DROP TABLE IF EXISTS #Delivery;

END;
