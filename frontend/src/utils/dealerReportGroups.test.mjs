import assert from 'node:assert/strict';
import test from 'node:test';
import { DEALER_REPORT_GROUP_OPTIONS, dealerGroupForSelection, isAggregateDealerSelection } from './dealerReportGroups.js';

test('groups are aggregate selections and never contractor GUIDs', () => {
  for (const option of DEALER_REPORT_GROUP_OPTIONS) {
    assert.equal(isAggregateDealerSelection(option.value), true);
    assert.equal(dealerGroupForSelection(option.value), option.group);
  }
  assert.equal(isAggregateDealerSelection('__ALL__'), true);
  assert.equal(dealerGroupForSelection('__ALL__'), null);
  assert.equal(isAggregateDealerSelection('11111111-2222-4333-8444-555555555555'), false);
  assert.equal(isAggregateDealerSelection(null), false);
});
