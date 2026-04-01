from django.db import connection

def get_contractor_main_manager_bin(contractor_bin):
    """
    Викликає процедуру GetContractorMainManager та повертає Binary GUID менеджера.
    """
    with connection.cursor() as cursor:
        # Викликаємо процедуру (передаємо Binary GUID контрагента)
        cursor.execute("EXEC [dbo].[GetContractorMainManager] @ContractorID = %s", [contractor_bin])
        row = cursor.fetchone()
        
        # Повертаємо ManagerGuid (це 4-та колонка у вашій процедурі, індекс 4)
        if row and len(row) > 4:
            return row[4]  # Це і є U.Ссылка (Binary)
    return None