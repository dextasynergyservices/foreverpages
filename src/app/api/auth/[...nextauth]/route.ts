import NextAuth, { type NextAuthOptions, type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "../../../../generated/prisma";
import bcrypt from "bcryptjs";
import { checkLoginRateLimit, recordFailedLogin, resetLoginAttempts } from "@/lib/rate-limit";

declare module "next-auth" {
  interface User {
    role: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
  }
}

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
        recaptchaToken: { label: "reCAPTCHA Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password || !credentials?.recaptchaToken) {
          throw new Error("Missing credentials");
        }

        // Check rate limit BEFORE any database queries
        const rateLimitCheck = checkLoginRateLimit(credentials.identifier);
        if (!rateLimitCheck.allowed) {
          throw new Error(
            JSON.stringify({
              type: "RATE_LIMIT",
              message: rateLimitCheck.message,
              lockoutUntil: rateLimitCheck.lockoutUntil,
              lockoutDuration: rateLimitCheck.lockoutDuration,
            })
          );
        }

        // Verify reCAPTCHA
        const recaptchaResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            secret: process.env.RECAPTCHA_SECRET_KEY || "",
            response: credentials.recaptchaToken,
          }),
        });

        const recaptchaResult = await recaptchaResponse.json();
        if (!recaptchaResult.success) {
          recordFailedLogin(credentials.identifier);
          throw new Error("Invalid reCAPTCHA");
        }

        // Check if identifier is email or phone
        const isEmail = credentials.identifier.includes("@");
        const user = await prisma.user.findFirst({
          where: isEmail ? { email: credentials.identifier } : { phone: credentials.identifier },
        });

        if (!user || !user.password) {
          recordFailedLogin(credentials.identifier);
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          const failResult = recordFailedLogin(credentials.identifier);
          if (!failResult.allowed) {
            throw new Error(
              JSON.stringify({
                type: "RATE_LIMIT",
                message: failResult.message,
                lockoutUntil: failResult.lockoutUntil,
                lockoutDuration: failResult.lockoutDuration,
              })
            );
          }
          throw new Error(
            JSON.stringify({
              type: "INVALID_PASSWORD",
              message: "Invalid credentials",
              remainingAttempts: failResult.remainingAttempts,
            })
          );
        }

        // Successful login - reset attempts
        resetLoginAttempts(credentials.identifier);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 60 * 60, // 1 hour
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 60 * 60, // 1 hour
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signOut({}) {
      // Additional cleanup can be done here if needed
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
