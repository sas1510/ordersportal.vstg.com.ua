"""Author exceptions for calculation comment synchronization with 1C."""

# Nataliia Kostashek: compare the stored 1C binary identifier directly.
EXCLUDED_COMMENT_AUTHOR = bytes.fromhex("810E74867AD9D52511EBDD6B1D812DBA")


def should_sync_calculation_comment(author):
    return author is None or bytes(author) != EXCLUDED_COMMENT_AUTHOR
