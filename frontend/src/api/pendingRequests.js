const pendingRequests = new Map();

export function addPending(config) {
  const key = config.method + config.url;
  if (pendingRequests.has(key)) {
    return true; // означає дубль → блокувати
  }
  pendingRequests.set(key, true);
  return false;
}

export function removePending(config) {
  const key = config.method + config.url;
  pendingRequests.delete(key);
}
