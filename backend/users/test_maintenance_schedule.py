from datetime import datetime, timezone
from unittest.mock import patch
import importlib.util
from pathlib import Path

from django.test import SimpleTestCase
spec = importlib.util.spec_from_file_location("maintenance_schedule_under_test", Path(__file__).resolve().parents[1] / "maintenance_mode.py")
maintenance = importlib.util.module_from_spec(spec)
spec.loader.exec_module(maintenance)


class MaintenanceScheduleTests(SimpleTestCase):
    def state_at(self, hour):
        with patch.object(maintenance.timezone, "now", return_value=datetime(2026, 10, 16, hour, tzinfo=timezone.utc)):
            return maintenance._build_state({"manual_enabled": False, "starts_at": "2026-10-16T18:00:00+03:00", "ends_at": "2026-10-16T19:00:00+03:00"})

    def test_before_start(self):
        self.assertFalse(self.state_at(14)["enabled"])

    def test_automatically_starts(self):
        self.assertTrue(self.state_at(15)["scheduled_enabled"])

    def test_automatically_ends(self):
        self.assertFalse(self.state_at(17)["enabled"])
