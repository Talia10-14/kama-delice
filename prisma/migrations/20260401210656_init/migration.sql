-- CreateEnum
CREATE TYPE "TypeContrat" AS ENUM ('EMPLOYE', 'STAGIAIRE', 'PRESTATAIRE');

-- CreateEnum
CREATE TYPE "StatutEmploye" AS ENUM ('ACTIF', 'INACTIF');

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "employeeId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "typeContrat" "TypeContrat" NOT NULL,
    "dateEntree" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "statut" "StatutEmploye" NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "datePointage" TIMESTAMP(3) NOT NULL,
    "heureArrivee" TIMESTAMP(3) NOT NULL,
    "heureDepart" TIMESTAMP(3),

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customOrder" BOOLEAN NOT NULL DEFAULT false,
    "baseOrderId" TEXT,
    "refusalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "photoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "senderPhone" TEXT,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
