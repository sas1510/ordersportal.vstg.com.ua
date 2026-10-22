import uuid
import warnings
import urllib.parse
from datetime import datetime, timedelta

import pandas as pd
import pyodbc
from sqlalchemy import create_engine


warnings.filterwarnings("ignore", category=UserWarning)


# ============================================================
# ПЕРІОД ПЕРЕНЕСЕННЯ
# ============================================================

DATE_FROM = datetime(2026, 9, 25)
DATE_TO_EXCLUSIVE = datetime(2026, 10, 21)  # Включає весь день 24.09.2026


# ============================================================
# ПІДКЛЮЧЕННЯ ДО ТРЬОХ СЕРВЕРІВ
# ============================================================

conn_params = {
    # Сервер 1: старий портал
    "srv1": (
        "DRIVER={SQL Server};"
        "SERVER=CorpWebSrv;"
        "DATABASE=ordersportal_db;"
        "UID=1s-connector;"
        "PWD=1qaZ2wsX3edC;"
        "TrustServerCertificate=yes;"
    ),

    # Сервер 2: база 1С
    "srv2": (
        "DRIVER={SQL Server};"
        r"SERVER=WST-SQL\WSTSQL;"
        "DATABASE=oknastyle_biV2;"
        "UID=sa;"
        "PWD=*Htlbcrf2oo6;"
        "TrustServerCertificate=yes;"
    ),

    # Сервер 3: новий портал
    "srv3": (
        "DRIVER={SQL Server};"
       r"SERVER=WST\WST;"
        "DATABASE=portal_db;"
        "UID=sa;"
        "PWD=*Htlbcrf2oo6;"
        "TrustServerCertificate=yes;"
    ),
}

# ============================================================
# СТВОРЕННЯ SQLALCHEMY ENGINE
# ============================================================

def get_engine(conn_str):
    quoted = urllib.parse.quote_plus(conn_str)

    return create_engine(
        f"mssql+pyodbc:///?odbc_connect={quoted}",
        pool_pre_ping=True,
        fast_executemany=True,
    )


# ============================================================
# ДОПОМІЖНІ ФУНКЦІЇ
# ============================================================

def normalize_binary(value):
    """Перетворює значення BINARY/VARBINARY у bytes."""

    if value is None:
        return None

    if isinstance(value, memoryview):
        return value.tobytes()

    if isinstance(value, bytearray):
        return bytes(value)

    if isinstance(value, bytes):
        return value

    return None


def normalize_text(value):
    """Нормалізація номера замовлення."""

    if value is None or pd.isna(value):
        return ""

    result = str(value).strip().lower()

    result = result.replace("\xa0", "")
    result = result.replace(" ", "")
    result = result.replace("\t", "")
    result = result.replace("\r", "")
    result = result.replace("\n", "")

    if result.endswith(".0"):
        result = result[:-2]

    return result


def normalize_contractor_code(value):
    """
    Нормалізація коду контрагента.

    Наприклад:
        000012345 -> 12345
        12345.0   -> 12345
        ' 12345 ' -> 12345
    """

    if value is None or pd.isna(value):
        return ""

    result = str(value).strip().lower()

    result = result.replace("\xa0", "")
    result = result.replace(" ", "")
    result = result.replace("\t", "")
    result = result.replace("\r", "")
    result = result.replace("\n", "")

    if result.endswith(".0"):
        result = result[:-2]

    if result.isdigit():
        result = result.lstrip("0")

        if result == "":
            result = "0"

    return result


def binary_to_key(value):
    """Перетворює BINARY(16) у ключ для зіставлення."""

    binary_value = normalize_binary(value)

    if binary_value is None:
        return ""

    return "0x" + binary_value.hex().upper()


def bin_to_guid_1c(bin_value):
    """Перетворення BINARY(16) 1С у стандартний GUID."""

    bin_value = normalize_binary(bin_value)

    if bin_value is None or len(bin_value) != 16:
        return None

    part1 = bin_value[12:16].hex()
    part2 = bin_value[10:12].hex()
    part3 = bin_value[8:10].hex()
    part4 = bin_value[0:2].hex()
    part5 = bin_value[2:8].hex()

    return (
        f"{part1}-{part2}-{part3}-{part4}-{part5}"
    ).lower()


def guid_to_bin_1c(guid_value):
    """
    Перетворення стандартного GUID менеджера
    у формат BINARY(16), який використовує 1С.
    """

    if guid_value is None or pd.isna(guid_value):
        return None

    try:
        parsed_guid = uuid.UUID(str(guid_value).strip())
        raw = parsed_guid.bytes

        return (
            raw[8:10]
            + raw[10:16]
            + raw[6:8]
            + raw[4:6]
            + raw[0:4]
        )

    except (ValueError, TypeError, AttributeError):
        return None


def has_value(value):
    """Перевіряє, чи значення не порожнє."""

    if value is None:
        return False

    try:
        return not pd.isna(value)
    except (TypeError, ValueError):
        return True


# ============================================================
# ПІДКЛЮЧЕННЯ
# ============================================================

engine1 = get_engine(conn_params["srv1"])
engine2 = get_engine(conn_params["srv2"])
engine3 = get_engine(conn_params["srv3"])


try:
    print("=" * 70)
    print("ПЕРЕНЕСЕННЯ ПОВІДОМЛЕНЬ")
    date_to_inclusive = DATE_TO_EXCLUSIVE - timedelta(days=1)
    print(
        "Період: "
        f"{DATE_FROM:%d.%m.%Y} — "
        f"{date_to_inclusive:%d.%m.%Y} включно"
    )
    print("=" * 70)

    # ========================================================
    # КРОК 1. МЕНЕДЖЕРИ ЗІ СТАРОГО ПОРТАЛУ
    # ========================================================

    print("\n1. Завантаження менеджерів із сервера 1...")

    query_managers = """
    SELECT
        [OrderPortalUser_Id],
        [Guid] AS [ManagerGuid]
    FROM [dbo].[Managers]
    WHERE [Guid] IS NOT NULL;
    """

    df_managers = pd.read_sql(
        query_managers,
        engine1,
    )

    df_managers["ManagerBin"] = (
        df_managers["ManagerGuid"].apply(guid_to_bin_1c)
    )

    mgr_dict = (
        df_managers
        .dropna(subset=["ManagerBin"])
        .set_index("OrderPortalUser_Id")["ManagerBin"]
        .to_dict()
    )

    print(f"Завантажено менеджерів: {len(df_managers)}")
    print(f"Менеджерів із коректним GUID: {len(mgr_dict)}")

    # ========================================================
    # КРОК 2. ПОВІДОМЛЕННЯ ЗІ СТАРОГО ПОРТАЛУ
    # ========================================================

    print("\n2. Завантаження повідомлень із сервера 1...")

    query_messages = """
    SELECT
        OM.[OrderId] AS [OldOrderId],
        OM.[MessageTime] AS [Timestamp],
        OM.[Message] AS [Text],
        OM.[MessageWriterId],

        O.[OrderNumber],
        O.[CustomerId],
        O.[ManagerId] AS [OrderManagerId],

        C.[CustomerContrCode],

        STUFF(
            (
                SELECT
                    ',' + CAST(
                        DB1S.[Db1SOrderNumber]
                        AS VARCHAR(MAX)
                    )
                FROM [dbo].[Db1SOrderNumbers] AS DB1S
                WHERE DB1S.[OrderId] = O.[OrderId]
                FOR XML PATH(''), TYPE
            ).value('.', 'VARCHAR(MAX)'),
            1,
            1,
            ''
        ) AS [Db1SOrderNumbers_List]

    FROM [dbo].[OrdersMessages] AS OM

    INNER JOIN [dbo].[Orders] AS O
        ON O.[OrderId] = OM.[OrderId]

    LEFT JOIN [dbo].[Customers] AS C
        ON C.[OrderPortalUser_Id] = O.[CustomerId]

    WHERE OM.[MessageTime] >= ?
      AND OM.[MessageTime] < ?
      AND OM.[Message] IS NOT NULL
      AND O.[StatusId] NOT IN (7, 17, 20, 21, 2, 1)

    ORDER BY
        OM.[MessageTime],
        OM.[OrderId];
    """

    df_messages = pd.read_sql(
        query_messages,
        engine1,
        params=(DATE_FROM, DATE_TO_EXCLUSIVE),
    )

    original_messages_count = len(df_messages)

    print(f"Завантажено повідомлень: {original_messages_count}")

    if df_messages.empty:
        print("За вибраний період повідомлень немає.")
        raise SystemExit

    # ========================================================
    # КРОК 3. КОНТРАГЕНТИ З БАЗИ 1С
    # ========================================================

    print("\n3. Завантаження контрагентів із сервера 2...")

    query_contractors = """
    SELECT DISTINCT
        C1C.[Ссылка] AS [ClientBin],

        LTRIM(
            RTRIM(
                CAST(C1C.[Код] AS NVARCHAR(100))
            )
        ) AS [CustomerContrCode]

    FROM [dbo].[Справочники.Контрагенты] AS C1C

    INNER JOIN
        [dbo].[РегистрыСведений.КатегорииОбъектов] AS RC
        ON RC.[Объект] = C1C.[Ссылка]

    INNER JOIN
        [dbo].[Справочники.КатегорииОбъектов] AS CAT
        ON CAT.[Ссылка] = RC.[Категория]

    WHERE CAT.[Наименование] =
          N'Пользователь Web - портала (VS)'

      AND C1C.[ПометкаУдаления] = 0x00;
    """

    df_contractors = pd.read_sql(
        query_contractors,
        engine2,
    )

    print(f"Завантажено контрагентів: {len(df_contractors)}")

    # ========================================================
    # КРОК 4. ЗАЯВКИ НА ПРОРАХУНОК
    # ========================================================

    print("\n4. Завантаження заявок на прорахунок...")

    query_direct = """
    SELECT
        [Ссылка] AS [ZayavkaRef],
        [НомерДилера],
        [Контрагент] AS [ContractorBin]

    FROM [dbo].[ЗаявкаНаПросчет]

    WHERE [Контрагент] IS NOT NULL;
    """

    df_direct = pd.read_sql(
        query_direct,
        engine2,
    )

    print(f"Завантажено заявок: {len(df_direct)}")

    # ========================================================
    # КРОК 5. ЗВ'ЯЗКИ ЗАМОВЛЕНЬ 1С ІЗ ЗАЯВКАМИ
    # ========================================================

    print(
        "\n5. Завантаження зв'язків "
        "заявок із замовленнями 1С..."
    )

    query_links = """
    SELECT
        ORD.[Номер] AS [Order1SNum],
        LINK.[Ссылка] AS [ZayavkaRef],
        ORD.[Контрагент] AS [ContractorBin]

    FROM
        [dbo].[ЗаявкаНаПросчет_ЗаказыПокупателей] AS LINK

    INNER JOIN
        [dbo].[Документы.ЗаказПокупателя] AS ORD
        ON LINK.[ЗаказПокупателя] = ORD.[Ссылка]

    WHERE ORD.[Контрагент] IS NOT NULL;
    """

    df_links = pd.read_sql(
        query_links,
        engine2,
    )

    print(f"Завантажено зв'язків: {len(df_links)}")

    # ========================================================
    # КРОК 6. ЗІСТАВЛЕННЯ КЛІЄНТІВ
    # ========================================================

    print(
        "\n6. Зіставлення клієнтів порталу "
        "з контрагентами 1С..."
    )

    print("\nПриклади кодів зі старого порталу:")

    print(
        df_messages["CustomerContrCode"]
        .dropna()
        .astype(str)
        .drop_duplicates()
        .head(20)
        .tolist()
    )

    print("\nПриклади кодів із бази 1С:")

    print(
        df_contractors["CustomerContrCode"]
        .dropna()
        .astype(str)
        .drop_duplicates()
        .head(20)
        .tolist()
    )

    print("\nТип поля старого порталу:")
    print(df_messages["CustomerContrCode"].dtype)

    print("\nТип поля 1С:")
    print(df_contractors["CustomerContrCode"].dtype)

    # Нормалізація кодів.
    df_messages["ContractorCodeKey"] = (
        df_messages["CustomerContrCode"]
        .apply(normalize_contractor_code)
    )

    df_contractors["ContractorCodeKey"] = (
        df_contractors["CustomerContrCode"]
        .apply(normalize_contractor_code)
    )

    print("\nКоди після нормалізації — старий портал:")

    print(
        df_messages[
            [
                "CustomerContrCode",
                "ContractorCodeKey",
            ]
        ]
        .drop_duplicates()
        .head(20)
        .to_string(index=False)
    )

    print("\nКоди після нормалізації — 1С:")

    print(
        df_contractors[
            [
                "CustomerContrCode",
                "ContractorCodeKey",
            ]
        ]
        .drop_duplicates()
        .head(20)
        .to_string(index=False)
    )

    portal_codes = set(
        df_messages.loc[
            df_messages["ContractorCodeKey"] != "",
            "ContractorCodeKey",
        ]
    )

    onec_codes = set(
        df_contractors.loc[
            df_contractors["ContractorCodeKey"] != "",
            "ContractorCodeKey",
        ]
    )

    common_codes = portal_codes.intersection(onec_codes)

    print("\nСтатистика кодів:")
    print(f"Унікальних кодів порталу: {len(portal_codes)}")
    print(f"Унікальних кодів 1С: {len(onec_codes)}")
    print(f"Спільних кодів: {len(common_codes)}")

    print("\nПриклади спільних кодів:")

    print(
        list(
            sorted(common_codes)
        )[:20]
    )

    print("\nПриклади кодів порталу, яких немає в 1С:")

    print(
        list(
            sorted(portal_codes - onec_codes)
        )[:20]
    )

    # Залишаємо одного контрагента для кожного коду.
    df_contractors_unique = (
        df_contractors[
            df_contractors["ContractorCodeKey"] != ""
        ]
        .drop_duplicates(
            subset=["ContractorCodeKey"],
            keep="first",
        )
    )

    messages_before_merge = len(df_messages)

    df_messages = df_messages.merge(
        df_contractors_unique[
            [
                "ContractorCodeKey",
                "ClientBin",
            ]
        ],
        how="inner",
        on="ContractorCodeKey",
        validate="many_to_one",
    )

    print(f"\nДо зіставлення: {messages_before_merge}")
    print(f"Після зіставлення: {len(df_messages)}")

    print(
        "Не знайдено контрагента:",
        messages_before_merge - len(df_messages),
    )

    if df_messages.empty:
        print(
            "\nУВАГА: жодного контрагента не зіставлено. "
            "Запис у portal_db не виконуватиметься."
        )

        raise SystemExit

    # ========================================================
    # КРОК 7. СЛОВНИК ПРЯМИХ ЗАЯВОК
    # ========================================================

    print("\n7. Формування словника прямих заявок...")

    df_direct["DealerNumberKey"] = (
        df_direct["НомерДилера"].apply(normalize_text)
    )

    df_direct["ContractorKey"] = (
        df_direct["ContractorBin"].apply(binary_to_key)
    )

    direct_lookup = {}

    for row in df_direct.itertuples(index=False):
        dealer_number_key = row.DealerNumberKey
        contractor_key = row.ContractorKey

        if not dealer_number_key:
            continue

        if not contractor_key:
            continue

        lookup_key = (
            dealer_number_key,
            contractor_key,
        )

        if lookup_key not in direct_lookup:
            direct_lookup[lookup_key] = normalize_binary(
                row.ZayavkaRef
            )

    print(f"Прямих ключів заявок: {len(direct_lookup)}")

    # ========================================================
    # КРОК 8. СЛОВНИК ЗВ'ЯЗКІВ ЧЕРЕЗ ЗАМОВЛЕННЯ 1С
    # ========================================================

    print(
        "\n8. Формування словника зв'язків "
        "через замовлення 1С..."
    )

    df_links["Order1SNumberKey"] = (
        df_links["Order1SNum"].apply(normalize_text)
    )

    df_links["ContractorKey"] = (
        df_links["ContractorBin"].apply(binary_to_key)
    )

    links_lookup = {}

    for row in df_links.itertuples(index=False):
        order_number_key = row.Order1SNumberKey
        contractor_key = row.ContractorKey

        if not order_number_key:
            continue

        if not contractor_key:
            continue

        lookup_key = (
            order_number_key,
            contractor_key,
        )

        if lookup_key not in links_lookup:
            links_lookup[lookup_key] = normalize_binary(
                row.ZayavkaRef
            )

    print(
        "Ключів через замовлення 1С:",
        len(links_lookup),
    )

    # ========================================================
    # КРОК 9. ОБРОБКА ПОВІДОМЛЕНЬ
    # ========================================================

    print("\n9. Обробка повідомлень...")

    results = []

    skipped_no_application = 0
    skipped_no_author = 0
    skipped_bad_guid = 0
    skipped_bad_timestamp = 0

    total_after_contractor_match = len(df_messages)

    for position, row in enumerate(
        df_messages.itertuples(index=False),
        start=1,
    ):
        client_bin = normalize_binary(row.ClientBin)

        if client_bin is None:
            skipped_no_author += 1
            continue

        contractor_key = binary_to_key(client_bin)
        portal_order_number = normalize_text(row.OrderNumber)

        # ----------------------------------------------------
        # Варіант 1:
        # OrderNumber старого порталу =
        # НомерДилера заявки на прорахунок
        # ----------------------------------------------------

        direct_key = (
            portal_order_number,
            contractor_key,
        )

        ref_bin = direct_lookup.get(direct_key)

        # ----------------------------------------------------
        # Варіант 2:
        # Пошук через Db1SOrderNumbers
        # ----------------------------------------------------

        if (
            ref_bin is None
            and has_value(row.Db1SOrderNumbers_List)
        ):
            order_numbers_1c = str(
                row.Db1SOrderNumbers_List
            ).split(",")

            for order_number_1c in order_numbers_1c:
                order_1c_key = normalize_text(
                    order_number_1c
                )

                if not order_1c_key:
                    continue

                link_key = (
                    order_1c_key,
                    contractor_key,
                )

                ref_bin = links_lookup.get(link_key)

                if ref_bin is not None:
                    break

        if ref_bin is None:
            skipped_no_application += 1
            continue

        # ----------------------------------------------------
        # Формування нового ChatId
        # ----------------------------------------------------

        related_guid = bin_to_guid_1c(ref_bin)

        if related_guid is None:
            skipped_bad_guid += 1
            continue

        new_chat_id = f"1_{related_guid}"

        # ----------------------------------------------------
        # Менеджер замовлення
        # ----------------------------------------------------

        order_manager_bin = normalize_binary(
            mgr_dict.get(row.OrderManagerId)
        )

        # ----------------------------------------------------
        # Автор та отримувач
        # ----------------------------------------------------

        if row.MessageWriterId == row.CustomerId:
            # Клієнт → менеджер
            final_author = client_bin
            final_recipient = order_manager_bin

        else:
            # Менеджер → клієнт
            writer_manager_bin = normalize_binary(
                mgr_dict.get(row.MessageWriterId)
            )

            final_author = (
                writer_manager_bin
                if writer_manager_bin is not None
                else order_manager_bin
            )

            final_recipient = client_bin

        if (
            final_author is None
            or final_recipient is None
        ):
            skipped_no_author += 1
            continue

        # ----------------------------------------------------
        # Дата повідомлення
        # ----------------------------------------------------

        try:
            timestamp_value = pd.to_datetime(
                row.Timestamp,
                errors="raise",
            )

            if timestamp_value.tzinfo is not None:
                timestamp_value = (
                    timestamp_value.tz_localize(None)
                )

            clean_timestamp = (
                timestamp_value.to_pydatetime()
            )

        except Exception:
            skipped_bad_timestamp += 1
            continue

        results.append({
            "NewChatId": new_chat_id,
            "Timestamp": clean_timestamp,
            "Text": row.Text,
            "RelatedObjectId": ref_bin,
            "AuthorId": final_author,
            "RecipientId": final_recipient,
        })

        if position % 5000 == 0:
            print(
                f"Оброблено {position} "
                f"із {total_after_contractor_match}..."
            )

    to_insert = pd.DataFrame(results)

    print("\nРЕЗУЛЬТАТ АНАЛІЗУ")
    print("-" * 55)
    print(
        f"Початково завантажено повідомлень: "
        f"{original_messages_count}"
    )
    print(
        f"Після зіставлення контрагентів: "
        f"{total_after_contractor_match}"
    )
    print(f"Готово до вставки: {len(to_insert)}")
    print(f"Не знайдено заявку: {skipped_no_application}")
    print(
        f"Не знайдено автора/отримувача: "
        f"{skipped_no_author}"
    )
    print(f"Некоректний GUID заявки: {skipped_bad_guid}")
    print(f"Некоректна дата: {skipped_bad_timestamp}")

    # ========================================================
    # КРОК 10. ЗАПИС У НОВИЙ PORTAL_DB
    # ========================================================

    if to_insert.empty:
        print("\nНемає повідомлень для вставки.")

    else:
        print("\n10. Запис у portal_db на сервері 3...")

        conn_final = pyodbc.connect(
            conn_params["srv3"],
            autocommit=False,
        )

        cursor = conn_final.cursor()

        insert_query = """
INSERT INTO [dbo].[ChatMessage] (
    [ChatId],
    [Timestamp],
    [Text],
    [IsRead],
    [IsSentVtg],
    [IsNotification],
    [EventType],
    [RelatedObjectId],
    [TransactionTypeID],
    [AuthorId],
    [RecipientId]
)
VALUES (
    ?,              -- ChatId
    ?,              -- Timestamp
    ?,              -- Text
    1,              -- IsRead
    1,              -- IsSentVtg
    0,              -- IsNotification
    1,              -- EventType
    ?,              -- RelatedObjectId
    1,              -- TransactionTypeID
    ?,              -- AuthorId
    ?               -- RecipientId
);
"""

        rows_inserted = 0
        rows_failed = 0
        rows_in_current_batch = 0
        batch_size = 500

        try:
            for row in to_insert.itertuples(index=False):
                try:
                    cursor.execute(
                        insert_query,
                        (
                            row.NewChatId,
                            row.Timestamp,
                            row.Text,
                            pyodbc.Binary(
                                row.RelatedObjectId
                            ),
                            pyodbc.Binary(
                                row.AuthorId
                            ),
                            pyodbc.Binary(
                                row.RecipientId
                            ),
                        ),
                    )

                    rows_inserted += 1
                    rows_in_current_batch += 1

                    if rows_in_current_batch >= batch_size:
                        conn_final.commit()
                        rows_in_current_batch = 0

                        print(
                            f"Записано {rows_inserted} "
                            f"із {len(to_insert)}..."
                        )

                except Exception as row_error:
                    rows_failed += 1

                    print(
                        "\nПомилка вставки:"
                        f"\nChatId: {row.NewChatId}"
                        f"\nTimestamp: {row.Timestamp}"
                        f"\nПомилка: {row_error}"
                    )

            # Зберігаємо останню неповну пачку.
            conn_final.commit()

        except Exception:
            conn_final.rollback()
            raise

        finally:
            cursor.close()
            conn_final.close()

        print("\nМІГРАЦІЮ ЗАВЕРШЕНО")
        print("-" * 55)
        print(
            "Період: "
            f"{DATE_FROM:%d.%m.%Y}–"
            f"{date_to_inclusive:%d.%m.%Y}"
        )
        print(f"Успішно вставлено: {rows_inserted}")
        print(f"Не вдалося вставити: {rows_failed}")


except SystemExit:
    pass

except Exception as error:
    print(f"\nПОМИЛКА: {error}")

finally:
    engine1.dispose()
    engine2.dispose()
    engine3.dispose()
