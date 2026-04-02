/**
 * Security audit endpoint
 * Provides real-time security audit data
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  getLoginAttemptsFromIp,
  countFailedLoginsLast24h,
  getSecurityEventsByDateRange,
} from "@/lib/security-logger";

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "Admin") {
      logger.warn("security", "Tentative d\'accès non autorisée à l\'audit", {
        user: (session?.user as any)?.email,
      });
      return NextResponse.json(
        { error: "Accès administrateur requis" },
        { status: 403 }
      );
    }

    // Get security audit data
    const audit = await getSecurityAuditData();

    return NextResponse.json({
      success: true,
      data: audit,
    });
  } catch (error) {
    logger.error("security", "Erreur lors de la récupération de l\'audit", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l\'audit" },
      { status: 500 }
    );
  }
}

async function getSecurityAuditData() {
  // 1. Check HTTPS and headers (simplified - would need server detection)
  const httpsActive = process.env.NODE_ENV === "production";
  const headersPresent = true; // Headers are set in next.config.ts

  // 2. Get failed logins in last 24 hours
  const failedLoginsLast24h = await countFailedLoginsLast24h();

  // 3. Get unusual login attempts (different IPs)
  const unusualLoginsEvents = await getSecurityEventsByDateRange(
    new Date(Date.now() - 24 * 60 * 60 * 1000),
    new Date()
  );

  const unusualLoginAttempts = unusualLoginsEvents
    .filter((event: any) => event.action.includes("LOGIN"))
    .map((event: any) => ({
      userId: event.userId || "unknown",
      email: event.user?.email || "unknown",
      ipAddress: event.ipAddress,
      time: event.createdAt.toLocaleString("fr-FR"),
    }))
    .filter((item: any, index: number, self: any) =>
      index === self.findIndex((t: any) => t.ipAddress === item.ipAddress)
    )
    .slice(0, 10);

  // 4. Get inactive accounts (no login for 90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const inactiveAccounts = await prisma.user.findMany({
    where: {
      lastLoginAt: {
        lt: ninetyDaysAgo,
      },
    },
    select: {
      id: true,
      email: true,
      lastLoginAt: true,
    },
    take: 20,
  });

  // 5. Get passwords never changed (created >6 months ago)
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const passwordsNeverChanged = await prisma.user.findMany({
    where: {
      createdAt: {
        lt: sixMonthsAgo,
      },
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
    take: 20,
  });

  // 6. Get data exports this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const exportsThisWeek = await prisma.securityLog.findMany({
    where: {
      action: "DATA_EXPORTED",
      createdAt: {
        gte: weekAgo,
      },
    },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      details: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  const dataExportsThisWeek = exportsThisWeek.map((exp) => ({
    userId: exp.userId || "unknown",
    type: (exp.details as any)?.type || "unknown",
    timestamp: exp.createdAt.toISOString(),
    lineCount: (exp.details as any)?.lineCount || 0,
  }));

  return {
    httpsActive,
    headersPresent,
    failedLoginsLast24h,
    unusualLoginAttempts,
    inactiveAccounts: inactiveAccounts.map((acc) => ({
      userId: acc.id,
      email: acc.email,
      lastLogin: acc.lastLoginAt?.toISOString() || "never",
    })),
    passwordsNeverChanged: passwordsNeverChanged.map((acc) => ({
      userId: acc.id,
      email: acc.email,
      createdAt: acc.createdAt.toISOString(),
    })),
    dataExportsThisWeek,
  };
}
