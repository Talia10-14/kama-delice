import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';



export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employees = await prisma.employee.findMany({
      include: { role: true },
    });

    return Response.json(employees);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch employees' },
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
    if (!userPermissions.includes('gerer_personnel')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const employee = await prisma.employee.create({
      data: {
        nom: body.nom,
        prenom: body.prenom,
        telephone: body.telephone,
        typeContrat: body.typeContrat,
        dateEntree: new Date(body.dateEntree),
        dateFin: body.dateFin ? new Date(body.dateFin) : null,
        statut: 'ACTIF',
        roleId: parseInt(body.roleId),
      },
      include: { role: true },
    });

    // Create user if email provided
    let userPassword = null;
    if (body.email) {
      userPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(userPassword, 10);

      await prisma.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          employeeId: employee.id,
        },
      });
    }

    return Response.json({
      ...employee,
      userPassword: userPassword, // Return the plain password only once
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return Response.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
