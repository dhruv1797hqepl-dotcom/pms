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
  // Only fire on explicit refresh events (manual trigger or cross-tab broadcast).
  // DO NOT listen on 'focus' or 'visibilitychange' — those would hammer the
  // server API every time the user switches tabs or clicks the window.
  const handleStorage = (event) => {
    if (event.key === DDTME_PLANNING_REFRESH_KEY) {
      listener();
    }
  };

  if (typeof window === 'undefined') {
    return () => { };
  }

  window.addEventListener(DDTME_PLANNING_REFRESH_EVENT, listener);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(DDTME_PLANNING_REFRESH_EVENT, listener);
    window.removeEventListener('storage', handleStorage);
  };
};