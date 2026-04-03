from locust import HttpUser, task, between
import uuid

class OrdersPortalUser(HttpUser):
    # Імітуємо реальну поведінку: юзер заходить і "тупить" 1-5 секунд перед наступним кліком
    wait_time = between(1, 5)

    def on_start(self):
        """ Виконується при старті кожного віртуального юзера (Логін) """
        # Якщо у вас обов'язкова авторизація, тут треба отримати токен.
        # Для тестів можна захардкодити токен існуючого юзера 'Ruta'
        self.headers = {'Authorization': 'Bearer ВАШ_JWT_ACCESS_TOKEN_ТУТ'}

    @task(1)
    def test_slow_partner_debts(self):
        """ Тестуємо найповільніший запит (4.7с) """
        self.client.get("/api/partner-debts/", headers=self.headers)

    @task(2)
    def test_balance(self):
        """ Запит балансу (2.1с) """
        self.client.get("/api/balance/", headers=self.headers)

    @task(5)
    def test_notifications_count(self):
        """ Найчастіший запит — лічильник сповіщень """
        self.client.get("/api/notifications/count/", headers=self.headers)

    @task(3)
    def test_my_profile(self):
        """ Легкий запит для перевірки загальної чутливості """
        self.client.get("/api/user/me/", headers=self.headers)