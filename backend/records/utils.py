from django.db import connections
from backend.utils.BinToGuid1C import bin_to_guid_1c

def get_author_from_1c(writer_id_bin):
    """
    Повертає автора з 1С через процедуру GetAuthorByWriterID
    або None
    """
    if not writer_id_bin:
        return None

    with connections["default"].cursor() as cursor:
        cursor.execute(
            "EXEC dbo.GetAuthorByWriterID @WriterID = %s",
            [writer_id_bin],
        )
        row = cursor.fetchone()

    if not row:
        return None

    writer_id, author_type, author_name, extra_info = row

    return {
        "id_1c": bin_to_guid_1c(writer_id),
        "type": author_type,
        "full_name": author_name,
        "extra": extra_info,
    }
