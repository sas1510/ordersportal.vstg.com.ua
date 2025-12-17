def guid_to_1c_bin(guid_str: str) -> bytes | None:
    if not guid_str:
        return None

    # remove hyphens
    hex_str = guid_str.replace("-", "").lower()

    if len(hex_str) != 32:
        raise ValueError("Invalid GUID length")

    # extract blocks
    A = hex_str[0:8]    # first 8 chars
    B = hex_str[8:12]   # next 4
    C = hex_str[12:16]  # next 4
    D = hex_str[16:20]  # next 4
    E = hex_str[20:32]  # last 12

    # correct 1C binary order:
    # [D][E][C][B][A]
    result_hex = D + E + C + B + A

    return bytes.fromhex(result_hex)



# backend/utils/GuidToBin1C.py
import uuid
from typing import Union

def guid_to_1c_bin_2(guid: Union[str, uuid.UUID]) -> bytes | None:
    if not guid:
        return None

    # 👉 якщо прийшов UUID — перетворюємо в строку
    if isinstance(guid, uuid.UUID):
        guid_str = str(guid)
    else:
        guid_str = str(guid)

    # remove hyphens
    hex_str = guid_str.replace("-", "").lower()

    if len(hex_str) != 32:
        raise ValueError(f"Invalid GUID length: {hex_str}")

    # extract blocks
    A = hex_str[0:8]    # 8
    B = hex_str[8:12]   # 4
    C = hex_str[12:16]  # 4
    D = hex_str[16:20]  # 4
    E = hex_str[20:32]  # 12

    # 🔹 ТВОЄ правило (як ти просила):
    # [D][E][C][B][A]
    result_hex = D + E + C + B + A

    return bytes.fromhex(result_hex)
