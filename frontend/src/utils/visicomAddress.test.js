import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visicomSuggestion } from './visicomAddress.js';
test('Visicom address maps longitude/latitude and house into order fields', () => {
 const result=visicomSuggestion({id:'ADR3KJH5U6M9XMHY8R',properties:{name:'1д',categories:'adr_address',settlement:'Банилів',street:'Гостинець',street_type:'вул.'},geo_centroid:{type:'Point',coordinates:[25.323917,48.350816]}});
 assert.equal(result.lat,48.350816);assert.equal(result.lon,25.323917);
 assert.deepEqual(result.fields,{city:'Банилів',street:'Гостинець',house:'1д'});
 assert.match(result.display_name,/Банилів.*Гостинець.*1д/);
 assert.equal([result.lat,result.lon].join(','),'48.350816,25.323917');
});
test('settlements and streets do not become house numbers; invalid geometry rejected', () => {
 const point={type:'Point',coordinates:[25,48]};
 assert.equal(visicomSuggestion({properties:{name:'Львів',categories:'adm_settlement'},geometry:point}).fields.city,'Львів');
 assert.equal(visicomSuggestion({properties:{name:'Гостинець',categories:'adr_street'},geometry:point}).fields.house,'');
 for(const coords of [[181,48],[25,91],['25',48],[]])assert.equal(visicomSuggestion({geo_centroid:{coordinates:coords}}),null);
 assert.equal(visicomSuggestion({geometry:{type:'Polygon',coordinates:[[25,48]]}}),null);
});

test('auto-select only a unique full building match, not streets or fuzzy house matches', async () => {
 const {exactVisicomAddress}=await import('./visicomAddress.js');
 const address=visicomSuggestion({id:'1',properties:{categories:'adr_address',settlement:'Банилів',street:'Гостинець',name:'1д'},geo_centroid:{coordinates:[25.323917,48.350816]}});
 assert.equal(exactVisicomAddress([address],'Чернівецька область, Банилів, вул. Гостинець, 1Д'),address);
 assert.equal(exactVisicomAddress([address],'Банилів, Гостинець'),null);
 assert.equal(exactVisicomAddress([address],'Банилів, Гостинець, 2д'),null);
 assert.equal(exactVisicomAddress([address],'Банилів, Гостинець, 11д'),null);
 assert.equal(exactVisicomAddress([address,{...address,place_id:'2'}],'Банилів, Гостинець, 1д'),null);
 assert.equal(exactVisicomAddress([{...address,category:'adr_street'}],'Банилів, Гостинець, 1д'),null);
});

