/**
 * Enhanced Registration Route with Payment-First Flow
 * POST /api/auth/register
 *
 * Requires valid payment before allowing registration
 * Creates user, links payment/subscription, sends verification emails
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { registerSchema } from "@/lib/validation";
import {
  generateVerificationCode,
  generateVerificationToken,
  getVerificationExpiry,
} from "@/lib/verification-utils";
import { sendVerificationEmail, notifyAdminNewSignup } from "@/lib/email-service";
import { sendWhatsAppVerification } from "@/lib/whatsapp-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recaptchaToken, paymentId, isCollaborator, invitationToken, ...formData } = body;

    // ============================================
    // 1. PAYMENT VALIDATION (Payment-First Flow)
    // ============================================
    // Collaborators don't need payment - they access via owner's subscription
    if (!isCollaborator && !paymentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment required. Please complete payment before registration.",
        },
        { status: 400 }
      );
    }

    // Skip payment validation for collaborators
    if (isCollaborator) {
      // Validate invitation token instead
      if (!invitationToken) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid invitation. Invitation token required for collaborator signup.",
          },
          { status: 400 }
        );
      }

      const invitation = await prisma.invitation.findUnique({
        where: { token: invitationToken },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          email: true,
        },
      });

      if (!invitation) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid invitation token.",
          },
          { status: 404 }
        );
      }

      if (invitation.status !== "ACCEPTED") {
        return NextResponse.json(
          {
            success: false,
            error: "Invitation must be accepted before creating account.",
          },
          { status: 400 }
        );
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invitation has expired.",
          },
          { status: 410 }
        );
      }

      // Email must match invitation (if one was specified)
      if (invitation.email && formData.email.toLowerCase() !== invitation.email.toLowerCase()) {
        return NextResponse.json(
          {
            success: false,
            error: "Email must match the invitation email.",
          },
          { status: 400 }
        );
      }
    }

    // Regular user payment validation
    type PaymentWithPlan = Prisma.PaymentGetPayload<{
      include: {
        plan: {
          select: {
            id: true;
            name: true;
            slug: true;
            durationDays: true;
          };
        };
        subscription: {
          select: {
            id: true;
            status: true;
            expiresAt: true;
          };
        };
      };
    }>;

    let payment: PaymentWithPlan | null = null;
    if (!isCollaborator && paymentId) {
      // Verify payment exists and is successful
      payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              slug: true,
              durationDays: true,
            },
          },
          subscription: {
            select: {
              id: true,
              status: true,
              expiresAt: true,
            },
          },
        },
      });

      if (!payment) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid payment. Payment not found.",
          },
          { status: 404 }
        );
      }

      if (payment.status !== "SUCCESS") {
        return NextResponse.json(
          {
            success: false,
            error: "Payment not successful. Please complete payment first.",
            paymentStatus: payment.status,
          },
          { status: 400 }
        );
      }

      // Check if payment is already linked to a user
      if (payment.userId && payment.userId !== "pending") {
        return NextResponse.json(
          {
            success: false,
            error: "Payment already used. Each payment can only be used once.",
          },
          { status: 400 }
        );
      }
    }

    // ============================================
    // 2. RECAPTCHA VALIDATION
    // ============================================
    if (!recaptchaToken) {
      return NextResponse.json(
        {
          success: false,
          error: "reCAPTCHA verification required",
        },
        { status: 400 }
      );
    }

    const recaptchaResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY || "",
        response: recaptchaToken,
      }),
    });

    const recaptchaResult = await recaptchaResponse.json();
    if (!recaptchaResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "reCAPTCHA verification failed",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 3. INPUT VALIDATION
    // ============================================
    const validationResult = registerSchema.safeParse(formData);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          errors: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, email, phone: validatedPhone, password } = validationResult.data;

    // Use validated phone instead of raw body phone
    const userPhone = validatedPhone;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User with this email already exists",
        },
        { status: 409 }
      );
    }

    // ============================================
    // 4. GENERATE VERIFICATION CODES
    // ============================================
    const verificationCode = generateVerificationCode();
    const verificationToken = generateVerificationToken();

    // ============================================
    // 5. HASH PASSWORD
    // ============================================
    const hashedPassword = await bcrypt.hash(password, 12);

    // ============================================
    // 6. DATABASE TRANSACTION
    // ============================================
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: userPhone || null,
          currentPlanId: !isCollaborator && payment ? payment.planId : null, // Collaborators don't have plans
          emailVerified: null, // Will be set after verification
          verificationMethod: "CODE", // Using 6-digit code
          lastVerificationSentAt: new Date(),
          verificationAttempts: 0,
        },
      });

      let subscriptionId: string | undefined;

      // Only handle payment/subscription for regular users (not collaborators)
      if (!isCollaborator && payment) {
        // Link payment to user (update from "pending" to real userId)
        await tx.payment.update({
          where: { id: payment.id },
          data: { userId: user.id },
        });

        // Create subscription for the user (payment-first flow)
        const startDate = new Date();
        const expiresAt = new Date(startDate);
        expiresAt.setDate(expiresAt.getDate() + payment.plan.durationDays);

        // Check if subscription already exists (from payment verification if userId existed)
        const existingSubscription = await tx.subscription.findFirst({
          where: {
            userId: user.id,
            planId: payment.planId,
          },
        });

        if (existingSubscription) {
          // Update existing subscription
          await tx.subscription.update({
            where: { id: existingSubscription.id },
            data: { userId: user.id },
          });
          subscriptionId = existingSubscription.id;
        } else {
          // Create new subscription
          const newSubscription = await tx.subscription.create({
            data: {
              userId: user.id,
              planId: payment.planId,
              status: "ACTIVE",
              startDate,
              expiresAt,
              paystackReference: payment.paystackReference || undefined,
            },
          });
          subscriptionId = newSubscription.id;
        }
      }

      // Link invitation to user if this is a collaborator signup
      if (isCollaborator && invitationToken) {
        await tx.invitation.updateMany({
          where: {
            token: invitationToken,
            status: "ACCEPTED",
          },
          data: {
            invitedUserId: user.id,
          },
        });
      }

      // Create verification token
      const verificationExpiresAt = getVerificationExpiry(15); // 15 minutes
      await tx.verificationToken.create({
        data: {
          userId: user.id,
          identifier: email,
          token: verificationToken,
          code: verificationCode,
          type: "EMAIL_VERIFICATION",
          expires: verificationExpiresAt,
        },
      });

      // Create activity log
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "CREATED",
          entityType: "User",
          entityId: user.id,
          description: isCollaborator
            ? "New collaborator account created"
            : `New user registered with ${payment?.plan.name || "selected"} plan`,
          metadata: {
            isCollaborator,
            paymentId: !isCollaborator && payment ? payment.id : undefined,
            subscriptionId: subscriptionId,
            planName: !isCollaborator && payment ? payment.plan.name : undefined,
            invitationToken: isCollaborator ? invitationToken : undefined,
          },
        },
      });

      return user;
    });

    // ============================================
    // 7. SEND NOTIFICATIONS
    // ============================================

    // Send verification email via Brevo
    try {
      await sendVerificationEmail(email, name, verificationCode, verificationToken);

      console.log(`✅ Verification email sent to: ${email}`);
    } catch (emailError) {
      console.error("❌ Failed to send verification email:", emailError);
      // Don't fail registration if email fails
    }

    // Send WhatsApp verification (if phone provided)
    if (userPhone) {
      try {
        await sendWhatsAppVerification(userPhone, verificationCode, name);
        console.log(`✅ WhatsApp verification sent to: ${userPhone}`);
      } catch (whatsappError) {
        console.error("❌ Failed to send WhatsApp verification:", whatsappError);
        // Don't fail registration if WhatsApp fails
      }
    }

    // Notify admin of new signup (regular users only, not collaborators)
    if (!isCollaborator && payment) {
      try {
        await notifyAdminNewSignup(
          email,
          name,
          payment.plan.name,
          `${payment.amount.toString()} ${payment.selectedCurrency}`
        );

        console.log(`✅ Admin notified of new signup: ${email}`);
      } catch (adminError) {
        console.error("❌ Failed to notify admin:", adminError);
        // Don't fail registration if admin notification fails
      }
    }

    // ============================================
    // 8. RETURN SUCCESS RESPONSE
    // ============================================
    return NextResponse.json(
      {
        success: true,
        message: isCollaborator
          ? "Collaborator account created successfully! Please verify your email."
          : "Registration successful! Please verify your email.",
        userId: result.id,
        email: result.email,
        isCollaborator,
        verificationSent: {
          email: true,
          whatsapp: !!userPhone,
        },
        subscription: payment
          ? {
              planName: payment.plan.name,
              expiresAt: payment.subscription?.expiresAt,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during registration",
      },
      { status: 500 }
    );
  }
}
