// Permissive shim for `sharp` so CI/typecheck doesn't fail when native module
// types are not installed. This is a temporary, safe mitigation to unblock CI
// while we make more targeted fixes.

declare module "sharp" {
  interface Sharp {
    metadata(): Promise<unknown>;
    toBuffer(): Promise<Uint8Array>;
    resize(...args: unknown[]): Sharp;
    crop(...args: unknown[]): Sharp;
    png(...args: unknown[]): Sharp;
    jpeg(...args: unknown[]): Sharp;
    webp(...args: unknown[]): Sharp;
  }

  function sharp(input?: unknown): Sharp;
  namespace sharp {}
  export = sharp;
}
