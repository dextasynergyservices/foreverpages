export function getSocketUrl(): string | undefined {
  // NEXT_PUBLIC_SOCKET_URL is inlined at build time and preferred for deploy overrides.
  const raw =
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_SOCKET_URL as string) || window.location.origin
      : (process.env.NEXT_PUBLIC_SOCKET_URL as string | undefined);

  if (!raw) return undefined;

  // If the URL already has a protocol, return as-is
  if (/^https?:\/\//i.test(raw) || /^wss?:\/\//i.test(raw)) return raw;

  // In browser, prefer the page protocol; otherwise default to https
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${raw}`;
  }

  return `https://${raw}`;
}
