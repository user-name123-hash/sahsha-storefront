import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging"

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
}

export const PUSH_NOTIFICATION_ICON_PATH = "/sahsha-notification-icon.png"

export function getPushNotificationIconUrl(): string {
  if (typeof window === "undefined") {
    return PUSH_NOTIFICATION_ICON_PATH
  }

  return `${window.location.origin}${PUSH_NOTIFICATION_ICON_PATH}`
}

export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig()
  return Boolean(
    config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.messagingSenderId &&
      config.appId &&
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim()
  )
}

function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    return null
  }

  return getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig())
}

function getVapidKey(): string | null {
  const key = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim()
  return key || null
}

async function clearServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    return
  }
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))
}

async function waitForActiveWorker(
  registration: ServiceWorkerRegistration
): Promise<ServiceWorkerRegistration> {
  if (registration.active) {
    return registration
  }

  const worker = registration.installing || registration.waiting
  if (worker) {
    await new Promise<void>((resolve, reject) => {
      const onStateChange = () => {
        if (worker.state === "activated") {
          worker.removeEventListener("statechange", onStateChange)
          resolve()
          return
        }
        if (worker.state === "redundant") {
          worker.removeEventListener("statechange", onStateChange)
          reject(new Error("Service worker became redundant"))
        }
      }

      worker.addEventListener("statechange", onStateChange)
      if (worker.state === "activated") {
        worker.removeEventListener("statechange", onStateChange)
        resolve()
      }
    })
  }

  await navigator.serviceWorker.ready

  const readyRegistration =
    (await navigator.serviceWorker.getRegistration("/")) || registration

  if (!readyRegistration.active) {
    throw new Error("Service worker is not active")
  }

  return readyRegistration
}

async function getServiceWorkerRegistration(
  resetExisting = false
): Promise<ServiceWorkerRegistration> {
  if (resetExisting) {
    await clearServiceWorkers()
  } else {
    const existing = await navigator.serviceWorker.getRegistration("/")
    if (existing?.active) {
      return existing
    }
  }

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
    { scope: "/", updateViaCache: "none" }
  )

  return waitForActiveWorker(registration)
}

function mapFirebaseError(error: unknown): PushTokenError {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : ""

  if (message.includes("messaging/unsupported-browser")) {
    return "not_supported"
  }

  if (
    message.includes("messaging/permission-blocked") ||
    message.includes("messaging/permission-default")
  ) {
    return "permission_denied"
  }

  if (
    message.includes("vapid") ||
    message.includes("Vapid") ||
    message.includes("applicationServerKey")
  ) {
    return "invalid_vapid"
  }

  if (
    message.includes("push service error") ||
    message.includes("Registration failed")
  ) {
    return "push_service"
  }

  return "token_failed"
}

export type PushTokenError =
  | "not_supported"
  | "permission_denied"
  | "not_configured"
  | "invalid_vapid"
  | "push_service"
  | "token_failed"

async function fetchToken(
  messaging: Messaging,
  registration: ServiceWorkerRegistration,
  vapidKey: string
): Promise<string> {
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  })

  if (!token) {
    throw new Error("Firebase returned an empty token")
  }

  return token
}

export async function requestPushToken(): Promise<
  { token: string } | { error: PushTokenError }
> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { error: "not_supported" }
  }

  if (!(await isSupported())) {
    return { error: "not_supported" }
  }

  if (!isFirebaseConfigured()) {
    return { error: "not_configured" }
  }

  let permission = Notification.permission
  if (permission === "default") {
    permission = await Notification.requestPermission()
  }

  if (permission !== "granted") {
    return { error: "permission_denied" }
  }

  const app = getFirebaseApp()
  const vapidKey = getVapidKey()

  if (!app || !vapidKey) {
    return { error: "not_configured" }
  }

  try {
    const registration = await getServiceWorkerRegistration()
    const messaging = getMessaging(app)
    const token = await fetchToken(messaging, registration, vapidKey)
    return { token }
  } catch (firstError) {
    // warn: Next.js dev overlay treats console.error as a full-screen error
    console.warn("Push token attempt 1 failed:", firstError)

    try {
      const registration = await getServiceWorkerRegistration(true)

      const messaging = getMessaging(app)
      const token = await fetchToken(messaging, registration, vapidKey)
      return { token }
    } catch (secondError) {
      console.warn("Push token attempt 2 failed:", secondError)
      return { error: mapFirebaseError(secondError) }
    }
  }
}

export function getPushTokenErrorMessage(error: PushTokenError): string {
  switch (error) {
    case "permission_denied":
      return "Notifications are blocked. Please allow them in your browser settings."
    case "not_configured":
      return "Push notifications are not configured on this site."
    case "invalid_vapid":
      return "Push notification setup is invalid. Please contact support."
    case "not_supported":
      return "This browser does not support push notifications."
    case "push_service":
      return "Browser push service failed. Clear site data for this site (or try another browser/profile) and try again."
    case "token_failed":
    default:
      return "Could not connect push notifications. Clear site data for localhost and try again."
  }
}

export function getPushPayloadTitleBody(payload: MessagePayload): {
  title: string
  body: string
} {
  const title =
    payload.notification?.title ||
    (typeof payload.data?.title === "string" ? payload.data.title : undefined) ||
    "Notification"
  const body =
    payload.notification?.body ||
    (typeof payload.data?.body === "string" ? payload.data.body : undefined) ||
    ""

  return { title, body }
}

/** Show a browser notification for a foreground FCM payload. */
export function showForegroundPushNotification(payload: MessagePayload): void {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return
  }

  const { title, body } = getPushPayloadTitleBody(payload)
  new Notification(title, {
    body,
    icon: getPushNotificationIconUrl(),
  })
}

/** Subscribe to foreground FCM messages; returns an unsubscribe function. */
export function subscribeForegroundPush(
  onPayload: (payload: MessagePayload) => void
): () => void {
  if (
    typeof window === "undefined" ||
    !isFirebaseConfigured() ||
    !("serviceWorker" in navigator) ||
    !("Notification" in window)
  ) {
    return () => {}
  }

  try {
    const app = getFirebaseApp()
    if (!app) {
      return () => {}
    }

    const messaging = getMessaging(app)
    return onMessage(messaging, onPayload)
  } catch {
    return () => {}
  }
}
