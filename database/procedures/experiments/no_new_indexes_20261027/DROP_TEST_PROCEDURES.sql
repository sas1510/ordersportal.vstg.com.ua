USE [portal_db];
GO
IF CAST(SERVERPROPERTY('ServerName') AS nvarchar(128)) <> N'WST\WST'
    THROW 50000, N'Очікується сервер WST\WST. Видалення скасовано.', 1;
DROP PROCEDURE IF EXISTS dbo.GetCalculationsWithOrdersByYearAndContractor7_NoNewIndexesTest;
DROP PROCEDURE IF EXISTS dbo.GetOrdersMonthWithCalculations8_NoNewIndexesTest;
