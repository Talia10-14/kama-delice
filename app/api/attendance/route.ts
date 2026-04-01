import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';



export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPermissions = (session.user as any).permissions || [];
    if (!userPermissions.includes('voir_presences')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    const attendance = await prisma.attendance.findMany({
      where: employeeId ? { employeeId } : {},
      include: { employee: true },
      orderBy: { datePointage: 'desc' },
    });

    return Response.json(attendance);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPermissions = (session.user as any).permissions || [];
    if (!userPermissions.includes('voir_presences')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Find existing attendance for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: body.employeeId,
        datePointage: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    let attendance;
    if (existingAttendance && !existingAttendance.heureDepart) {
      // Record departure time
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          heureDepart: new Date(),
        },
      });
    } else {
      // Record arrival time
      attendance = await prisma.attendance.create({
        data: {
          employeeId: body.employeeId,
          datePointage: today,
          heureArrivee: new Date(),
        },
      });
    }

    return Response.json(attendance);
  } catch (error) {
    console.error('Error recording attendance:', error);
    return Response.json(
      { error: 'Failed to record attendance' },
      { status: 500 }
    );
  }
}
