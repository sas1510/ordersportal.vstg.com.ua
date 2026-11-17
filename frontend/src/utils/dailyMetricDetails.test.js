import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyApplicationSummary, NEW_APPLICATION_STATE, PROCESSING_APPLICATION_STATE} from './dailyApplicationSummary.js';
import {dailyMetricDetails} from './dailyMetricDetails.js';
const confirmed={guid:'o1',number:'01-1',posted:true,confirmed:true,stateGuid:'A',state:'Confirmed',constructions:2};
const payment={guid:'o2',number:'45-2',posted:true,confirmed:false,stateGuid:'B',state:'Payment',constructions:3};
const unposted={guid:'o3',number:'01-3',posted:false,confirmed:false,stateGuid:'C',state:'Draft',constructions:4};
const source=dailyApplicationSummary([
 {guid:'d1',name:'Dealer',applicationDetails:[
  {guid:'a1',number:'app1',stateGuid:NEW_APPLICATION_STATE,constructions:2,orders:[confirmed,payment],orderProcessingMinutes:{o1:12,o2:20}},
  {guid:'a2',number:'app2',stateGuid:PROCESSING_APPLICATION_STATE,constructions:3,orders:[confirmed,unposted],orderProcessingMinutes:{o1:7}},
 ]},
 {guid:'d2',name:'Dealer',applicationDetails:[{guid:'a3',number:'app3',stateGuid:NEW_APPLICATION_STATE,constructions:4,orders:[]}]},
]);
const times=new Map([['o1',7],['o2',20]]);
const make=(metricKey,filter)=>dailyMetricDetails({label:'Metric',metricKey,filter},source,times);

test('dealer highlight counts each GUID once; application highlight counts each document',()=>{
 const dealers=make('dealers');
 assert.equal(dealers.rows.filter(row=>row.dealer.counted).length,2);
 assert.match(dealers.rows[1].dealer.hint,/Уже/);
 assert.equal(make('applications').rows.filter(row=>row.application.counted).length,3);
 assert.equal(make('unformed',app=>!app.orders.length).rows.length,1);
 const processing=make('processing',app=>app.stateGuid===PROCESSING_APPLICATION_STATE);
 assert.equal(processing.rows.length,1);
 assert.equal(processing.rows[0].state.counted,true);
});

test('highlighted construction values match the sum, including distinct linked vs posted scope',()=>{
 for(const [metricKey,expected,field] of [['appConstructions',9,'constructions'],['orderConstructions',9,'constructions'],['confirmedConstructions',2,'constructions']]) {
  const model=make(metricKey);
  assert.equal(model.rows.reduce((sum,row)=>sum+(row[field].counted ? Number(row[field].value) : 0),0),expected);
 }
 assert.equal(make('orders').rows.length,2);
 assert.equal(make('confirmedOrders').rows.length,1);
 const status=dailyMetricDetails({kind:'orders',statusGuid:'B',label:'Payment'},source,times);
 assert.equal(status.rows.length,1);
 assert.equal(status.rows[0].number.value,'45-2');
 assert.equal(status.rows[0].state.counted,true);
});

test('average highlights exactly one shortest interval per order and explains divisor',()=>{
 const model=make('average');
 assert.equal(model.rows.length,2);
 assert.equal(model.rows.find(row=>row.id==='o1').application.value,'app2');
 assert.equal(model.rows.every(row=>row.minutes.counted),true);
 assert.match(model.summary,/27 хв ÷ 2 замовлень ≈ 14 хв/);
});
