import { useEffect, useRef, useState } from 'react';
import { modalDrafts } from '../utils/modalDrafts';

export function useModalDraft({key, open, value, hasContent, onRestore}) {
  const [ready,setReady]=useState(false);
  const [error,setError]=useState(false);
  const readyKey=useRef(null), snapshot=useRef(null), cleared=useRef(false), restore=useRef(onRestore);
  restore.current=onRestore;
  const persist = (target=key) => {
    const entry=snapshot.current;
    if (!target || entry?.key!==target || cleared.current) return Promise.resolve();
    const operation=entry.hasContent ? modalDrafts.write(target,entry.value) : modalDrafts.remove(target);
    return operation.then(()=>setError(false)).catch(()=>setError(true));
  };
  const persistRef=useRef(persist);persistRef.current=persist;
  useEffect(()=>{
    readyKey.current=null;cleared.current=false;setReady(false);setError(false);
    if (!open || !key) return;
    let cancelled=false;
    modalDrafts.read(key).then(saved=>{
      if (!cancelled && saved!==null) restore.current(saved);
    }).catch(()=>{if(!cancelled)setError(true);}).finally(()=>{
      if (!cancelled){readyKey.current=key;setReady(true);}
    });
    const pagehide=()=>persistRef.current(key);
    window.addEventListener('pagehide',pagehide);
    return ()=>{
      cancelled=true;persistRef.current(key);readyKey.current=null;
      window.removeEventListener('pagehide',pagehide);
    };
  },[key,open]);
  useEffect(()=>{
    if (!open || !ready || readyKey.current!==key) return;
    if (cleared.current && !hasContent) return;
    cleared.current=false;snapshot.current={key,value,hasContent};
    persistRef.current(key);
  },[key,open,ready,value,hasContent]);
  const clear=()=>{
    cleared.current=true;snapshot.current=null;
    if(key)modalDrafts.remove(key).catch(()=>setError(true));
  };
  return {ready:!key || ready,error,persist:patch=>{
    const entry=snapshot.current;
    if(patch && entry?.key===key && entry.value && typeof entry.value === 'object') entry.value={...entry.value,...patch};
    return persistRef.current(key);
  },clear};
}
