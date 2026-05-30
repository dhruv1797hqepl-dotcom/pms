const DDTME_PLANNING_REFRESH_KEY = 'ddtme:planning-refresh-ts';
const DDTME_PLANNING_REFRESH_EVENT = 'ddtme:planning-refresh';

export const broadcastDdtmePlanningRefresh = () => {
  const timestamp = String(Date.now());

  try {
    localStorage.setItem(DDTME_PLANNING_REFRESH_KEY, timestamp);
  } catch {
    // Ignore storage failures and still emit the in-tab event.
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DDTME_PLANNING_REFRESH_EVENT));
  }
};

export const subscribeToDdtmePlanningRefresh = (listener) => {
  const handleStorage = (event) => {
    if (event.key === DDTME_PLANNING_REFRESH_KEY) {
      listener();
    }
  };

  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener(DDTME_PLANNING_REFRESH_EVENT, listener);
  window.addEventListener('storage', handleStorage);
  window.addEventListener('focus', listener);
  document.addEventListener('visibilitychange', listener);

  return () => {
    window.removeEventListener(DDTME_PLANNING_REFRESH_EVENT, listener);
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('focus', listener);
    document.removeEventListener('visibilitychange', listener);
  };
};