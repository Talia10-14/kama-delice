import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

/**
 * POST /api/admin/init-db
 * Initialize database with seed data (admin user + menus)
 * DANGER: Only use once on fresh database
 * Requires secret via header (x-init-secret) or body (secret)
 */
export async function POST(request: NextRequest) {
  try {
    // Get secret from header OR body
    let secret = request.headers.get('x-init-secret');
    
    if (!secret) {
      const body = await request.json().catch(() => ({}));
      secret = body.secret;
    }

    const initSecret = process.env.INIT_SECRET;

    console.log('🔐 Init DB called');
    console.log('INIT_SECRET exists:', !!initSecret);
    console.log('Secret provided:', !!secret);
    console.log('Secret match:', secret === initSecret);

    if (!initSecret) {
      console.error('❌ INIT_SECRET not configured on server');
      return NextResponse.json(
        { 
          error: 'INIT_SECRET not configured', 
          debug: 'Server environment variable missing'
        },
        { status: 500 }
      );
    }

    if (!secret || secret !== initSecret) {
      console.error('❌ Secret mismatch or missing');
      return NextResponse.json(
        { 
          error: 'Unauthorized - Missing or invalid secret',
          debug: `Provided: ${secret ? 'yes' : 'no'}, Match: ${secret === initSecret}`
        },
        { status: 401 }
      );
    }

    console.log('🚀 Starting database initialization...');

    // Delete existing data (safe reset)
    console.log('Cleaning existing data...');
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.user.deleteMany();
    await prisma.order.deleteMany();
    await prisma.menu.deleteMany();
    await prisma.message.deleteMany();

    // Create permissions
    console.log('Creating permissions...');
    const permissionCodes = [
      'voir_commandes',
      'modifier_commandes',
      'valider_commande_perso',
      'gerer_annulations',
      'gerer_menus',
      'gerer_personnel',
      'voir_presences',
      'voir_rapports',
      'gerer_messages',
      'admin_uniquement',
    ];

    const permissions = await Promise.all(
      permissionCodes.map((code) =>
        prisma.permission.create({
          data: { code },
        })
      )
    );

    const permissionMap = permissions.reduce(
      (acc, perm) => {
        acc[perm.code] = perm.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Create Admin role with all permissions
    console.log('Creating Admin role...');
    const adminRole = await prisma.role.create({
      data: {
        libelle: 'Admin',
        rolePermissions: {
          create: permissionCodes.map((code) => ({
            permissionId: permissionMap[code],
          })),
        },
      },
    });

    // Create other roles
    console.log('Creating other roles...');
    const responsableCommandesRole = await prisma.role.create({
      data: {
        libelle: 'Responsable Commandes',
        rolePermissions: {
          create: [
            'voir_commandes',
            'modifier_commandes',
            'valider_commande_perso',
            'gerer_annulations',
          ].map((code) => ({
            permissionId: permissionMap[code],
          })),
        },
      },
    });

    const livreurRole = await prisma.role.create({
      data: {
        libelle: 'Livreur',
        rolePermissions: {
          create: ['voir_commandes', 'modifier_commandes'].map((code) => ({
            permissionId: permissionMap[code],
          })),
        },
      },
    });

    const caissierRole = await prisma.role.create({
      data: {
        libelle: 'Caissier',
        rolePermissions: {
          create: ['voir_commandes', 'modifier_commandes', 'valider_commande_perso'].map(
            (code) => ({
              permissionId: permissionMap[code],
            })
          ),
        },
      },
    });

    const gestionnaireMenusRole = await prisma.role.create({
      data: {
        libelle: 'Gestionnaire Menus',
        rolePermissions: {
          create: ['gerer_menus'].map((code) => ({
            permissionId: permissionMap[code],
          })),
        },
      },
    });

    const rhRole = await prisma.role.create({
      data: {
        libelle: 'RH',
        rolePermissions: {
          create: [
            'gerer_personnel',
            'voir_presences',
            'voir_rapports',
            'gerer_messages',
          ].map((code) => ({
            permissionId: permissionMap[code],
          })),
        },
      },
    });

    // Create Admin user
    console.log('Creating Admin user...');
    const hashedPassword = await bcrypt.hash('Admin1234', 10);

    const adminEmployee = await prisma.employee.create({
      data: {
        nom: 'Admin',
        prenom: 'Système',
        typeContrat: 'EMPLOYE',
        dateEntree: new Date(),
        statut: 'ACTIF',
        roleId: adminRole.id,
      },
    });

    await prisma.user.create({
      data: {
        email: 'admin@kama-delices.com',
        password: hashedPassword,
        employeeId: adminEmployee.id,
      },
    });

    // Create sample menus
    console.log('Creating sample menus...');
    const sampleMenus = [
      {
        name: 'Salade Niçoise',
        description: 'Salade fraîche avec œuf et anchois',
        category: 'Entrée',
        price: 8.5,
      },
      {
        name: 'Couscous Royal',
        description: 'Couscous aux merguez et agneau',
        category: 'Plat Principal',
        price: 16.0,
      },
      {
        name: 'Tiramisu',
        description: 'Dessert italien traditionnel',
        category: 'Dessert',
        price: 6.0,
      },
      {
        name: 'Jus Frais',
        description: 'Jus orange, pomme ou raisin',
        category: 'Boisson',
        price: 3.5,
      },
    ];

    for (const menu of sampleMenus) {
      await prisma.menu.create({
        data: menu,
      });
    }

    console.log('✅ Database initialized successfully!');

    return NextResponse.json(
      {
        success: true,
        message: 'Database initialized successfully!',
        data: {
          adminUser: 'admin@kama-delices.com',
          adminPassword: 'Admin1234',
          rolesCreated: 6,
          permissionsCreated: permissionCodes.length,
          menusCreated: sampleMenus.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Database initialization error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/init-db?secret=<SECRET>
 * Alternative endpoint accessible via browser for testing
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');

  if (!secret) {
    return NextResponse.json(
      { 
        error: 'Missing secret parameter',
        usage: '/api/admin/init-db?secret=YOUR_SECRET_HERE'
      },
      { status: 400 }
    );
  }

  // Reuse POST logic by calling it
  const postRequest = new NextRequest(request.url.replace('?secret=', ''), {
    method: 'POST',
    headers: {
      ...request.headers,
      'x-init-secret': secret,
    },
  });

  return POST(postRequest);
}
