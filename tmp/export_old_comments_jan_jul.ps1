param([Parameter(Mandatory=$true)][string]$Password)
$ErrorActionPreference='Stop'
$outDir=Join-Path $PSScriptRoot '../backups/comments_jan_jul_2026_20261030'
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$conn=[System.Data.SqlClient.SqlConnection]::new("Server=192.168.200.4,1433;Database=ordersportal_db;User ID=1s-connector;Password=$Password;Encrypt=False;TrustServerCertificate=True;Connect Timeout=10")
function Read-Rows([string]$Sql) {
 $cmd=$conn.CreateCommand(); $cmd.CommandTimeout=120; $cmd.CommandText=$Sql
 $reader=$cmd.ExecuteReader(); $result=[System.Collections.Generic.List[object]]::new()
 try {while($reader.Read()) {$row=[ordered]@{}; for($i=0;$i -lt $reader.FieldCount;$i++) {$v=$reader.GetValue($i); if($v -is [DBNull]){$v=$null} elseif($v -is [datetime]){$v=$v.ToString('yyyy-MM-ddTHH:mm:ss.fffffff')} elseif($v -is [guid]){$v=$v.ToString()}; $row[$reader.GetName($i)]=$v};$result.Add($row)}} finally {$reader.Close();$cmd.Dispose()}
 return ,$result
}
try {
 $conn.Open()
 $rows=Read-Rows @"
SELECT OM.OrdersMessageId AS oldMessageId,OM.OrderId AS oldOrderId,OM.MessageWriterId AS oldWriterId,OM.MessageTime AS timestamp,OM.Message AS text,
 O.OrderNumber AS orderNumber,O.OrderDateCreate AS orderCreated,O.CustomerId AS oldCustomerId,O.ManagerId AS oldManagerId,O.StatusId AS currentStatus,C.CustomerContrCode AS contractorCode,
 STUFF((SELECT ','+CAST(D.Db1SOrderNumber AS varchar(max)) FROM dbo.Db1SOrderNumbers D WHERE D.OrderId=O.OrderId FOR XML PATH(''),TYPE).value('.','varchar(max)'),1,1,'') AS linkedOrderNumbers
FROM dbo.OrdersMessages OM JOIN dbo.Orders O ON O.OrderId=OM.OrderId LEFT JOIN dbo.Customers C ON C.OrderPortalUser_Id=O.CustomerId
WHERE OM.MessageTime>='20260101' AND OM.MessageTime<'20260801' AND OM.Message IS NOT NULL AND LEN(LTRIM(RTRIM(OM.Message)))>0
ORDER BY OM.MessageTime,OM.OrdersMessageId
"@
 $managers=Read-Rows 'SELECT OrderPortalUser_Id AS oldUserId,Guid AS guid FROM dbo.Managers WHERE Guid IS NOT NULL'
 $users=Read-Rows 'SELECT Id AS oldUserId,UserName AS login,FullName AS name FROM dbo.AspNetUsers'
 [ordered]@{users=$users;from='2026-01-01';toExclusive='2026-08-01';messages=$rows;managers=$managers} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $outDir 'source.json') -Encoding UTF8
 "EXPORTED messages=$($rows.Count) managers=$($managers.Count)"
 "SOURCE $(Join-Path $outDir 'source.json')"
} finally {$conn.Dispose()}

