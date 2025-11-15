import jwt from "jsonwebtoken";

export type JwtPayload = {
  userId: string;
  role?: string;
  [key: string]: unknown;
};

export function signToken(payload: JwtPayload, secret: string, opts?: jwt.SignOptions) {
  return jwt.sign(payload, secret, { algorithm: "HS256", expiresIn: "1h", ...(opts || {}) });
}

export function verifyToken(token: string, secret: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
