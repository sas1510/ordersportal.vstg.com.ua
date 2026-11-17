export const MODAL_DRAFT_TTL = 5 * 60 * 1000;
export function modalDraftKey(user, type, document = 'new') {
  const id = user?.id ?? user?.username;
  return id == null ? null : JSON.stringify(['modal-draft-v1', String(id), type, String(document)]);
}
export function draftRecord(value, now = Date.now()) { return {value, expiresAt:now + MODAL_DRAFT_TTL}; }
export function validDraft(record, now = Date.now()) { return record && Number.isFinite(record.expiresAt) && record.expiresAt > now ? record.value : null; }
export function createDraftRepository(storage) {
  let tail = Promise.resolve();
  const enqueue = action => { const pending = tail.then(action); tail = pending.catch(() => {}); return pending; };
  return {
    read: (key, now = Date.now()) => enqueue(async () => {
      const record = await storage.get(key);
      const value = validDraft(record, now);
      if (record && value === null) await storage.remove(key);
      return value;
    }),
    write: (key, value, now = Date.now()) => enqueue(() => storage.put(key, draftRecord(value, now))),
    remove: key => enqueue(() => storage.remove(key)),
  };
}
let database;
function openDatabase() {
  if (!database) database = new Promise((resolve,reject) => {
    if (!globalThis.indexedDB) { reject(new Error('Browser storage is unavailable')); return; }
    const request = indexedDB.open('portal-modal-drafts',1);
    request.onupgradeneeded = () => { const store = request.result.createObjectStore('drafts'); store.createIndex('expiresAt','expiresAt'); };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Draft storage is blocked'));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); database = null; };
      const tx = db.transaction('drafts','readwrite');
      const cursor = tx.objectStore('drafts').index('expiresAt').openCursor(IDBKeyRange.upperBound(Date.now()));
      cursor.onsuccess = () => { if (cursor.result) {cursor.result.delete();cursor.result.continue();} };
      tx.oncomplete = () => resolve(db); tx.onerror = () => reject(tx.error);
    };
  }).catch(error => { database = null; throw error; });
  return database;
}
async function transaction(mode, action) {
  const db = await openDatabase();
  return new Promise((resolve,reject) => {
    const tx = db.transaction('drafts',mode);const request=action(tx.objectStore('drafts'));
    tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error || new Error('Draft write aborted'));
  });
}
export const modalDrafts = createDraftRepository({
  get:key=>transaction('readonly',store=>store.get(key)),
  put:(key,value)=>transaction('readwrite',store=>store.put(value,key)),
  remove:key=>transaction('readwrite',store=>store.delete(key)),
});
