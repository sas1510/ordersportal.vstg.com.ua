from datetime import datetime
from unittest.mock import Mock, patch
from django.test import SimpleTestCase
from .order_chat_summary import _hashable_binary_params, get_order_boundary_messages


class OrderChatSummaryTests(SimpleTestCase):
    def test_binary_parameters_are_hashable_after_field_preparation(self):
        execute = Mock(side_effect=lambda sql, params, many, context: set((value, type(value)) for value in params))
        result = _hashable_binary_params(execute, 'GROUP BY', [bytearray(b'a'), memoryview(b'b'), 1, None], False, {})
        self.assertEqual(result, {(b'a', bytes), (b'b', bytes), (1, int), (None, type(None))})

    def test_historical_high_id_does_not_replace_latest_comment(self):
        with patch('records.order_chat_summary.connections') as connections:
            cursor = connections.__getitem__.return_value.cursor.return_value.__enter__.return_value
            cursor.fetchall.return_value = [
                (220000,b'a','Historical',datetime(2026,1,1)),
                (210000,b'a','Latest',datetime(2026,10,1)),
            ]
            result = get_order_boundary_messages([bytearray(b'a'),memoryview(b'a')])
            sql, params = cursor.execute.call_args.args
            self.assertEqual(params,[b'a'])
            self.assertIn('ORDER BY [Timestamp] DESC, id DESC',sql)
            self.assertIn('ORDER BY [Timestamp], id',sql)
            self.assertNotIn('GROUP BY',sql)
        self.assertEqual([row['id'] for row in result],[210000,220000])

    def test_empty_latest_message_is_preserved_and_ties_are_deterministic(self):
        with patch('records.order_chat_summary.connections') as connections:
            cursor=connections.__getitem__.return_value.cursor.return_value.__enter__.return_value
            cursor.fetchall.return_value=[(1,b'a','First',datetime(2026,1,1)),(2,b'a','',datetime(2026,1,1))]
            result=get_order_boundary_messages([b'a'])
        self.assertEqual([row['id'] for row in result],[2,1])
        self.assertEqual(result[0]['text'],'')

    def test_empty_list_does_not_query_database(self):
        with patch('records.order_chat_summary.connections') as connections:
            self.assertEqual(get_order_boundary_messages([]),[])
            connections.__getitem__.assert_not_called()

    def test_large_lists_keep_bound_parameters_below_sql_server_limit(self):
        with patch('records.order_chat_summary.connections') as connections:
            cursor=connections.__getitem__.return_value.cursor.return_value.__enter__.return_value
            cursor.fetchall.return_value=[]
            get_order_boundary_messages([n.to_bytes(16,'big') for n in range(2105)])
            self.assertEqual([len(call.args[1]) for call in cursor.execute.call_args_list],[800,800,505])
