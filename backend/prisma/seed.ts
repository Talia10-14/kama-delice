// learn more about how to seed your database here: https://pris.ly/d/seeding-and-examples

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  // Supprimer les données existantes (optionnel)
  // await prisma.commandeItem.deleteMany();
  // await prisma.commande.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.role.deleteMany();
  // await prisma.permission.deleteMany();

  // Créer les permissions
  const permissionsList = [
    { name: 'Créer employé', codeName: 'create_employee' },
    { name: 'Modifier employé', codeName: 'update_employee' },
    { name: 'Supprimer employé', codeName: 'delete_employee' },
    { name: 'Créer rôle', codeName: 'create_role' },
    { name: 'Modifier rôle', codeName: 'update_role' },
    { name: 'Supprimer rôle', codeName: 'delete_role' },
    { name: 'Créer permission', codeName: 'create_permission' },
    { name: 'Modifier permission', codeName: 'update_permission' },
    { name: 'Supprimer permission', codeName: 'delete_permission' },
    { name: 'Gérer commandes', codeName: 'manage_commandes' },
    { name: 'Gérer menus', codeName: 'manage_menus' },
    { name: 'Gérer finances', codeName: 'manage_finances' },
    { name: 'Voir statistiques', codeName: 'view_stats' },
    { name: 'Gérer messages', codeName: 'manage_messages' },
  ];

  const permissions = [];
  for (const perm of permissionsList) {
    const permission = await prisma.permission.upsert({
      where: { codeName: perm.codeName },
      update: {},
      create: perm,
    });
    permissions.push(permission);
  }

  console.log(`✅ ${permissions.length} permissions créées`);

  // Créer les rôles
  const adminRole = await prisma.role.upsert({
    where: { codeName: 'admin' },
    update: {},
    create: {
      name: 'Administrateur',
      codeName: 'admin',
      description: 'Accès complet à l\'application',
      permissions: {
        connect: permissions.map((p) => ({ id: p.id })),
      },
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { codeName: 'manager' },
    update: {},
    create: {
      name: 'Responsable',
      codeName: 'manager',
      description: 'Gestion des opérations',
      permissions: {
        connect: permissions
          .filter(
            (p) =>
              p.codeName.includes('manage') || p.codeName.includes('view')
          )
          .map((p) => ({ id: p.id }))
      },
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { codeName: 'employee' },
    update: {},
    create: {
      name: 'Employé',
      codeName: 'employee',
      description: 'Employé standard',
    },
  });

  console.log('✅ Rôles créés');

  // Créer l'utilisateur admin avec un mot de passe temporaire sécurisé
  // Demander à l'administrateur de changer ce mot de passe lors du premier login
  const adminPassword = await hashPassword('ADm1n1234');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kama-delices.com' },
    update: {},
    create: {
      email: 'admin@kama-delices.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      roleId: adminRole.id,
    },
  });

  console.log('✅ Utilisateur admin créé:', adminUser.email);
  console.log('🔑 Email: admin@kama-delices.com');
  console.log('🔑 Mot de passe temporaire: ADm1n1234');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ Seed terminé');
  })
  .catch(async (e) => {
    console.error('❌ Erreur lors du seed:', e);
    await prisma.$disconnect();
    // @ts-ignore
    process.exit(1);
  });
