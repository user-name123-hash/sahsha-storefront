"use client"

import dynamic from "next/dynamic"

const PushNotificationManager = dynamic(
  () => import("@modules/layout/components/push-notification-manager"),
  { ssr: false }
)

export default function LazyPushNotificationManager({
  customerId,
}: {
  customerId?: string
}) {
  return <PushNotificationManager customerId={customerId} />
}
