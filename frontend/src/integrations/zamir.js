export const ZAMIR_ORIGIN = 'https://zamir.viknastyle.com.ua';
export function notifyZamirLogout() {
  window.dispatchEvent(new Event('portal:logout'));
}
export function isZamirLoginRequest(event, frameWindow) {
  return event.origin === ZAMIR_ORIGIN && event.source === frameWindow
    && (event.data === 'zamir:need-login' || event.data?.type === 'zamir:need-login');
}

export function sendZamirLogout(frameWindow) {
  frameWindow?.postMessage({ type: 'zamir:logout' }, ZAMIR_ORIGIN);
}

export function updateZamirFrameRef(ref, nextFrame) {
  // React detaches callback refs before removing the iframe from the DOM.
  if (ref.current && ref.current !== nextFrame) {
    sendZamirLogout(ref.current.contentWindow);
  }
  ref.current = nextFrame;
}
