import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * POST /api/admin/migrate-db
 * Apply Prisma migrations to create database tables
 * Must be done before seed
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Check for secret header
    const secret = request.headers.get('x-init-secret');
    const initSecret = process.env.INIT_SECRET;

    if (!initSecret || secret !== initSecret) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid secret' },
        { status: 401 }
      );
    }

    console.log('🚀 Starting Prisma migrations...');

    // Execute prisma db push to create tables
    const { stdout, stderr } = await execPromise('npx prisma db push --skip-generate', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    console.log('📋 Migration output:', stdout);
    if (stderr) {
      console.warn('⚠️ Migration warnings:', stderr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Database migrations applied successfully!',
        output: stdout,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Migration error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply migrations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/migrate-db?secret=<SECRET>
 * Alternative endpoint for browser access
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');

  if (!secret) {
    return NextResponse.json(
      {
        error: 'Missing secret parameter',
        usage: '/api/admin/migrate-db?secret=YOUR_SECRET_HERE',
      },
      { status: 400 }
    );
  }

  // Reuse POST logic
  const postRequest = new NextRequest(request.url.replace('?secret=', ''), {
    method: 'POST',
    headers: {
      ...request.headers,
      'x-init-secret': secret,
    },
  });

  return POST(postRequest);
}
