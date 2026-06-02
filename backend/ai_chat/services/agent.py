# services/agent.py
import json
from openai import OpenAI
from .agent_tools import TOOLS_SCHEMA, AVAILABLE_TOOLS

client = OpenAI()

# Схема відповіді для фронтенду (Strict JSON Schema)
RESPONSE_FORMAT_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "orders_analytics_response",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "text_interpretation": {
                    "type": "string", 
                    "description": "Аналітична відповідь українською мовою. Короткі висновки про продажі, тренди, успішні місяці, статуси або відповіді на запитання користувача."
                },
                "has_chart": {"type": "boolean", "description": "Чи потрібно будувати графік?"},
                "chart_type": {"type": "string", "enum": ["bar", "line", "pie", "none"], "description": "Тип графіка."},
                "chart_data": {
                    "type": "array",
                    "description": "Масив для побудови графіка. Якщо це bar/line — name (місяць) та value (сума). Якщо pie — name (статус) та value (кількість). Якщо графіка немає, поверни порожній масив [].",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "value": {"type": "number"}
                        },
                        "required": ["name", "value"],
                        "additionalProperties": False
                    }
                },
               "order_numbers": {
    "type": "array",
    "description": "Список номерів замовлень за вказаний рік. Якщо замовлень немає, ОБОВ'ЯЗКОВО генеруй порожній масив [].",
    "items": {"type": "string"}
},
"debtor_orders": {
    "type": "array",
    "description": "Список замовлень із заборгованістю. Якщо боргів немає або замовлень за рік не знайдено, ОБОВ'ЯЗКОВО генеруй порожній масив [].",
    "items": {
        "type": "object",
        "properties": {
            "order_number": {"type": "string"},
            "order_date": {"type": "string"},
            "calc_number": {"type": "string"},
            "status": {"type": "string"},
            "currency": {"type": "string"},
            "total_amount": {"type": "number"},
            "paid_amount": {"type": "number"},
            "debt_amount": {"type": "number"}
        },
        "required": [
            "order_number", "order_date", "calc_number", 
            "status", "currency", "total_amount", "paid_amount", "debt_amount"
        ],
        "additionalProperties": False
    }
}
            },
            "required": [
                "text_interpretation", "has_chart", "chart_type", 
                "chart_data", "order_numbers", "debtor_orders"
            ],
            "additionalProperties": False
        }
    }
}

def run_agent(user, system_prompt, messages):
    api_messages = [{"role": "system", "content": system_prompt}] + messages

    # Крок 1: Перевірка потреби у виклику функцій
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=api_messages,
        tools=TOOLS_SCHEMA,
        tool_choice="auto",
        temperature=0
    )
    
    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls

    # Крок 2: Виконання інструментів
    if tool_calls:
        api_messages.append(response_message)

        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            if function_name == "get_orders_analytics_by_year":
                function_args["request_context_user"] = user
            
            function_to_call = AVAILABLE_TOOLS[function_name]
            tool_output = function_to_call(**function_args)

            api_messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": tool_output,
            })
        
        # Крок 3: Формування структурованої відповіді
        final_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=api_messages,
            response_format=RESPONSE_FORMAT_SCHEMA
        )
        return json.loads(final_response.choices[0].message.content)

    else:
        # Без виклику інструментів (звичайні репліки)
        final_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=api_messages,
            response_format=RESPONSE_FORMAT_SCHEMA
        )
        return json.loads(final_response.choices[0].message.content)