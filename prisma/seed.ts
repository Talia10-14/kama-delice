import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({});

async function main() {
  // Delete existing data
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

  // Create roles with their permissions
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
        create: [
          'voir_commandes',
          'modifier_commandes',
          'valider_commande_perso',
        ].map((code) => ({
          permissionId: permissionMap[code],
        })),
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

  // Create default admin user
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

  // Create some sample menus
  const categories = ['Entrée', 'Plat Principal', 'Dessert', 'Boisson'];
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

  console.log('✓ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
