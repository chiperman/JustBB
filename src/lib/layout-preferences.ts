export const LEFT_SIDEBAR_STORAGE_KEY = "layout:left-sidebar-collapsed";
export const LEFT_SIDEBAR_STORAGE_EVENT = "layout:left-sidebar-collapsed-change";
export const LEFT_SIDEBAR_COOKIE_KEY = "layout_left_sidebar_collapsed";

export const RIGHT_SIDEBAR_STORAGE_KEY = "layout:right-sidebar-collapsed";
export const RIGHT_SIDEBAR_STORAGE_EVENT = "layout:right-sidebar-collapsed-change";
export const RIGHT_SIDEBAR_COOKIE_KEY = "layout_right_sidebar_collapsed";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function getStoredLayoutPreference(storageKey: string) {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(storageKey) === "true";
}

export function subscribeToLayoutPreference(
  storageKey: string,
  eventName: string,
  onStoreChange: () => void,
) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      onStoreChange();
    }
  };

  const handleLocalChange = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(eventName, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(eventName, handleLocalChange);
  };
}

export function persistLayoutPreference(
  storageKey: string,
  cookieKey: string,
  eventName: string,
  value: boolean,
) {
  if (typeof window === "undefined") return;

  localStorage.setItem(storageKey, String(value));
  document.cookie = `${cookieKey}=${String(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  window.dispatchEvent(new Event(eventName));
}

export function syncLayoutPreferenceCookie(
  storageKey: string,
  cookieKey: string,
) {
  if (typeof window === "undefined") return;

  const value = localStorage.getItem(storageKey);
  if (value === null) return;

  document.cookie = `${cookieKey}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}
