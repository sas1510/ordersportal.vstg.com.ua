"""Batch metadata for returned calculations; never exposes idempotency response bodies."""
from uuid import UUID
from .measurement_links import measurement_portal_path
from django.db import connection
from utils.GuidToBin1C import guid_to_1c_bin
from utils.BinToGuid1C import bin_to_guid_1c


def attach_calculation_metadata(calculations):
    ids={}
    for calc in calculations:
        calc['oneCNumber']=None
        calc['fromMeasurement']=False
        calc['measurementUrl']=None
        calc['measurementDealerId']=None
        calc['measurementNumber']=None
        try:
            value=calc.get('id')
            if isinstance(value,(bytes,bytearray,memoryview)):
                value=bin_to_guid_1c(bytes(value))
            key=str(UUID(str(value)))
            ids[key]=guid_to_1c_bin(key)
        except (ValueError,TypeError,AttributeError):
            continue
    if not ids:
        return calculations
    numbers={};sources={}
    keys=list(ids)
    with connection.cursor() as cursor:
        for start in range(0,len(keys),400):
            chunk=keys[start:start+400]
            placeholders=','.join(['%s']*len(chunk))
            cursor.execute('SELECT Ссылка,Номер FROM [oknastyle_biV2].[dbo].[ЗаявкаНаПросчет] WHERE Ссылка IN ('+placeholders+')',[ids[key] for key in chunk])
            for guid,number in cursor.fetchall():
                numbers[bin_to_guid_1c(bytes(guid))]=str(number or '').strip() or None
            cursor.execute('''SELECT CalculationGuid,
                JSON_VALUE(ResponseBody, '$._measurement_telegram.payload.order_number'),
                JSON_VALUE(ResponseBody, '$._measurement_telegram.payload.user_id')
                FROM dbo.CalculationIdempotencyRecords
                WHERE Status='succeeded' AND CalculationGuid IN ('''+placeholders+''')
                AND JSON_QUERY(ResponseBody, '$._measurement_telegram') IS NOT NULL''',[UUID(key).hex for key in chunk])
            for guid,number,dealer_id in cursor.fetchall():
                try:
                    key=str(UUID(str(guid)))
                except (ValueError,TypeError,AttributeError):
                    continue
                sources[key]=(str(number or '').strip(),str(dealer_id or '').strip())
    for calc in calculations:
        try:
            value=calc.get('id')
            key=bin_to_guid_1c(bytes(value)) if isinstance(value,(bytes,bytearray,memoryview)) else str(UUID(str(value)))
        except (ValueError,TypeError,AttributeError):
            continue
        calc['oneCNumber']=numbers.get(key)
        calc['fromMeasurement']=key in sources
        if key in sources:
            number,dealer_id=sources[key]
            calc['measurementNumber']=number or None
            calc['measurementDealerId']=int(dealer_id) if dealer_id.isdigit() and int(dealer_id)>0 else None
            calc['measurementUrl']=measurement_portal_path(number,calc['measurementDealerId'])
    return calculations
