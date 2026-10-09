import unittest
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch

from utils.user_action_audit import AdminActionAuditMiddleware, current_actor, audit_1c_response


class AdminAuditTests(unittest.TestCase):
    def request(self):
        return SimpleNamespace(path="/api/users/7/edit/", method="PUT", user=None,
                               resolver_match=SimpleNamespace(view_name="edit_user", kwargs={"user_id": 7}))

    def user(self, role="admin"):
        return SimpleNamespace(is_authenticated=True, pk=2, username="admin_test", role=role)

    def test_authentication_inside_view_and_correlation(self):
        request = self.request()
        def view(req):
            req.user = self.user()
            response = SimpleNamespace(status_code=200, elapsed=timedelta(milliseconds=125),
                request=SimpleNamespace(headers={"Query": "UpdateCalculation", "Authorization": "secret"}),
                json=lambda: {"success": True, "comment": "private"})
            audit_1c_response(response)
            return response
        with patch("utils.user_action_audit.emit_audit") as emit:
            AdminActionAuditMiddleware(view)(request)
        self.assertEqual(emit.call_count, 2)
        onec = emit.call_args_list[0].args[1]
        action = emit.call_args_list[1].args[1]
        self.assertEqual(onec["request_id"], action["request_id"])
        self.assertEqual(onec["username"], "admin_test")
        self.assertEqual(action["targets"], {"user_id": 7})
        self.assertNotIn("private", str(emit.call_args_list))
        self.assertNotIn("secret", str(emit.call_args_list))
        self.assertIsNone(current_actor())

    def test_other_roles_not_audited(self):
        def view(req):
            req.user = self.user("customer")
            return SimpleNamespace(status_code=200)
        with patch("utils.user_action_audit.emit_audit") as emit:
            AdminActionAuditMiddleware(view)(self.request())
        emit.assert_not_called()

    def test_failed_request(self):
        def view(req):
            req.user = self.user()
            return SimpleNamespace(status_code=403)
        with patch("utils.user_action_audit.emit_audit") as emit:
            AdminActionAuditMiddleware(view)(self.request())
        self.assertEqual(emit.call_args.args[1]["result"], "failed")
