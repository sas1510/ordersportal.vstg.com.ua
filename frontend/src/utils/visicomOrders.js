import { visicomSuggestion } from "./visicomAddress";
import axios from '../api/axios';
let sessionKey = '';
export const getVisicomSessionKey = () => sessionKey;
export const setVisicomSessionKey = key => { sessionKey = String(key || '').trim(); };
export async function searchVisicom(text, language, signal) {
  const { data } = await axios.post('/integrations/visicom/orders/geocode/', {text,lang:language,key:sessionKey}, {signal});
  return (data.features || []).map(visicomSuggestion).filter(Boolean);
}
export async function reverseVisicom(lat, lng, language, signal) {
  const { data } = await axios.post('/integrations/visicom/orders/geocode/', {mode:'reverse',lat,lng,lang:language,key:sessionKey}, {signal});
  return (data.features || []).map(visicomSuggestion).filter(Boolean)[0] || null;
}
export async function visicomConfig(signal) {
  return (await axios.get('/integrations/visicom/orders/config/', {signal})).data;
}
