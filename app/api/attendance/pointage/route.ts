import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeEmail } from '@/lib/sanitize';
import { attendanceSchema } from '@/lib/validators';



export async function POST(request: Request) {
  try {
    // Rate limiting - strict tier for authentication endpoint
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`${ip}:/api/attendance/pointage`, 'strict');
    if (!rateLimit.success) {
      return Response.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': (rateLimit.resetInSeconds || 60).toString() } }
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = attendanceSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 422 }
      );
    }

    // Sanitize email
    const email = validation.data.email;
    const password = validation.data.password;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    if (!user) {
      return Response.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return Response.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    if (!user.employee) {
      return Response.json(
        { error: 'Employé associé non trouvé' },
        { status: 404 }
      );
    }

    // Find existing attendance for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: user.employee.id,
        datePointage: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    let message = '';
    if (existingAttendance && !existingAttendance.heureDepart) {
      // Record departure time
      await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          heureDepart: new Date(),
        },
      });
      message = `Départ enregistré à ${new Date().toLocaleTimeString('fr-FR')}`;
    } else {
      // Record arrival time
      await prisma.attendance.create({
        data: {
          employeeId: user.employee.id,
          datePointage: today,
          heureArrivee: new Date(),
        },
      });
      message = `Arrivée enregistrée à ${new Date().toLocaleTimeString('fr-FR')}`;
    }

    return Response.json({
      message,
      employee: {
        nom: user.employee.nom,
        prenom: user.employee.prenom,
      },
    });
  } catch (error) {
    console.error('Error during pointage:', error);
    return Response.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
