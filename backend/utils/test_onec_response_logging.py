import json
import unittest

import requests

from utils.onec_response_logging import log_1c_response


class OneCResponseLoggingTests(unittest.TestCase):
    def check_response(self, body, status):
        response = requests.Response()
        response.status_code = status
        response.encoding = "utf-8"
        response._content = body.encode("utf-8")
        response.request = requests.Request(
            "POST", "https://example.invalid/1c",
            headers={"Query": "UpdateCalculation", "Authorization": "Basic secret"},
        ).prepare()
        with self.assertLogs("onec.responses", level="INFO") as captured:
            self.assertIs(log_1c_response(response), response)
        messages = [record.getMessage() for record in captured.records]
        reconstructed = "".join(json.loads(item.split(" body=", 1)[1]) for item in messages)
        self.assertEqual(reconstructed, body)
        for item in messages:
            self.assertIn("query=UpdateCalculation", item)
            self.assertIn(f"status={status}", item)
            self.assertNotIn("Basic secret", item)
        self.assertEqual(response.text, body)
        return messages

    def test_business_error_in_successful_http_response(self):
        self.check_response('{"success":false,"error":"Є замовлення"}', 200)

    def test_non_json_http_error(self):
        self.check_response("<html>Service unavailable</html>\n", 503)

    def test_long_response_is_logged_without_truncation(self):
        messages = self.check_response("Коментар\n" * 1000, 200)
        self.assertGreater(len(messages), 1)
        ids = {item.split(" id=", 1)[1].split(" ", 1)[0] for item in messages}
        self.assertEqual(len(ids), 1)

    def test_empty_response(self):
        self.check_response("", 204)
