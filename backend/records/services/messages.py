# transactions/services/messages.py

from django.utils import timezone
from ..models import Message, TransactionType
from backend.utils.GuidToBin1C import guid_to_1c_bin


def save_message(
    *,
    transaction_type_id: int,
    base_transaction_guid: str | None,
    message_text: str,
    writer_guid: str | None = None
) -> Message:
    """
    Зберігає коментар до транзакції

    :param transaction_type_id: ID типу транзакції (TransactionType.ID)
    :param base_transaction_guid: GUID транзакції (UUID string з 1С)
    :param message_text: текст повідомлення
    :param writer_guid: GUID користувача (UUID string)
    :return: Message instance
    """

    transaction_type = TransactionType.objects.get(id=transaction_type_id)

    base_transaction_bin = (
        guid_to_1c_bin(base_transaction_guid)
        if base_transaction_guid else None
    )

    writer_bin = (
        guid_to_1c_bin(writer_guid)
        if writer_guid else None
    )

    message = Message.objects.create(
        transaction_type=transaction_type,
        base_transaction_id=base_transaction_bin,
        writer_id=writer_bin,
        message=message_text,
        created_at=timezone.now()
    )

    return message
