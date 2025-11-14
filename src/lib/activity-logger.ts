/**
 * Activity Logger Utility
 * Tracks important user actions and system events
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "./prisma";
import { ActivityType } from "@/generated/prisma";

interface LogActivityParams {
  userId?: string;
  action: ActivityType;
  entityType: string;
  entityId: string;
  description?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an activity
 */
export async function logActivity(params: LogActivityParams) {
  try {
    const activity = await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });

    console.log(`[ACTIVITY LOG] ${params.action} on ${params.entityType}:${params.entityId}`);
    return activity;
  } catch (error) {
    console.error("[ACTIVITY LOG ERROR] Failed to log activity:", error);
    // Don't throw - logging failure shouldn't break the main operation
    return null;
  }
}

/**
 * Log user registration
 */
export async function logUserRegistration(params: {
  userId: string;
  email: string;
  planId: string;
  planName: string;
  amount: string;
  currency: string;
  paymentId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return logActivity({
    userId: params.userId,
    action: "CREATED",
    entityType: "User",
    entityId: params.userId,
    description: `User registered with ${params.planName} plan`,
    metadata: {
      email: params.email,
      planId: params.planId,
      planName: params.planName,
      amount: params.amount,
      currency: params.currency,
      paymentId: params.paymentId,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Log email verification
 */
export async function logEmailVerification(params: {
  userId: string;
  email: string;
  method: "LINK" | "CODE";
  ipAddress?: string;
  userAgent?: string;
}) {
  return logActivity({
    userId: params.userId,
    action: "UPDATED",
    entityType: "User",
    entityId: params.userId,
    description: `Email verified via ${params.method}`,
    metadata: {
      email: params.email,
      verificationMethod: params.method,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Log payment completed
 */
export async function logPaymentCompleted(params: {
  userId?: string;
  email: string;
  paymentId: string;
  planId: string;
  planName: string;
  amount: string;
  currency: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return logActivity({
    userId: params.userId,
    action: "CREATED",
    entityType: "Payment",
    entityId: params.paymentId,
    description: `Payment completed for ${params.planName}`,
    metadata: {
      email: params.email,
      planId: params.planId,
      planName: params.planName,
      amount: params.amount,
      currency: params.currency,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Get activity logs with filters
 */
export async function getActivityLogs(filters?: {
  userId?: string;
  action?: ActivityType;
  entityType?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const where: any = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { logs, total };
  } catch (error) {
    console.error("[ACTIVITY LOG ERROR] Failed to fetch activity logs:", error);
    return { logs: [], total: 0 };
  }
}

/**
 * Get activity statistics
 */
export async function getActivityStats(filters?: { startDate?: Date; endDate?: Date }) {
  try {
    const where: any = {};
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [totalActivities, registrations, verifications, payments, logins] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.count({
        where: { ...where, entityType: "User", action: "CREATED" },
      }),
      prisma.activityLog.count({
        where: { ...where, entityType: "User", action: "UPDATED" },
      }),
      prisma.activityLog.count({
        where: { ...where, entityType: "Payment", action: "CREATED" },
      }),
      prisma.activityLog.count({
        where: { ...where, entityType: "Session", action: "CREATED" },
      }),
    ]);

    return {
      totalActivities,
      registrations,
      verifications,
      payments,
      logins,
    };
  } catch (error) {
    console.error("[ACTIVITY LOG ERROR] Failed to fetch activity stats:", error);
    return {
      totalActivities: 0,
      registrations: 0,
      verifications: 0,
      payments: 0,
      logins: 0,
    };
  }
}
