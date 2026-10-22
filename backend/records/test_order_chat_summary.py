from unittest.mock import Mock, patch
from django.test import SimpleTestCase
from .order_chat_summary import _hashable_binary_params, get_order_boundary_messages


class OrderChatSummaryTests(SimpleTestCase):
    def test_binary_parameters_are_hashable_after_field_preparation(self):
        execute = Mock(side_effect=lambda sql, params, many, context: set((value, type(value)) for value in params))
        result = _hashable_binary_params(execute, 'GROUP BY', [bytearray(b'a'), memoryview(b'b'), 1, None], False, {})
        self.assertEqual(result, {(b'a', bytes), (b'b', bytes), (1, int), (None, type(None))})

    def test_bytearray_ids_are_normalized_before_deduplication(self):
        with patch('records.order_chat_summary.ChatMessage.objects.filter') as query:
            query.return_value.order_by.return_value.values.return_value.annotate.return_value = []
            get_order_boundary_messages([bytearray(b'a'), memoryview(b'a')])
        self.assertEqual(query.call_args.kwargs['related_object_id__in'], [b'a'])

    def test_empty_list_does_not_query_database(self):
        with patch('records.order_chat_summary.ChatMessage.objects.filter') as query:
            self.assertEqual(get_order_boundary_messages([]), [])
            query.assert_not_called()

    def test_fetches_only_boundaries_and_preserves_empty_latest_comment(self):
        with patch('records.order_chat_summary.ChatMessage.objects.filter') as query:
            query.return_value.order_by.return_value.values.return_value.annotate.return_value = [
                {'related_object_id': b'a', 'first_id': 1, 'last_id': 100},
                {'related_object_id': b'b', 'first_id': 4, 'last_id': 4},
            ]
            query.return_value.values.return_value = [
                {'id': 1, 'related_object_id': b'a', 'text': 'First'},
                {'id': 4, 'related_object_id': b'b', 'text': 'Only'},
                {'id': 100, 'related_object_id': b'a', 'text': ''},
            ]
            result = get_order_boundary_messages([b'a', b'b', b'a'])
        self.assertEqual([row['id'] for row in result], [100, 4, 1])
        self.assertEqual(result[0]['text'], '')
        self.assertEqual(query.call_args_list[0].kwargs['related_object_id__in'], [b'a', b'b'])
        self.assertEqual(query.call_args_list[1].kwargs['pk__in'], {1, 4, 100})

    def test_large_list_stays_below_sql_server_parameter_limit(self):
        with patch('records.order_chat_summary.ChatMessage.objects.filter') as query:
            query.return_value.order_by.return_value.values.return_value.annotate.return_value = []
            get_order_boundary_messages([number.to_bytes(16, 'big') for number in range(2105)])
        self.assertEqual([len(call.kwargs['related_object_id__in']) for call in query.call_args_list], [800, 800, 505])
