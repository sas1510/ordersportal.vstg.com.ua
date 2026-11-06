from pathlib import Path
p=Path('/var/www/html/ordersportal.vstg.com.ua/backend/records/measurement_orders.py');s=p.read_text(encoding='utf-8-sig')
s=s.replace('from .measurement_alerts import report_measurement_failure','from .measurement_alerts import report_measurement_failure\nfrom .measurement_activity import report_measurement_attempt, report_measurement_success')
anchor='    def finalize_response(self, request, response, *args, **kwargs):'
s=s.replace(anchor,'''    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        try:
            report_measurement_attempt(request)
        except Exception:
            logger.warning('Measurement attempt alert could not be queued')

'''+anchor)
s=s.replace('            report_measurement_failure(request, response)','            report_measurement_failure(request, response)\n            report_measurement_success(request, response)')
p.write_text(s,encoding='utf-8')
