from types import SimpleNamespace
from unittest.mock import patch
from django.test import SimpleTestCase
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.test import APIRequestFactory, force_authenticate
from records.measurement_order_target import resolve_measurement_order_target, measurement_order_target
from utils.BinToGuid1C import bin_to_guid_1c


class MeasurementOrderTargetTests(SimpleTestCase):
    def setUp(self):
        self.guid = b"x" * 16
        self.dealer = SimpleNamespace(pk=119,user_id_1C=self.guid,full_name="Dealer",username="dealer")
        self.actor = SimpleNamespace(role="admin",is_authenticated=True)

    @patch("records.measurement_order_target.resolve_contractor")
    @patch("records.measurement_order_target.CustomUser")
    def test_resolves_only_the_requested_dealer_through_normal_scope(self,users,resolve):
        users.objects.filter.return_value.first.return_value=self.dealer
        resolve.return_value=(self.guid,bin_to_guid_1c(self.guid))
        result=resolve_measurement_order_target(self.actor,119)
        self.assertEqual(result["contractor_guid"],bin_to_guid_1c(self.guid))
        self.assertEqual(result["measurement_dealer"],119)
        self.assertEqual(resolve.call_args.args[0].GET["contractor_guid"],result["contractor_guid"])
        self.assertEqual(users.objects.filter.call_args.kwargs["pk"],119)

    @patch("records.measurement_order_target.resolve_contractor")
    @patch("records.measurement_order_target.CustomUser")
    def test_another_dealer_cannot_resolve_someone_elses_measurement(self,users,resolve):
        users.objects.filter.return_value.first.return_value=self.dealer
        resolve.return_value=(b"y"*16,bin_to_guid_1c(b"y"*16))
        with self.assertRaises(PermissionDenied):resolve_measurement_order_target(self.actor,119)

    @patch("records.measurement_order_target.resolve_contractor",side_effect=PermissionError("Outside portfolio"))
    @patch("records.measurement_order_target.CustomUser")
    def test_staff_portfolio_restriction_is_preserved(self,users,resolve):
        users.objects.filter.return_value.first.return_value=self.dealer
        with self.assertRaises(PermissionDenied):resolve_measurement_order_target(self.actor,119)

    @patch("records.measurement_order_target.CustomUser")
    def test_missing_dealer_never_falls_back_to_all_dealers(self,users):
        users.objects.filter.return_value.first.return_value=None
        with self.assertRaises(NotFound):resolve_measurement_order_target(self.actor,119)

    def test_bad_dealer_id_is_rejected_before_any_query(self):
        request=APIRequestFactory().get("/api/order/measurement-target/",{"measurement_dealer":"bad"})
        force_authenticate(request,user=self.actor)
        self.assertEqual(measurement_order_target(request).status_code,400)

    @patch("records.measurement_order_target.CustomUser")
    def test_real_scope_resolver_allows_only_own_contractor(self,users):
        users.objects.filter.return_value.first.return_value=self.dealer
        own_actor=SimpleNamespace(role="customer",user_id_1C=self.guid)
        self.assertEqual(resolve_measurement_order_target(own_actor,119)["measurement_dealer"],119)
        other_actor=SimpleNamespace(role="customer",user_id_1C=b"y"*16)
        with self.assertRaises(PermissionDenied):resolve_measurement_order_target(other_actor,119)
