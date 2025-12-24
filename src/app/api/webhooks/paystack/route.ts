/**
 * Paystack Webhook Handler
 * POST /api/webhooks/paystack
 *
 * Handles Paystack webhook events (payment success, failure, etc.)
 * Security: Verifies Paystack signature before processing
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import log from "@/lib/logger"; // Added logger import
import {
  validateWebhookSignature,
  parseWebhookPayload,
  PaystackWebhookPayload,
} from "@/lib/paystack";

export async function POST(req: Request) {
  try {
    const body = await req.text();

    // Get the signature from headers
    const headersList = await headers();
    const signature = headersList.get("x-paystack-signature");

    if (!signature) {
      log.error("Webhook rejected: Missing Paystack signature");
      return NextResponse.json({ success: false, error: "Missing signature" }, { status: 401 });
    }

    // Verify webhook signature
    const isValid = validateWebhookSignature(signature, body);

    if (!isValid) {
      log.error("Webhook rejected: Invalid Paystack signature");
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
    }

    // Parse webhook payload
    const payload = parseWebhookPayload(body);
    log.info(`Webhook received: ${payload.event}`, { event: payload.event });

    // Handle different event types
    switch (payload.event) {
      case "charge.success":
        await handleChargeSuccess(payload);
        break;

      case "charge.failed":
        await handleChargeFailed(payload);
        break;

      default:
        log.warn(`Unhandled webhook event: ${payload.event}`, { event: payload.event });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Webhook processing failed", { error });

    const errorMessage = error instanceof Error ? error.message : "Webhook processing failed";

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

/**
 * Handle successful charge event
 */
async function handleChargeSuccess(payload: PaystackWebhookPayload) {
  const { reference, amount, currency } = payload.data;

  log.info(`Processing successful charge: ${reference}`, { reference });

  try {
    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { paystackReference: reference },
      include: { plan: true },
    });

    if (!payment) {
      log.error("Payment not found for reference", { reference });
      return;
    }

    // Check if payment was already processed
    if (payment.status === "SUCCESS") {
      log.info("Payment already processed, skipping", { reference });
      return; // Already processed
    }

    // Update the payment record to SUCCESS
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        paidAt: new Date(),
      },
    });

    // Only create subscription if payment has been linked to a user
    // In payment-first flow, userId is null until signup completes
    if (payment.userId) {
      // Check if this is a RENEWAL payment (for lifetime access)
      if (payment.paymentType === "RENEWAL" && payment.subscriptionId) {
        // This is a renewal payment - upgrade subscription to lifetime access
        const renewalId = (payload.data.metadata as { renewalId?: string })?.renewalId;

        if (renewalId) {
          await prisma.subscription.update({
            where: { id: payment.subscriptionId },
            data: {
              renewalId,
              renewedAt: new Date(),
              status: "ACTIVE", // Reactivate if expired
              inGracePeriod: false, // Clear grace period
              gracePeriodEndsAt: null,
            },
          });

          // Create activity log
          await prisma.activityLog.create({
            data: {
              userId: payment.userId,
              entityType: "SUBSCRIPTION",
              entityId: payment.subscriptionId,
              action: "UPDATED",
              description: "Subscription upgraded to lifetime access",
              metadata: {
                type: "lifetime_renewal",
                paymentId: payment.id,
                renewalId,
                reference,
                amount: amount.toString(),
                currency,
              },
            },
          });

          log.info(`Subscription upgraded to lifetime: ${payment.subscriptionId}`, {
            subscriptionId: payment.subscriptionId,
          });
        }
      } else {
        // Regular plan subscription payment
        // Create subscription record
        // Calculate expiry date: today + plan duration
        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + payment.plan.durationDays);

        const subscription = await prisma.subscription.create({
          data: {
            userId: payment.userId,
            planId: payment.planId,
            status: "ACTIVE", // Payment successful, subscription is active
            startDate,
            expiresAt: expiryDate,
            autoRenew: false,
          },
        });

        // Link subscription to payment
        await prisma.payment.update({
          where: { id: payment.id },
          data: { subscriptionId: subscription.id },
        });

        // Create activity log
        await prisma.activityLog.create({
          data: {
            userId: payment.userId,
            entityType: "SUBSCRIPTION",
            entityId: subscription.id,
            action: "CREATED",
            description: `Payment successful for ${payment.plan.name} plan`,
            metadata: {
              plan: payment.plan.name,
              paymentId: payment.id,
              subscriptionId: subscription.id,
              reference,
              amount: amount.toString(),
              currency,
            },
          },
        });

        log.info(`Subscription created: ${subscription.id} for payment: ${payment.id}`, {
          subscriptionId: subscription.id,
          paymentId: payment.id,
        });
      }
    } else {
      log.info("Payment marked as SUCCESS but no subscription created (userId null)", {
        paymentId: payment.id,
      });
      log.info("Subscription will be created when user completes signup");
    }
  } catch (error) {
    log.error("Failed to process successful charge", { reference, error });
    throw error;
  }
}

/**
 * Handle failed charge event
 */
async function handleChargeFailed(payload: PaystackWebhookPayload) {
  const { reference, gateway_response } = payload.data;

  log.warn(`Processing failed charge: ${reference}`, { reference });

  try {
    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { paystackReference: reference },
    });

    if (!payment) {
      console.error(`❌ Payment not found for reference: ${reference}`);
      return;
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        failedAt: new Date(),
      },
    });

    // Create activity log only if payment is linked to a user
    if (payment.userId) {
      await prisma.activityLog.create({
        data: {
          userId: payment.userId,
          action: "UPDATED",
          entityType: "Payment",
          entityId: payment.id,
          description: `Payment failed: ${gateway_response || "Unknown reason"}`,
          metadata: {
            paymentId: payment.id,
            reference,
            gatewayResponse: gateway_response,
          },
        },
      });
    }

    log.info(`Payment marked as failed: ${payment.id}`, { paymentId: payment.id });
  } catch (error) {
    console.error(`❌ Failed to process failed charge for ${reference}:`, error);
    throw error;
  }
}
