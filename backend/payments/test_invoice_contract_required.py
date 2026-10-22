import ast
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock
from django.test import SimpleTestCase
from rest_framework import status
from rest_framework.response import Response


class InvoiceContractRequiredTests(SimpleTestCase):
    def test_missing_or_blank_contract_is_rejected_before_1c(self):
        # Load the actual handler without importing legacy backend path aliases.
        tree = ast.parse(Path(__file__).with_name('views.py').read_text())
        handler = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == 'create_invoice_v2')
        handler.decorator_list = []
        send = Mock()
        namespace = {
            'Response': Response, 'status': status, 'send_to_1c': send,
            'finance_access_denied_response': lambda request: None,
            'get_maintenance_json_response': lambda: None,
        }
        exec(compile(ast.Module(body=[handler], type_ignores=[]), '<invoice-handler>', 'exec'), namespace)
        for value in (None, '', '  ', 123):
            with self.subTest(value=value):
                request = SimpleNamespace(data={'AdvanceContractGUID': value})
                response = namespace['create_invoice_v2'](request)
                self.assertEqual(response.status_code, 400)
                self.assertEqual(response.data['error'], 'Оберіть авансовий договір')
                send.assert_not_called()
