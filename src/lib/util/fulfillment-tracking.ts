export type FulfillmentTrackingEntry = {
  trackingNumber?: string
  trackingUrl?: string
}

export function getFulfillmentTrackingEntries(
  fulfillments: Array<Record<string, unknown>> | undefined | null
): FulfillmentTrackingEntry[] {
  if (!fulfillments?.length) {
    return []
  }

  const entries: FulfillmentTrackingEntry[] = []
  const seen = new Set<string>()

  const add = (entry: FulfillmentTrackingEntry) => {
    const trackingNumber = entry.trackingNumber?.trim() || undefined
    const trackingUrl = entry.trackingUrl?.trim() || undefined

    if (!trackingNumber && !trackingUrl) {
      return
    }

    const key = `${trackingNumber || ""}::${trackingUrl || ""}`
    if (seen.has(key)) {
      return
    }

    seen.add(key)
    entries.push({
      trackingNumber,
      trackingUrl,
    })
  }

  for (const fulfillment of fulfillments) {
    const labels =
      (fulfillment.labels as Array<Record<string, string>> | undefined) || []

    for (const label of labels) {
      add({
        trackingNumber: label.tracking_number,
        trackingUrl: label.tracking_url,
      })
    }

    const trackingLinks =
      (fulfillment.tracking_links as Array<Record<string, string>> | undefined) ||
      []

    for (const link of trackingLinks) {
      add({
        trackingNumber: link.tracking_number || link.url,
        trackingUrl: link.url,
      })
    }

    const metadata = fulfillment.metadata as Record<string, string> | undefined
    if (metadata?.tracking_number || metadata?.tracking_url) {
      add({
        trackingNumber: metadata.tracking_number,
        trackingUrl: metadata.tracking_url,
      })
    }
  }

  return entries
}
