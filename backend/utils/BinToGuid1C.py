def bin_to_guid_1c(bin_value: bytes) -> str | None:
    if not bin_value or len(bin_value) != 16:
        return None

    part1 = bin_value[12:16].hex()   # bytes 13-16
    part2 = bin_value[10:12].hex()   # bytes 11-12
    part3 = bin_value[8:10].hex()    # bytes 9-10
    part4 = bin_value[0:2].hex()     # bytes 1-2
    part5 = bin_value[2:8].hex()     # bytes 3-8

    return f"{part1}-{part2}-{part3}-{part4}-{part5}".lower()
