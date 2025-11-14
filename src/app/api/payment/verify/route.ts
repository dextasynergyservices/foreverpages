/**
 * Payment Verification Route
 * GET /api/payment/verify?reference=xxx
 *
 * Used after user is redirected back from Paystack
 * Verifies payment status and returns details for registration flow
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayment } from "@/lib/paystack";
import { logPaymentCompleted } from "@/lib/activity-logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    console.log(`🔍 Payment verification request received for reference: ${reference}`);

    // Validate required parameters
    if (!reference) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter: reference",
        },
        { status: 400 }
      );
    }

    // Find the payment record
    const payment = await prisma.payment.findFirst({
      where: {
        paystackReference: reference,
      },
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
            startDate: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!payment) {
      console.log(`❌ Payment not found for reference: ${reference}`);
      return NextResponse.json(
        {
          success: false,
          error: "Payment not found",
        },
        { status: 404 }
      );
    }

    console.log(
      `📋 Payment found: ID=${payment.id}, Status=${payment.status}, Plan=${payment.plan.name}`
    );

    // If payment is pending, verify with Paystack
    if (payment.status === "PENDING") {
      console.log(`🔍 Payment still pending, verifying with Paystack: ${reference}`);

      let verification;
      try {
        verification = await verifyPayment(reference);
      } catch (verifyError) {
        console.error("❌ Paystack verification failed:", verifyError);
        return NextResponse.json(
          {
            success: false,
            error:
              verifyError instanceof Error ? verifyError.message : "Payment verification failed",
            payment: {
              id: payment.id,
              status: "PENDING",
              reference: payment.paystackReference,
            },
          },
          { status: 400 }
        );
      }

      if (!verification.status || verification.data.status !== "success") {
        console.log(`❌ Payment not successful on Paystack:`, verification.data.status);
        return NextResponse.json(
          {
            success: false,
            error: verification.message || "Payment verification failed",
            payment: {
              id: payment.id,
              status: "PENDING",
              reference: payment.paystackReference,
            },
          },
          { status: 400 }
        );
      }

      // Payment verified successfully with Paystack
      // Update payment status manually (since webhook won't trigger in development)
      console.log(`✅ Payment verified with Paystack, updating status: ${reference}`);

      const startDate = new Date();
      const expiresAt = new Date(startDate);
      expiresAt.setDate(expiresAt.getDate() + payment.plan.durationDays);

      // Use transaction to update payment and create subscription
      const updatedPayment = await prisma.$transaction(async (tx) => {
        // Update payment to SUCCESS
        const updated = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCESS",
            paidAt: new Date(),
          },
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                slug: true,
                durationDays: true,
              },
            },
          },
        });

        // Create subscription if payment has a userId (shouldn't in payment-first flow)
        // If no userId, subscription will be created during registration
        if (updated.userId) {
          const existingSubscription = await tx.subscription.findFirst({
            where: {
              userId: updated.userId,
              planId: updated.planId,
            },
          });

          if (!existingSubscription) {
            await tx.subscription.create({
              data: {
                userId: updated.userId,
                planId: updated.planId,
                status: "ACTIVE",
                startDate,
                expiresAt,
                paystackReference: reference,
              },
            });
          }

          // Log payment completion activity
          await tx.activityLog.create({
            data: {
              userId: updated.userId,
              action: "CREATED",
              entityType: "Payment",
              entityId: updated.id,
              description: `Payment completed for ${updated.plan.name} plan`,
              metadata: {
                amount: updated.amount.toString(),
                currency: updated.selectedCurrency,
                planId: updated.planId,
                planName: updated.plan.name,
                reference: updated.paystackReference,
              },
            },
          });
        }

        return tx.payment.findUnique({
          where: { id: updated.id },
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
                startDate: true,
                expiresAt: true,
              },
            },
          },
        });
      });

      if (!updatedPayment) {
        return NextResponse.json(
          {
            success: false,
            error: "Payment not found after update",
          },
          { status: 404 }
        );
      }

      console.log(`✅ Payment updated to SUCCESS: ${reference}`);

      // Log payment completion (async, non-blocking)
      if (updatedPayment.userId) {
        logPaymentCompleted({
          userId: updatedPayment.userId,
          email: updatedPayment.customerEmail || "",
          paymentId: updatedPayment.id,
          planId: updatedPayment.plan.id,
          planName: updatedPayment.plan.name,
          amount: updatedPayment.amount.toString(),
          currency: updatedPayment.selectedCurrency,
        }).catch((err) => console.error("Failed to log payment completion:", err));
      }

      return NextResponse.json({
        success: true,
        data: {
          paymentId: updatedPayment.id,
          reference: updatedPayment.paystackReference,
          amount: Number(updatedPayment.amount),
          currency: updatedPayment.selectedCurrency,
          status: updatedPayment.status,
          planId: updatedPayment.plan.id,
          planName: updatedPayment.plan.name,
        },
      });
    }

    // Payment already processed
    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        reference: payment.paystackReference,
        amount: Number(payment.amount),
        currency: payment.selectedCurrency,
        status: payment.status,
        planId: payment.plan.id,
        planName: payment.plan.name,
      },
    });
  } catch (error) {
    console.error("❌ Payment verification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during payment verification",
      },
      { status: 500 }
    );
  }
}
