export function getSocketUrl(): string | undefined {
  // NEXT_PUBLIC_SOCKET_URL is inlined at build time and preferred for deploy overrides.
  if (typeof window !== "undefined") {
    return (process.env.NEXT_PUBLIC_SOCKET_URL as string) || window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL as string | undefined;
}
