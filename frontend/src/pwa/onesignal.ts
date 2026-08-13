const ONESIGNAL_APP_ID = "264778ee-71e9-4aa2-87e9-66c8355bdea0";

interface OneSignalSdk {
  init: (options: {
    appId: string;
    serviceWorkerPath: string;
    serviceWorkerParam: { scope: string };
  }) => Promise<void>;
  Notifications: {
    requestPermission: () => Promise<void>;
  };
  User: {
    PushSubscription: {
      optIn: () => Promise<void>;
    };
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

// If the browser's Notification permission is already "granted" (e.g. from
// this app's own raw Notification.requestPermission() call elsewhere, or a
// prior visit), the native permission prompt can never fire again, so
// Notifications.requestPermission() alone may never create a subscription.
// Explicitly opt in for that case; otherwise let OneSignal drive its own
// permission request as normal.
async function syncSubscription(OneSignal: OneSignalSdk): Promise<void> {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "granted") {
    await OneSignal.User.PushSubscription.optIn();
  } else {
    await OneSignal.Notifications.requestPermission();
  }
}

export function initOneSignal(): void {
  // Production only: OneSignal registers /sw.js itself, and that file is
  // only meaningfully served (with the OneSignal import merged in) from a
  // production build -- same reasoning as registerServiceWorker().
  if (!import.meta.env.PROD) return;

  withOneSignal(async (OneSignal) => {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      // Use our existing merged service worker instead of OneSignal's
      // default /OneSignalSDKWorker.js, so there is only ever one
      // registration controlling scope "/".
      serviceWorkerPath: "sw.js",
      serviceWorkerParam: { scope: "/" },
    });
    // Self-heals browsers where permission was already granted before this
    // fix (or via a prior visit) without waiting for a button click.
    await syncSubscription(OneSignal);
  });
}

export function requestOneSignalPermission(): void {
  if (!import.meta.env.PROD) return;
  withOneSignal(syncSubscription);
}
