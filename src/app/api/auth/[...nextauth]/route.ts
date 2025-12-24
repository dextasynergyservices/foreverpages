import NextAuth, { type NextAuthOptions, type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@/generated/prisma";
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
        recaptchaToken: { label: "reCAPTCHA Token", type: "text" },
        twoFactorToken: { label: "2FA Session Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier) {
          throw new Error("Missing identifier");
        }

        // Check if this is a 2FA verified session
        if (credentials.twoFactorToken) {
          // Verify the 2FA session token
          const sessionToken = await prisma.verificationToken.findFirst({
            where: {
              token: credentials.twoFactorToken,
              type: "TWO_FACTOR_SESSION",
              expires: {
                gt: new Date(),
              },
              usedAt: null,
            },
          });

          if (!sessionToken) {
            throw new Error("Invalid or expired 2FA session");
          }

          // Mark token as used
          await prisma.verificationToken.update({
            where: { id: sessionToken.id },
            data: { usedAt: new Date() },
          });

          // Get user from the token identifier (userId)
          const user = await prisma.user.findUnique({
            where: { id: sessionToken.identifier },
          });

          if (!user) {
            throw new Error("User not found");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        // Regular login flow (no 2FA token)
        if (!credentials?.password || !credentials?.recaptchaToken) {
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
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
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
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === "google" && user.email) {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            // New Google user - check for pending payment by customerEmail
            const pendingPayment = await prisma.payment.findFirst({
              where: {
                customerEmail: user.email,
                status: "SUCCESS",
                userId: null, // Not yet linked to a user
              },
              orderBy: {
                createdAt: "desc",
              },
            });

            if (pendingPayment) {
              // Create user with the Google account
              const googleProfile = profile as { picture?: string };
              const newUser = await prisma.user.create({
                data: {
                  email: user.email,
                  name: user.name || "",
                  emailVerified: new Date(), // Google emails are pre-verified
                  role: "USER",
                  image: googleProfile.picture,
                },
              });

              // Link payment to new user
              await prisma.payment.update({
                where: { id: pendingPayment.id },
                data: { userId: newUser.id },
              });

              // Create subscription based on payment
              const planData = await prisma.plan.findUnique({
                where: { id: pendingPayment.planId },
              });

              if (planData) {
                const now = new Date();
                const expiresAt = new Date(now);

                // Calculate subscription expiry based on plan duration (in days)
                expiresAt.setDate(expiresAt.getDate() + planData.durationDays);

                // Calculate grace period end date
                const gracePeriodEndsAt = new Date(expiresAt);
                gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 7); // 7 days grace

                await prisma.subscription.create({
                  data: {
                    userId: newUser.id,
                    planId: pendingPayment.planId,
                    status: "ACTIVE",
                    startDate: now,
                    expiresAt: expiresAt,
                    gracePeriodEndsAt: gracePeriodEndsAt,
                    paystackReference: pendingPayment.paystackReference,
                  },
                });

                // Link payment to subscription
                const createdSubscription = await prisma.subscription.findFirst({
                  where: { userId: newUser.id },
                  orderBy: { createdAt: "desc" },
                });

                if (createdSubscription) {
                  await prisma.payment.update({
                    where: { id: pendingPayment.id },
                    data: {
                      subscriptionId: createdSubscription.id,
                    },
                  });
                }
              }

              // Update user ID in token
              user.id = newUser.id;
            }
          } else if (!existingUser.emailVerified) {
            // Existing user but email not verified - verify it now
            const googleProfile = profile as { picture?: string };
            await prisma.user.update({
              where: { email: user.email },
              data: {
                emailVerified: new Date(),
                image: googleProfile.picture || existingUser.image,
              },
            });
          }
        } catch (error) {
          console.error("Error handling Google sign-in:", error);
          return false;
        }
      }
      return true;
    },
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
