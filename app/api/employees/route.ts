import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeString, sanitizeEmail, sanitizeTelephone } from '@/lib/sanitize';
import { employeeSchema } from '@/lib/validators';
import { verifyCsrfMiddleware } from '@/lib/csrf';
import { logSecurityEvent, SecurityAction, SecuritySeverity } from '@/lib/security-logger';
import { sendWelcomeEmail } from '@/lib/email';
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
    // CSRF Token validation
    const csrfValid = await verifyCsrfMiddleware(request);
    if (!csrfValid) {
      const ip = getClientIp(request);
      await logSecurityEvent({
        action: SecurityAction.CSRF_VIOLATION,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: SecuritySeverity.WARNING,
      });
      return Response.json({ error: 'CSRF token invalid or missing' }, { status: 403 });
    }

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`${ip}:/api/employees`, 'normal');
    if (!rateLimit.success) {
      return Response.json(
        { error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': (rateLimit.resetInSeconds || 60).toString() } }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPermissions = (session.user as any).permissions || [];
    if (!userPermissions.includes('gerer_personnel')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = employeeSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation errors:', validation.error.issues);
      return Response.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 422 }
      );
    }

    // Sanitize inputs
    const sanitized = {
      nom: sanitizeString(validation.data.nom, 100),
      prenom: sanitizeString(validation.data.prenom, 100),
      telephone: validation.data.telephone ? sanitizeTelephone(validation.data.telephone) : null,
      email: validation.data.email ? (sanitizeEmail(validation.data.email) || validation.data.email) : undefined,
    };

    const employee = await prisma.employee.create({
      data: {
        nom: sanitized.nom,
        prenom: sanitized.prenom,
        telephone: sanitized.telephone,
        typeContrat: validation.data.typeContrat,
        dateEntree: validation.data.dateEntree,
        dateFin: validation.data.dateFin || null,
        statut: 'ACTIF',
        roleId: validation.data.roleId || 1,
      },
      include: { role: true },
    });

    // Log security event - employee creation
    await logSecurityEvent({
      userId: (session.user as any).id,
      action: SecurityAction.EMPLOYEE_CREATED,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { employeeId: employee.id, nom: sanitized.nom, prenom: sanitized.prenom },
      severity: SecuritySeverity.WARNING,
    });

    // Create user if email provided
    let userPassword = null;
    if (sanitized.email) {
      userPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(userPassword, 10);

      await prisma.user.create({
        data: {
          email: sanitized.email,
          password: hashedPassword,
          employeeId: employee.id,
        },
      });

      // Send welcome email with credentials
      try {
        await sendWelcomeEmail({
          email: sanitized.email,
          nom: sanitized.nom,
          prenom: sanitized.prenom,
          password: userPassword,
        });
      } catch (emailError) {
        console.error('Email sending failed, but employee was created:', emailError);
      }
    }

    return Response.json({
      ...employee,
      userPassword: userPassword,
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Check for specific database errors
    let statusCode = 500;
    let errorMessage = 'Failed to create employee';
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      statusCode = 409;
      errorMessage = 'Email already exists';
    }
    
    return Response.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
