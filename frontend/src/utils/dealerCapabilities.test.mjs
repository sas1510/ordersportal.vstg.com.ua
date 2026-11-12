import assert from 'node:assert/strict';
import { isRiminiDealer, RIMINI_CONTRACTOR_GUID } from './dealerCapabilities.js';
assert.equal(isRiminiDealer({user_id_1c: RIMINI_CONTRACTOR_GUID}), true);
assert.equal(isRiminiDealer({user_id_1c: RIMINI_CONTRACTOR_GUID.toUpperCase()}), true);
assert.equal(isRiminiDealer({user_id_1c: '00000000-0000-0000-0000-000000000001', name:'Rimini'}), false);
assert.equal(isRiminiDealer(null), false);
console.log('Rimini capability scope uses contractor GUID, not display name');
