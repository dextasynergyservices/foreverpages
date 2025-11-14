/**
 * Email Logger Utility
 * Tracks all email sends, delivery status, opens, and clicks
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "./prisma";
import { EmailTemplate, EmailStatus } from "@/generated/prisma";

interface LogEmailParams {
  to: string;
  from: string;
  subject: string;
  template: EmailTemplate;
  providerId?: string;
  messageId?: string;
  userId?: string;
  memorialId?: string;
  metadata?: any;
}

interface UpdateEmailStatusParams {
  providerId?: string;
  messageId?: string;
  emailLogId?: string;
  status: EmailStatus;
  errorMessage?: string;
}

/**
 * Log an email send
 */
export async function logEmailSent(params: LogEmailParams) {
  try {
    const emailLog = await prisma.emailLog.create({
      data: {
        to: params.to,
        from: params.from,
        subject: params.subject,
        template: params.template,
        providerId: params.providerId,
        messageId: params.messageId,
        userId: params.userId,
        memorialId: params.memorialId,
        metadata: params.metadata,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    console.log(`[EMAIL LOG] Logged email send: ${emailLog.id} to ${params.to}`);
    return emailLog;
  } catch (error) {
    console.error("[EMAIL LOG ERROR] Failed to log email:", error);
    // Don't throw - logging failure shouldn't break email sending
    return null;
  }
}

/**
 * Update email status (for webhook events)
 */
export async function updateEmailStatus(params: UpdateEmailStatusParams) {
  try {
    // Find the email log by providerId, messageId, or emailLogId
    const where = params.emailLogId
      ? { id: params.emailLogId }
      : params.messageId
        ? { messageId: params.messageId }
        : params.providerId
          ? { providerId: params.providerId }
          : null;

    if (!where) {
      console.error("[EMAIL LOG ERROR] No identifier provided for status update");
      return null;
    }

    const updateData: any = {
      status: params.status,
      errorMessage: params.errorMessage,
    };

    // Set timestamp based on status
    switch (params.status) {
      case "DELIVERED":
        updateData.deliveredAt = new Date();
        break;
      case "OPENED":
        updateData.openedAt = new Date();
        break;
      case "CLICKED":
        updateData.clickedAt = new Date();
        break;
      case "FAILED":
      case "BOUNCED":
        updateData.failedAt = new Date();
        break;
    }

    const emailLog = await prisma.emailLog.updateMany({
      where,
      data: updateData,
    });

    console.log(`[EMAIL LOG] Updated email status to ${params.status}:`, where);
    return emailLog;
  } catch (error) {
    console.error("[EMAIL LOG ERROR] Failed to update email status:", error);
    return null;
  }
}

/**
 * Get email logs with filters
 */
export async function getEmailLogs(filters?: {
  userId?: string;
  template?: EmailTemplate;
  status?: EmailStatus;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const where: any = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.template) where.template = filters.template;
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.emailLog.count({ where }),
    ]);

    return { logs, total };
  } catch (error) {
    console.error("[EMAIL LOG ERROR] Failed to fetch email logs:", error);
    return { logs: [], total: 0 };
  }
}

/**
 * Get email statistics
 */
export async function getEmailStats(filters?: { startDate?: Date; endDate?: Date }) {
  try {
    const where: any = {};
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [totalSent, delivered, opened, clicked, failed, bounced] = await Promise.all([
      prisma.emailLog.count({ where: { ...where, status: "SENT" } }),
      prisma.emailLog.count({ where: { ...where, status: "DELIVERED" } }),
      prisma.emailLog.count({ where: { ...where, status: "OPENED" } }),
      prisma.emailLog.count({ where: { ...where, status: "CLICKED" } }),
      prisma.emailLog.count({ where: { ...where, status: "FAILED" } }),
      prisma.emailLog.count({ where: { ...where, status: "BOUNCED" } }),
    ]);

    return {
      totalSent,
      delivered,
      opened,
      clicked,
      failed,
      bounced,
      deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
    };
  } catch (error) {
    console.error("[EMAIL LOG ERROR] Failed to fetch email stats:", error);
    return {
      totalSent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
      bounced: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
    };
  }
}
