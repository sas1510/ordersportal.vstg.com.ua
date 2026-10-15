from celery import shared_task

@shared_task(name='notify_manager_of_funds_transfer')
def notify_manager_of_funds_transfer(submission_id):
    from .transfer_notifications import send_transfer_notification
    return send_transfer_notification(submission_id)

@shared_task(name='enqueue_pending_funds_transfer_notifications')
def enqueue_pending_funds_transfer_notifications():
    from .models import FundsTransferSubmission
    from .transfer_notifications import queue_transfer_notification
    ids = list(FundsTransferSubmission.objects.filter(manager_notification_status='pending').values_list('pk', flat=True)[:100])
    for submission_id in ids:
        queue_transfer_notification(submission_id)
    return len(ids)
