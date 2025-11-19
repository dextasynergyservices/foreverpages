/**
 * Small helper to notify the external signaling server about stream metadata
 * changes. The signaling server exposes a protected POST /api/streams/:id/metadata
 * endpoint which will broadcast `stream-metadata-updated` to connected clients.
 */
export async function notifySignalingMetadataUpdate(
  streamId: string,
  metadata: Record<string, unknown>
) {
  try {
    const base =
      process.env.SOCKET_URL || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
    const url = `${base.replace(/\/$/, "")}/api/streams/${encodeURIComponent(streamId)}/metadata`;
    const secret = process.env.SOCKET_ADMIN_SECRET || "";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-secret": secret,
      },
      body: JSON.stringify(metadata),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("notifySignalingMetadataUpdate failed:", res.status, text);
    }
  } catch (err) {
    console.warn("notifySignalingMetadataUpdate error:", err);
  }
}
