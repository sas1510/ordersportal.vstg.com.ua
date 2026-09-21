CREATE OR ALTER PROCEDURE [dbo].[GetProductionNumbersByCalcGUID]
(
    @CalcGUID BINARY(16)
)
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    SELECT DISTINCT
        LTRIM(RTRIM(ZP._Number)) AS ProductionNumber
    FROM
    (
        /* Старий зв'язок: прорахунок -> замовлення */
        SELECT
            L._Fld44865RRef AS OrderID
        FROM [WST\WST].[oknastyle].[dbo].[_Document44856_VT44863] AS L
             WITH
             (
                 INDEX(_Documen44856_VT44863_IntKeyInd),
                 FORCESEEK
             )
        WHERE L._Document44856_IDRRef = @CalcGUID
          AND L._Fld44865RRef IS NOT NULL

        UNION

        /* Новий зв'язок: ДокументОснование */
        SELECT
            ZP_Link._IDRRef AS OrderID
        FROM [WST\WST].[oknastyle].[dbo].[_Document381] AS ZP_Link
        WHERE ZP_Link._Fld6205_RRRef = @CalcGUID
          AND ZP_Link._Fld6205_TYPE = 0x08
          AND ZP_Link._Fld6205_RTRef = 0x0000AF38
          AND ZP_Link._Marked = 0x00
          AND ZP_Link._IDRRef IS NOT NULL
    ) AS O
    INNER JOIN [WST\WST].[oknastyle].[dbo].[_Document381] AS ZP
        ON ZP._IDRRef = O.OrderID
    WHERE ZP._Marked = 0x00
      AND (ZP._Posted = 0x01 OR ZP._Number LIKE N'34-%')
      AND NULLIF(LTRIM(RTRIM(ZP._Number)), N'') IS NOT NULL
    ORDER BY ProductionNumber;
END;
