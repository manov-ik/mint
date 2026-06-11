import { NextResponse, NextRequest } from "next/server";
import { getUserId } from "@/lib/auth-helper";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();
    const { description, metadata, email, honeypot } = body;

    // 0. Honeypot check
    if (honeypot) {
      return NextResponse.json({ success: true });
    }

    // 1. Send to Discord if Webhook URL is configured
    const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
    
    if (DISCORD_WEBHOOK_URL) {
      const path = metadata.url.split(req.headers.get("host") || "")[1] || "/";
      const threadName = `Bug: ${description.substring(0, 40)}${description.length > 40 ? "..." : ""}`;
      
      const payload = {
        username: "Mint Feedback",
        avatar_url: "https://mint-core.vercel.app/logo.png",
        thread_name: threadName, 
        embeds: [
          {
            title: "🛑 New Bug Report",
            color: 0x00FF00,
            fields: [
              { name: "User", value: email || "Guest", inline: true },
              { name: "Path", value: path, inline: true },
              { name: "Description", value: `**${description}**` },
              { name: "Device / UA", value: `\`${metadata.userAgent}\`` },
              { name: "Theme", value: metadata.theme, inline: true },
              { name: "Locale", value: metadata.language, inline: true },
              { name: "Timezone", value: metadata.timezone, inline: true },
              { name: "Online", value: metadata.isOnline ? "✅ Yes" : "❌ No", inline: true },
              { name: "Screen", value: metadata.screen, inline: true },
            ],
            footer: { text: "Mint Core System" },
            timestamp: metadata.timestamp,
          },
        ],
      };

      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Discord API Error (${response.status}):`, errorText);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bug report failed:", error);
    return NextResponse.json(
      { error: "Failed to send report" },
      { status: 500 }
    );
  }
}
