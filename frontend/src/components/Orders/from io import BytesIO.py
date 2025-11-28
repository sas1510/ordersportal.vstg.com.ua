from io import BytesIO
from django.http import FileResponse

def read_smb_file(request, filename):
    username = "tetiana.flora"
    password = "902040Mm!"
    server_ip = "1c"
    server_name = "1c"
    client_name = "django"

    conn = SMBConnection(username, password, client_name, server_name, use_ntlm_v2=True)
    conn.connect(server_ip, 445)

    share = "1c_data"
    folder = "Заказ покупателя/5e3c1911-cad4-11f0-9cdb-4cd98f08e56d/86b41110-cae8-11f0-9cdb-4cd98f08e56d"

    file_obj = BytesIO()

    conn.retrieveFile(share, f"{folder}/{filename}", file_obj)
    file_obj.seek(0)

    return FileResponse(file_obj, as_attachment=True, filename=filename)
 