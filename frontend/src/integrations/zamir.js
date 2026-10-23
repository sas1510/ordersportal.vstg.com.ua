export const ZAMIR_ORIGIN = 'https://zamir.viknastyle.com.ua';
export function notifyZamirLogout() {
  window.dispatchEvent(new Event('portal:logout'));
}
export function isZamirLoginRequest(event, frameWindow) {
  return event.origin === ZAMIR_ORIGIN && event.source === frameWindow
    && (event.data === 'zamir:need-login' || event.data?.type === 'zamir:need-login');
}
