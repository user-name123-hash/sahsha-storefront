import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const pixelId = process.env.META_PIXEL_ID || process.env.FB_PIXEL_ID
        const accessToken = process.env.META_ACCESS_TOKEN || process.env.FB_ACCESS_TOKEN

        if (!pixelId || !accessToken) {
            return NextResponse.json({ success: false, error: "Configuration missing" }, { status: 500 })
        }

        const {
            event_name = body.event || "Lead",
            action_source = "website",
            event_source_url,
            event_id, // For Deduplication
            custom_data = {},
            user_data = {},
        } = body

        // Prepare payload for Meta CAPI
        const payload = {
            data: [
                {
                    event_name,
                    event_time: Math.floor(Date.now() / 1000),
                    action_source,
                    event_id, // Included for Deduplication
                    event_source_url: event_source_url || req.headers.get("referer") || "",
                    user_data: {
                        // @ts-ignore
                        client_ip_address: req.ip || req.headers.get("x-forwarded-for")?.split(",")[0] || "",
                        client_user_agent: req.headers.get("user-agent") || "",
                        ...user_data,
                    },
                    custom_data,
                },
            ],
        }

        const response = await fetch(
            `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            }
        )

        const result = await response.json()

        if (response.ok) {
            return NextResponse.json({ success: true, data: result })
        } else {
            return NextResponse.json({ success: false, error: result }, { status: response.status })
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
