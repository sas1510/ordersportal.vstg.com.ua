import logging
from queue import Queue
from logging.handlers import QueueHandler, QueueListener

import logging_loki


log_queue = Queue(-1)

formatter = logging.Formatter(
    '%(message)s'
)

loki_handler = logging_loki.LokiHandler(
    url="http://192.168.200.101:3100/loki/api/v1/push",
    tags={
        "application": "viknastyle-portal",
        "env": "prod",
    },
    version="1",
)

# ВАЖЛИВО
loki_handler.setFormatter(formatter)
loki_handler.setLevel(logging.INFO)

queue_handler = QueueHandler(log_queue)

listener = QueueListener(
    log_queue,
    loki_handler,
    respect_handler_level=True
)

listener.start()

logger = logging.getLogger("viknastyle")

logger.setLevel(logging.INFO)

logger.propagate = False

# щоб не дублювались handlers при reload
if not logger.handlers:
    logger.addHandler(queue_handler)



# import logging
# from queue import Queue
# from logging.handlers import QueueHandler, QueueListener

# import logging_loki

# log_queue = Queue(-1)

# loki_handler = logging_loki.LokiHandler(
#     url="http://192.168.200.101:3100/loki/api/v1/push",
#     tags={
#         "application": "viknastyle-portal",
#         "env": "prod",
#     },
#     version="1",
# )

# queue_handler = QueueHandler(log_queue)

# listener = QueueListener(log_queue, loki_handler)
# listener.start()

# # кастомний logger
# logger = logging.getLogger("viknastyle")

# logger.setLevel(logging.INFO)

# # щоб не дублювались логи
# logger.propagate = False

# # додаємо async handler
# logger.addHandler(queue_handler)