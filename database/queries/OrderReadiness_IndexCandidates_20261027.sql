/* Кандидати аудиту 27.10.2026. Лише для перевірки на копії oknastyle.
   Навмисно закоментовано: не запускати масово на робочій базі.
   Стандартні індекси 1С не замінювати.
   Для заголовків потрібна окрема тестова версія процедури без старого INDEX hint.
   Після кожного індексу порівняти результати, IO/TIME і план.

CREATE NONCLUSTERED INDEX IX_Portal_OrderCandidates_Cover
ON dbo._Document381 (_Marked, _Date_Time)
INCLUDE (_Number, _Posted);

CREATE NONCLUSTERED INDEX IX_Portal_CustomerLines_ItemCharacteristic
ON dbo._Document381_VT6283 (_Fld6290RRef, _Fld6298RRef)
INCLUDE (_Fld6287);
-- Ідентифікатор документа входить у clustered key та доступний у nonclustered index.

CREATE NONCLUSTERED INDEX IX_Portal_SupplierLines_ItemCharacteristic
ON dbo._Document382_VT6547 (_Fld6555RRef, _Fld6560RRef)
INCLUDE (_Fld6552, _Fld6551_RRRef);

CREATE NONCLUSTERED INDEX IX_Portal_ReceiptLines_ItemCharacteristic
ON dbo._Document540_VT13376 (_Fld13378RRef, _Fld13389RRef)
INCLUDE (_Fld13382, _Fld13383, _Fld13390_RRRef, _Fld13396RRef);

-- Відкат тільки власних тестових індексів:
DROP INDEX IF EXISTS IX_Portal_OrderCandidates_Cover ON dbo._Document381;
DROP INDEX IF EXISTS IX_Portal_CustomerLines_ItemCharacteristic ON dbo._Document381_VT6283;
DROP INDEX IF EXISTS IX_Portal_SupplierLines_ItemCharacteristic ON dbo._Document382_VT6547;
DROP INDEX IF EXISTS IX_Portal_ReceiptLines_ItemCharacteristic ON dbo._Document540_VT13376;
*/
PRINT N'Це перелік кандидатів. Жодних змін не виконано.';
