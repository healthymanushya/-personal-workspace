const ONESIGNAL_APP_ID = "264778ee-71e9-4aa2-87e9-66c8355dea00";

interface OneSignalSdk {
  init: (options: {
    appId: string;
    serviceWorkerPath: string;
    serviceWorkerParam: { scope: string };
  }) => Promise<void>;
  Notifications: {
    requestPermission: () => Promise<void>;
  };
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalSdk) => unknown>;
  }
}

// OneSignal's page SDK loads asynchronously (deferred) and processes this
// queue once ready, so pushing onto it is safe regardless of load order.
function withOneSignal(callback: (oneSignal: OneSignalSdk) => unknown): void {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(callback);
}

export function initOneSignal(): void {
  // Production only: OneSignal registers /sw.js itself, and that file is
  // only meaningfully served (with the OneSignal import merged in) from a
  // production build -- same reasoning as registerServiceWorker().
  if (!import.meta.env.PROD) return;

  withOneSignal((OneSignal) =>
    OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      // Use our existing merged service worker instead of OneSignal's
      // default /OneSignalSDKWorker.js, so there is only ever one
      // registration controlling scope "/".
      serviceWorkerPath: "sw.js",
      serviceWorkerParam: { scope: "/" },
    }),
  );
}

export function requestOneSignalPermission(): void {
  if (!import.meta.env.PROD) return;
  withOneSignal((OneSignal) => OneSignal.Notifications.requestPermission());
}
