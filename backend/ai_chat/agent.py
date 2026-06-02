from openai import OpenAI

client = OpenAI()


def run_agent(user, system_prompt, messages):
    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": system_prompt},
            *messages
        ]
    )

    return response.choices[0].message.content