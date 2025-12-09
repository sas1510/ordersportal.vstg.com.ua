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
