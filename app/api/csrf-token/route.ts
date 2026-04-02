/**
 * CSRF Token endpoint
 * Provides CSRF tokens for protected forms
 */

import { NextRequest, NextResponse } from "next/server";
import { getCsrfToken } from "@/lib/csrf";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Rate limiting (public tier - 100 req/min)
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`${ip}:/api/csrf-token`, 'public');
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
        { status: 429, headers: { 'Retry-After': (rateLimit.resetInSeconds || 60).toString() } }
      );
    }

    const token = await getCsrfToken();

    const response = NextResponse.json(
      {
        success: true,
        token,
      },
      { status: 200 }
    );

    // Set CSRF cookie (httpOnly, secure, sameSite=strict)
    response.cookies.set({
      name: "x-csrf-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600, // 1 hour
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de générer le token CSRF",
      },
      { status: 500 }
    );
  }
}
