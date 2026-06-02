import datetime
import json


def get_orders_analytics_by_year(
    year: int, request_context_user, **kwargs
) -> str:
    """Отримує всі замовлення дилера за вказаний рік,
    розгортає вкладені замовлення з розрахунків,
    рахує суми, оплати, борги за місяцями, кількість замовлень,
    а також детальну статистику статусів (включаючи їхні ідентифікатори/номери).
    """
    # 1. Імпортуємо оригінальну синхронну функцію та утиліту визначення контрагента
    from backend.utils.contractor import resolve_contractor
    from records.views import get_orders_by_year_and_contractor

    try:
        # 2. Перевіряємо, чи переданий об'єкт є запитом чи користувачем
        class MockRequest:
            def __init__(self, user):
                self.user = user
                self.auth = getattr(user, "auth_type", None)
                self.data = {}
                self.GET = {}

        if hasattr(request_context_user, "user"):
            request_obj = request_context_user
        else:
            request_obj = MockRequest(user=request_context_user)

        # 3. Визначаємо контрагента
        try:
            contractor_bin, contractor_guid_str = resolve_contractor(
                request_obj, allow_admin=False
            )
        except (PermissionError, ValueError) as err:
            return json.dumps({"error": f"Помилка авторизації: {str(err)}"}, ensure_ascii=False)

        if not contractor_bin:
            return json.dumps(
                {"error": "Не вдалося визначити контрагента для поточного користувача."},
                ensure_ascii=False
            )

        # 4. Викликаємо оригінальну функцію
        raw_data = get_orders_by_year_and_contractor(year, contractor_bin)

        if not raw_data:
            return json.dumps(
                {
                    "message": f"За {year} рік замовлень не знайдено.",
                    "analytics_result": None,
                },
                ensure_ascii=False
            )

        # Перетворюємо дані на список, якщо прийшов словник (calcs_dict)
        calculations = raw_data.values() if isinstance(raw_data, dict) else raw_data

        monthly_stats = {}
        status_registry = {}  # Тимчасовий реєстр для мапінгу статусів на ID, якщо їх немає в БД
        status_counter = 1
        
        # Загальні фінансові показники за рік
        total_year_sum = 0
        total_year_paid = 0
        total_year_debt = 0
        total_orders_count = 0

        # 5. Проходимо по кожному розрахунку (Calculation)
        for calc in calculations:
            orders = calc.get("orders", [])
            if not orders:
                continue

            # 6. Проходимо по кожному замовленню всередині розрахунку
            for order in orders:
                # Визначаємо дату замовлення
                calc_date_str = order.get("date") or order.get("dateRaw") or calc.get("date")
                
                month_idx = "Невідомо"
                if calc_date_str and isinstance(calc_date_str, str):
                    try:
                        if "-" in calc_date_str:
                            month_idx = str(int(calc_date_str.split("-")[1]))
                        elif "." in calc_date_str:
                            month_idx = str(int(calc_date_str.split(".")[1]))
                    except Exception:
                        pass

                # Фінансові метрики поточного замовлення
                calc_sum = float(order.get("amount") or 0)
                calc_paid = float(order.get("paid") or 0)
                calc_debt = max(0.0, calc_sum - calc_paid)
                
                # Обробка статусу та його номера/ID
                status_name = order.get("status") or "Без статусу"
                
                # Намагаємося взяти ID з бази, якщо воно там з'явиться (наприклад status_id, stage_id, status_number)
                status_id = order.get("status_id") or order.get("stage_id") or order.get("status_number")
                
                if not status_id:
                    # Якщо ID немає в структурі, генеруємо порядковий номер динамічно для ШІ
                    if status_name not in status_registry:
                        status_registry[status_name] = {
                            "id": status_counter,
                            "count": 0
                        }
                        status_counter += 1
                    status_id = status_registry[status_name]["id"]
                else:
                    if status_name not in status_registry:
                        status_registry[status_name] = {
                            "id": status_id,
                            "count": 0
                        }

                # Збільшуємо лічильник кількості замовлень у цьому статусі
                status_registry[status_name]["count"] += 1

                # Агрегуємо фінанси помісячно
                if month_idx not in monthly_stats:
                    monthly_stats[month_idx] = {"sum": 0, "paid": 0, "debt": 0, "count": 0}
                
                monthly_stats[month_idx]["sum"] += calc_sum
                monthly_stats[month_idx]["paid"] += calc_paid
                monthly_stats[month_idx]["debt"] += calc_debt
                monthly_stats[month_idx]["count"] += 1
                
                # Плюсуємо річні підсумки
                total_year_sum += calc_sum
                total_year_paid += calc_paid
                total_year_debt += calc_debt
                total_orders_count += 1

        if total_orders_count == 0:
            return json.dumps(
                {
                    "message": f"За {year} рік знайдено розрахунки, але в них немає оформлених замовлень.",
                    "analytics_result": None,
                },
                ensure_ascii=False
            )

        months_ua = {
            "1": "Січень", "2": "Лютий", "3": "Березень", "4": "Квітень",
            "5": "Травень", "6": "Червень", "7": "Липень", "8": "Серпень",
            "9": "Вересень", "10": "Жовтень", "11": "Листопад", "12": "Грудень",
        }

        formatted_months = []
        for m_idx, stats in sorted(
            monthly_stats.items(),
            key=lambda x: int(x[0]) if x[0].isdigit() else 99,
        ):
            name = months_ua.get(m_idx, m_idx)
            formatted_months.append(
                {
                    "name": name,
                    "value": round(stats["sum"], 2),      # Загальна сума замовлень
                    "paid": round(stats["paid"], 2),       # Оплачена сума за місяць
                    "debt": round(stats["debt"], 2),       # Залишок боргу за місяць
                    "count": stats["count"],               # Кількість замовлень
                }
            )

        # Перетворюємо реєстр статусів на зручний для ШІ структурований список об'єктів
        formatted_statuses = []
        for name, info in status_registry.items():
            formatted_statuses.append({
                "status_id": info["id"],
                "status_name": name,
                "count": info["count"]
            })
            
        # Сортуємо статуси за їхніми номерами для красивого виводу
        formatted_statuses = sorted(formatted_statuses, key=lambda x: x["status_id"])

        # Формуємо підсумковий звіт для ШІ
        analytics_result = {
            "year": year,
            "total_orders_count": total_orders_count,
            "total_orders_sum": round(total_year_sum, 2),
            "total_orders_paid": round(total_year_paid, 2),
            "total_orders_debt": round(total_year_debt, 2),
            "monthly_analytics": formatted_months,
            "statuses_distribution": formatted_statuses,  # Сюди тепер ідуть об'єкти з ID
        }

        return json.dumps(analytics_result, ensure_ascii=False)

    except Exception as e:
        return json.dumps({"error": f"Помилка при зборі аналітики: {str(e)}"}, ensure_ascii=False)


AVAILABLE_TOOLS = {
    "get_orders_analytics_by_year": get_orders_analytics_by_year
}

TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "get_orders_analytics_by_year",
            "description": "Отримати аналітику замовлень (суми, оплати, борги за місяцями, загальна кількість та статуси з їхніми ID) за конкретний рік.",
            "parameters": {
                "type": "object",
                "properties": {
                    "year": {
                        "type": "integer", 
                        "description": "Рік для аналізу замовлень (наприклад, 2025 або 2026)."
                    }
                },
                "required": ["year"]
            }
        }
    }
]