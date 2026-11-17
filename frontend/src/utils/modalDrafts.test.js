import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDraftRepository, modalDraftKey, MODAL_DRAFT_TTL } from './modalDrafts.js';
function setup(){
 const data=new Map();
 const storage={get:async key=>data.get(key),put:async(key,value)=>data.set(key,structuredClone(value)),remove:async key=>data.delete(key)};
 return {data,repo:createDraftRepository(storage)};
}
test('draft is restored within five minutes and removed at the expiry boundary',async()=>{
 const {repo,data}=setup();await repo.write('order',{comment:'draft'},1000);
 assert.deepEqual(await repo.read('order',1000+MODAL_DRAFT_TTL-1),{comment:'draft'});
 assert.equal(await repo.read('order',1000+MODAL_DRAFT_TTL),null);assert.equal(data.size,0);
});
test('closing renews retention; deleting a draft wins over pending autosaves',async()=>{
 const {repo}=setup();await repo.write('order',{number:'first'},0);
 await repo.write('order',{number:'edited'},290000);
 assert.deepEqual(await repo.read('order',500000),{number:'edited'});
 const pending=repo.write('order',{number:'must not come back'},500001);
 const removed=repo.remove('order');await Promise.all([pending,removed]);assert.equal(await repo.read('order',500002),null);
});
test('accounts, documents, create/edit and comment drafts remain isolated',async()=>{
 const {repo}=setup();const a=modalDraftKey({id:1},'calculation','new');const b=modalDraftKey({id:2},'calculation','new');const c=modalDraftKey({id:1},'comment','1_docA');const d=modalDraftKey({id:1},'comment','1_docB');const e=modalDraftKey({id:1},'calculation','docA');
 assert.equal(new Set([a,b,c,d,e]).size,5);await repo.write(a,'draft',1);
 for(const key of [b,c,d,e])assert.equal(await repo.read(key,2),null);
 assert.equal(modalDraftKey(null,'comment','doc'),null);
});
test('draft payload keeps address, attachments and photo blobs instead of losing binary contents',async()=>{
 const {repo}=setup();const value={file:new Blob(['PDF'],{type:'application/pdf'}),photos:[{file:new Blob(['image'])}],customAddress:{lat:48.35,lng:25.32},comment:'notes'};
 await repo.write('order',value,0);const loaded=await repo.read('order',1);
 assert.equal(await loaded.file.text(),'PDF');assert.equal(await loaded.photos[0].file.text(),'image');assert.deepEqual(loaded.customAddress,value.customAddress);
});
