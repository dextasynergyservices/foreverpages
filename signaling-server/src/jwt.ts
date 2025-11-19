import jwt from "jsonwebtoken";

export type JwtPayload = {
  userId?: string;
  role?: string;
  streamId?: string;
  [key: string]: unknown;
};

export function signToken(payload: JwtPayload, secret: string, opts?: jwt.SignOptions) {
  return jwt.sign(payload, secret, { algorithm: "HS256", expiresIn: "1h", ...(opts || {}) });
}

export type VerifyResult = {
  payload: JwtPayload | null;
  error?: string;
};

function normalizePem(pem: string) {
  return pem.replace(/\\n/g, "\n");
}

function loadPublicKeys(): string[] {
  const raw = process.env.STREAM_ACCESS_PUBLIC_KEYS || process.env.STREAM_ACCESS_PUBLIC_KEY || "";
  if (!raw) return [];

  // Support JSON array or a single PEM string
  try {
    if (raw.trim().startsWith("[")) {
      const arr = JSON.parse(raw) as string[];
      return arr.map((p) => normalizePem(p));
    }
  } catch {
    // Fall through to treat as single PEM
  }

  return [normalizePem(raw)];
}

/**
 * Try verifying an access token using any configured RS256 public keys first.
 * If that fails and ALLOW_HS256_FALLBACK=true is set, try HS256 with
 * STREAM_ACCESS_SECRET.
 */
export function verifyAccessToken(token: string): VerifyResult {
  const publicKeys = loadPublicKeys();
  // Try RS256 public keys first
  for (const pk of publicKeys) {
    try {
      const decoded = jwt.verify(token, pk, { algorithms: ["RS256"] }) as JwtPayload;
      return { payload: decoded };
    } catch {
      // continue trying other keys
    }
  }

  // Optional HS256 fallback during migration
  const allowFallback =
    String(process.env.ALLOW_HS256_FALLBACK || "false").toLowerCase() === "true";
  const secret = process.env.STREAM_ACCESS_SECRET;
  if (allowFallback && secret) {
    try {
      const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as JwtPayload;
      return { payload: decoded };
    } catch (err) {
      let message = "unknown verification error";
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e: any = err;
        if (e && e.message) message = String(e.message);
      } catch {
        /* ignore */
      }
      return { payload: null, error: message };
    }
  }

  return { payload: null, error: "no valid public keys configured and HS256 fallback disabled" };
}

/**
 * Backward-compatible HS256 verification helper used by handshake tokens.
 */
export function verifyToken(token: string, secret: string): VerifyResult {
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as JwtPayload;
    return { payload: decoded };
  } catch (err: unknown) {
    let message = "unknown verification error";
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e: any = err;
      if (e && e.message) message = String(e.message);
    } catch {
      /* ignore */
    }
    return { payload: null, error: message };
  }
}
