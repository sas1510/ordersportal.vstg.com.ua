import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyApplicationSummary, NEW_APPLICATION_STATE, PROCESSING_APPLICATION_STATE } from './dailyApplicationSummary.js';

test('counts unique dealers and submitted applications by application state, independent of order prefix', () => {
  const order = {guid:'o1', number:'45-123', posted:true, constructions:2};
  const first = {guid:'a1', number:'001', stateGuid:NEW_APPLICATION_STATE, constructions:2, orders:[]};
  const data = dailyApplicationSummary([
    {guid:'d1', name:'Same name', applicationDetails:[first, first, {guid:'a2', stateGuid:PROCESSING_APPLICATION_STATE.toLowerCase(), constructions:3, orders:[order]}]},
    {guid:'d2', name:'Same name', applicationDetails:[{guid:'a3', stateGuid:NEW_APPLICATION_STATE, constructions:4, orders:[order]}]},
    {guid:'d3', name:'No applications', applicationDetails:[]},
  ]);
  assert.equal(data.total.dealers,2);
  assert.equal(data.total.applications,3);
  assert.equal(data.total.constructions,9);
  assert.deepEqual(data.groups.map(g=>[g.dealers,g.applications]), [[1,1],[1,1],[1,1]]);
  assert.equal(data.formedOrders.length,1);
});

test('keeps other and unknown statuses and excludes unposted orders from formed count', () => {
  const data=dailyApplicationSummary([{guid:'d1',name:'Dealer',applicationDetails:[{guid:'a1',stateGuid:'other',constructions:1,orders:[{guid:'o1',number:'01-123',posted:false,constructions:1}]}]}]);
  assert.equal(data.groups[2].applications,1);
  assert.equal(data.total.applications,1);
  assert.equal(data.formedOrders.length,0);
  assert.equal(dailyApplicationSummary([]).total.dealers,0);
});
test('status totals and drill-down use the same unique posted orders', () => {
  const a = {guid:'o1', number:'01-1', posted:true, stateGuid:'status-a', state:'Confirmed', constructions:2};
  const b = {guid:'o2', number:'45-2', posted:true, stateGuid:'status-b', state:'Payment', constructions:3};
  const excluded = {guid:'o3', posted:false, stateGuid:'status-b', constructions:100};
  const result=dailyApplicationSummary([{guid:'d1',name:'Dealer',applicationDetails:[
    {guid:'a1',number:'app-1',orders:[a,b,excluded]}, {guid:'a2',number:'app-2',orders:[a]},
  ]}]);
  assert.equal(result.formedOrders.length,2);
  assert.equal(result.formedOrders.find(order=>order.guid==='o1').applications.length,2);
  assert.equal(result.formedOrderStatuses.reduce((sum,status)=>sum+status.documents,0),2);
  assert.equal(result.formedOrderStatuses.reduce((sum,status)=>sum+status.constructions,0),5);
  for (const status of result.formedOrderStatuses) {
    const details=result.formedOrders.filter(order=>order.stateGuid.toUpperCase()===status.guid);
    assert.equal(details.length,status.documents);
    assert.equal(details.reduce((sum,order)=>sum+order.constructions,0),status.constructions);
  }
});
