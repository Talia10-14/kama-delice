-- CreateTable
CREATE TABLE "restaurant_settings" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL DEFAULT 'Kama-Délices',
    "adresse" TEXT NOT NULL DEFAULT '',
    "telephone" TEXT NOT NULL DEFAULT '',
    "heureOuverture" TEXT NOT NULL DEFAULT '08:00',
    "heureFermeture" TEXT NOT NULL DEFAULT '22:00',
    "joursOuverture" TEXT NOT NULL DEFAULT 'Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi,Dimanche',
    "email" TEXT NOT NULL DEFAULT '',
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "emailNouvelleCommande" BOOLEAN NOT NULL DEFAULT true,
    "emailAnnulationCommande" BOOLEAN NOT NULL DEFAULT true,
    "emailNouveauMessage" BOOLEAN NOT NULL DEFAULT true,
    "emailRapportJournalier" BOOLEAN NOT NULL DEFAULT true,
    "emailRapportHebdomadaire" BOOLEAN NOT NULL DEFAULT false,
    "emailRapportMensuel" BOOLEAN NOT NULL DEFAULT false,
    "emailAlerteStagiaire" BOOLEAN NOT NULL DEFAULT true,
    "reportFrequency" TEXT NOT NULL DEFAULT 'daily',
    "delaiAlerteStagiaire" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);
