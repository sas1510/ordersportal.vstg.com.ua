from pathlib import Path
p=Path('/var/www/html/ordersportal.vstg.com.ua/backend/utils/portal_error_alerts.py');s=p.read_text(encoding='utf-8-sig');s=s.replace('import logging\n','import logging\nimport os\n',1)
a=s.index('        if response.status_code != 200:');b=s.index('    except Exception:',a)
s=s[:a]+'''        if response.status_code == 401:
            # Unauthorized means nothing was delivered. Use the existing portal bot
            # for this same configured personal chat; never retry ambiguous sends.
            fallback = (getattr(settings, 'NOTIFICATION_TELEGRAM_BOT_TOKEN', '')
                        or os.getenv('NOTIFICATION_TELEGRAM_BOT_TOKEN', ''))
            if fallback and fallback != token:
                response = requests.post(f"https://api.telegram.org/bot{fallback}/sendMessage", json={"chat_id": chat_id, "text": text, "disable_web_page_preview": True}, timeout=5)
        if response.status_code != 200:
            logger.warning("Portal error Telegram alert rejected (HTTP %s)", response.status_code)
            return False
        return True
'''+s[b:];p.write_text(s,encoding='utf-8')
