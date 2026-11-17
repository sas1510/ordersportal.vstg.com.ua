from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from .zkz_duplicates import find_zkz_duplicates, file_identity, uploaded_zkz_identity, check_zkz_duplicates, stored_file_size

class ZkzDuplicateTests(SimpleTestCase):
    def test_file_size_decoded_not_base64_length(self):
        self.assertEqual(uploaded_zkz_identity({"fileName":"test.zkz", "fileDataB64":"YWJj"}), ("test.zkz", 3))
        self.assertEqual(uploaded_zkz_identity({"fileName":"test.ZKZ", "fileDataB64":"data:application/octet-stream;base64,YWJj"}), ("test.ZKZ", 3))
        self.assertIsNone(uploaded_zkz_identity({"fileName":"test.pdf"}))
        with self.assertRaises(ValueError): file_identity("../x.zkz", 3)
        with self.assertRaises(ValueError): file_identity("x.zkz", True)

    @patch("records.zkz_duplicates.stored_file_size")
    @patch("records.zkz_duplicates.connection")
    def test_exact_size_and_scoped_rolling_seven_days(self, connection, size):
        cursor=connection.cursor.return_value.__enter__.return_value
        cursor.fetchall.return_value=[(b"a"*16,"01-123",datetime(4026,11,15,12),b"b"*16,"same.zkz"), (b"c"*16,"01-124",datetime(4026,11,15,12),b"d"*16,"same.zkz")]
        size.side_effect=[3,4]
        result=find_zkz_duplicates(b"x"*16,"same.zkz",3,datetime(2026,11,16,10,tzinfo=timezone.utc))
        self.assertEqual([x["number"] for x in result["matches"]],["01-123"])
        self.assertEqual(result["matches"][0]["date"],"2026-11-15T12:00:00")
        sql,params=cursor.execute.call_args.args
        self.assertNotIn("D._Posted",sql)
        self.assertIn("[_Document44856]",sql)
        self.assertNotIn("[_Document381]",sql)
        self.assertIn("F._Fld3500_RTRef=0x0000AF38",sql)
        self.assertIn("D._Fld44859RRef=%s",sql)
        self.assertEqual(params[0],b"x"*16)
        self.assertEqual(params[2]-params[1],timedelta(days=7))
        self.assertEqual(params[1],datetime(2026,11,9,12))

    @patch("records.zkz_duplicates.stored_file_size", side_effect=OSError("unavailable"))
    @patch("records.zkz_duplicates.connection")
    def test_missing_file_is_unchecked_not_false_match(self, connection, size):
        connection.cursor.return_value.__enter__.return_value.fetchall.return_value=[(b"a"*16,"01-123",datetime(2026,11,15),b"b"*16,"x.zkz")]
        result=find_zkz_duplicates(b"x"*16,"x.zkz",3)
        self.assertEqual(result["matches"],[])
        self.assertEqual(len(result["unchecked"]),1)

    @patch("records.zkz_duplicates.extract_1c_download_binary",return_value=b"abc")
    @patch("records.zkz_duplicates.connection")
    @patch("records.zkz_duplicates.smbclient")
    def test_sql_fallback_compares_decoded_file(self,smb,connection,decode):
        smb.stat.side_effect=OSError("missing")
        connection.cursor.return_value.__enter__.return_value.fetchone.return_value=(b"compressed value",)
        self.assertEqual(stored_file_size("a","cde510b7-0af5-11e3-99cd-002590633bb3","x.zkz"),3)
        decode.assert_called_once_with(b"compressed value",filename="x.zkz")

    @patch("records.zkz_duplicates.find_zkz_duplicates")
    @patch("records.zkz_duplicates.resolve_contractor", side_effect=PermissionError("denied"))
    def test_unauthorized_dealer_not_queried(self,resolve,find):
        request=APIRequestFactory().post("/check/",{"file_name":"x.zkz","file_size":3},format="json")
        force_authenticate(request,user=SimpleNamespace(is_authenticated=True))
        self.assertEqual(check_zkz_duplicates(request).status_code,403)
        find.assert_not_called()

class ZkzCreationGuardTests(SimpleTestCase):
    def request(self, confirmed=False, key=None):
        request=APIRequestFactory().post("/create/",{"items_count":1,"file":{"fileName":"x.zkz","fileDataB64":"YWJj"},"duplicate_zkz_confirmed":confirmed},format="json",**({"HTTP_IDEMPOTENCY_KEY":key} if key else {}))
        force_authenticate(request,user=SimpleNamespace(is_authenticated=True,username="test",role="customer",user_id_1C=b"x"*16))
        return request

    @patch("records.views.build_1c_payload",return_value={})
    @patch("records.views.find_zkz_duplicates",return_value={"matches":[{"number":"01-123"}],"unchecked":[]})
    def test_duplicate_returns_warning_without_sending_to_1c(self,find,build):
        from .views import CreateCalculationViewSet
        with patch.object(CreateCalculationViewSet,"_send_to_1c") as send:
            response=CreateCalculationViewSet.as_view({"post":"create"})(self.request())
        self.assertEqual(response.status_code,409)
        self.assertEqual(response.data["code"],"duplicate_zkz")
        send.assert_not_called()

    @patch("records.views.build_1c_payload",return_value={})
    @patch("records.views.find_zkz_duplicates")
    @patch("records.views.calculation_idempotency_payload_hash",return_value="same")
    @patch("records.views.CalculationIdempotencyRecord.objects")
    def test_successful_retry_returns_saved_result_before_duplicate_check(self,records,hash,find,build):
        from .views import CreateCalculationViewSet
        records.get_or_create.return_value=(SimpleNamespace(status="succeeded",response_body={"success":True},payload_hash="same",calculation_guid="saved"),False)
        response=CreateCalculationViewSet.as_view({"post":"create"})(self.request(key="cde510b7-0af5-11e3-99cd-002590633bb3"))
        self.assertEqual(response.status_code,201)
        find.assert_not_called()

    @patch("records.views.build_1c_payload",return_value={})
    @patch("records.views.find_zkz_duplicates")
    def test_explicit_confirmation_allows_sending(self,find,build):
        from .views import CreateCalculationViewSet, ValidationError
        with patch.object(CreateCalculationViewSet,"_send_to_1c",side_effect=ValidationError("Test stop before external request")) as send:
            response=CreateCalculationViewSet.as_view({"post":"create"})(self.request(confirmed=True))
        self.assertEqual(response.status_code,502)
        send.assert_called_once()
        find.assert_not_called()
