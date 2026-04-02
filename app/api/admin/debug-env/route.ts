import { NextResponse } from 'next/server';

/**
 * GET /api/admin/debug-env
 * Check environment variables (temporary debugging)
 * DELETE THIS in production
 */
export async function GET() {
  const initSecret = process.env.INIT_SECRET;
  const databaseUrl = process.env.DATABASE_URL;
  const nodeEnv = process.env.NODE_ENV;

  return NextResponse.json(
    {
      debug: {
        INIT_SECRET: initSecret ? `Set (${initSecret.substring(0, 8)}...)` : 'NOT SET ❌',
        DATABASE_URL: databaseUrl ? `Set (${databaseUrl.substring(0, 30)}...)` : 'NOT SET ❌',
        NODE_ENV: nodeEnv,
        timestamp: new Date().toISOString(),
      },
      message:
        'If INIT_SECRET shows "NOT SET", Vercel needs to redeploy after env var changes.',
    },
    { status: 200 }
  );
}
