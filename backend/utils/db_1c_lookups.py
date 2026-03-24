from django.db import connection

def get_author_name_from_db(writer_id_bin):
    """
    Викликає збережену процедуру GetAuthorByWriterID для отримання імені автора з 1С.
    """
    if not writer_id_bin:
        return "Невідомий користувач"
        
    try:
        with connection.cursor() as cursor:
            # Викликаємо процедуру SQL Server
            cursor.execute("EXEC [dbo].[GetAuthorByWriterID] @WriterID=%s", [writer_id_bin])
            row = cursor.fetchone()
            if row:
                # Повертаємо AuthorName (індекс 2 згідно з процедурою)
                return row[2] 
    except Exception as e:
        print(f"Error calling GetAuthorByWriterID: {e}")
        
    return "Невідомий користувач"


from django.db import connection

def get_document_number_by_guid(guid_bin, transaction_type_id):
    """
    Викликає GetDocumentDisplayNumber для отримання номера з 1С.
    """
    if not guid_bin:
        return "X"

    try:
        with connection.cursor() as cursor:

            cursor.execute("EXEC [dbo].[GetDocumentDisplayNumber] @Guid=%s, @TransactionType=%s", 
                           [guid_bin, int(transaction_type_id)])
            row = cursor.fetchone()
            if row:
                return str(row[0]).strip()
    except Exception as e:
        # Логуємо помилку
        print(f"Error calling GetDocumentDisplayNumber: {e}")
        
    return "X"



def get_document_year_by_guid(guid_bin, transaction_type_id):
    """
    Викликає GetDocumentYear для отримання року створення документа в 1С.
    Це допоможе фронтенду правильно перемикати фільтр "Рік" при переході зі сповіщень.
    """
    if not guid_bin:
        return None

    try:

        t_id = int(transaction_type_id)
        
        with connection.cursor() as cursor:

            cursor.execute("EXEC [dbo].[GetDocumentYear] @Guid=%s, @TransactionType=%s", 
                           [guid_bin, t_id])
            row = cursor.fetchone()
            if row:

                return int(row[0])
    except Exception as e:
        print(f"Error calling GetDocumentYear: {e}")
        
    return None