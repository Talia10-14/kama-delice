import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';



export async function POST(request: Request) {
  try {
    const body = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { employee: true },
    });

    if (!user) {
      return Response.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(
      body.password,
      user.password
    );

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
