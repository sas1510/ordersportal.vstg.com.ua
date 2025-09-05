import base64
import hashlib
import hmac
from django.contrib.auth.hashers import BasePasswordHasher
from django.utils.crypto import constant_time_compare

class CSharpPBKDF2PasswordHasher(BasePasswordHasher):
    """
    Перевірка старих C# ASP.NET Identity PBKDF2 паролів (Base64, без SecurityStamp)
    """
    algorithm = "csharp_pbkdf2"

    def verify(self, password, encoded):
        decoded = base64.b64decode(encoded)
        if decoded[0] != 0x00:
            raise ValueError("Unsupported hash version")

        salt = decoded[1:17]            # 16 байт солі
        stored_subkey = decoded[17:49]  # 32 байти хешу

        derived_subkey = hashlib.pbkdf2_hmac('sha1', password.encode('utf-8'), salt, 1000, dklen=32)
        return constant_time_compare(stored_subkey, derived_subkey)

    def encode(self, password, salt=None):
        raise NotImplementedError("Цей хешер використовується тільки для перевірки старих паролів.")

    def safe_summary(self, encoded):
        return {"hash": encoded}
