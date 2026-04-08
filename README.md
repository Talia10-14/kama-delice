# Kama — Kama-Délices

Système de gestion complet pour Kama-Délices (restaurant/catering). Application composée d'un backend Express et d'un frontend Next.js.

## 🏗️ Architecture

- **backend/** : API REST Express (port 4000)
  - Routes d'authentification, employés, rôles, permissions
  - Gestion des commandes, menus, finances, messages
  - Notifications, statistiques, tâches cron
  
- **frontend/** : Application Next.js (port 3000)
  - Interface utilisateur avec React
  - Authentification via NextAuth + JWT backend
  - Gestion complète des fonctionnalités de l'application

## 📋 Prérequis

- Node.js 18+ 
- npm 8+
- PostgreSQL 15+ (ou Docker)
- Git

## 🚀 Démarrage rapide

### Installation

```bash
# Cloner le repo
git clone [url]
cd kama

# Installer toutes les dépendances
npm run install:all

# Configurer les variables d'environnement
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Éditer les fichiers .env avec vos configurations
```

### Initialiser la base de données

```bash
# Exécuter les migrations Prisma
npm run db:migrate

# Remplir la base de données avec les données par défaut
npm run db:seed
```

### Lancer l'application

```bash
# Mode développement - Lance backend + frontend ensemble
npm run dev

# OU lancer les services séparément
npm run dev:backend  # Terminal 1 - Backend sur port 4000
npm run dev:frontend # Terminal 2 - Frontend sur port 3000
```

L'application sera disponible sur :
- Frontend : http://localhost:3000
- Backend API : http://localhost:4000/api
- Health check : http://localhost:4000/health

## 🐳 Avec Docker

```bash
# Construire les images et lancer les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

## 🔐 Authentification

### Compte administrateur par défaut

- **Email** : admin@kama-delices.com
- **Mot de passe** : Admin1234

> ⚠️ À changer immédiatement après la première connexion !

## 📦 Scripts disponibles

### À la racine

```bash
npm run dev              # Mode développement complet
npm run build            # Build backend + frontend
npm run install:all      # Installer toutes les dépendances
npm run db:migrate       # Migrations Prisma
npm run db:seed          # Seed données initiales
npm run db:studio        # Ouvrir Prisma Studio
```

### Backend

```bash
cd backend
npm run dev              # Démarrer en développement
npm run build            # Builder
npm start                # Démarrer en production
npm run db:migrate       # Migrations
npm run db:seed          # Seed
npm run db:studio        # Prisma Studio
```

### Frontend

```bash
cd frontend
npm run dev              # Démarrer en développement
npm run build            # Builder
npm start                # Démarrer en production
npm run lint             # Linter
npm run type-check       # Vérifier les types
```

## 🔌 API REST

L'API Express suit une structure RESTful :

### Authentification

```
POST   /api/auth/login              - Se connecter
POST   /api/auth/register           - S'enregistrer
POST   /api/auth/refresh            - Rafraîchir le token
POST   /api/auth/logout             - Se déconnecter
GET    /api/auth/profile            - Obtenir le profil
POST   /api/auth/change-password    - Changer le mot de passe
```

### Employés

```
GET    /api/employees               - Lister les employés
GET    /api/employees/:id           - Obtenir un employé
POST   /api/employees               - Créer un employé
PUT    /api/employees/:id           - Modifier un employé
DELETE /api/employees/:id           - Supprimer un employé
```

### Autres ressources

- `/api/roles` - Gestion des rôles
- `/api/permissions` - Gestion des permissions
- `/api/attendance` - Pointage
- `/api/commandes` - Gestion des commandes
- `/api/menus` - Gestion des menus
- `/api/clients` - Gestion des clients
- `/api/finances` - Gestion des finances
- `/api/messages` - Gestion des messages
- `/api/stats` - Statistiques
- `/api/notifications` - Notifications
- `/api/settings` - Paramètres

## 🌳 Structure des répertoires

```
kama/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration (DB, JWT, CORS)
│   │   ├── middlewares/     # Middlewares Express
│   │   ├── routes/          # Routes API
│   │   ├── controllers/     # Logique des routes
│   │   ├── services/        # Services métier
│   │   ├── validators/      # Schémas Zod
│   │   ├── utils/           # Utilitaires
│   │   └── index.ts         # Point d'entrée
│   ├── prisma/              # Schéma et migrations
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── app/                 # Pages et layouts Next.js
│   ├── components/          # Composants React
│   ├── context/             # Contextes React
│   ├── hooks/               # Hooks personnalisés
│   ├── lib/                 # Utilitaires et client API
│   ├── public/              # Fichiers statiques
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── .env.example
│
├── package.json             # Root scripts
├── docker-compose.yml       # Configuration Docker Compose
├── .gitignore
└── README.md
```

## 🔄 Flux de développement

### Créer une nouvelle fonctionnalité backend

1. Créer un validator Zod dans `backend/src/validators/`
2. Créer un contrôleur dans `backend/src/controllers/`
3. Créer une route dans `backend/src/routes/`
4. Importer la route dans `backend/src/index.ts`
5. Tester avec curl ou Postman

### Créer une nouvelle fonctionnalité frontend

1. Créer des composants dans `frontend/components/`
2. Utiliser le client API : `import { apiClient } from '@/lib/api-client'`
3. Créer des pages dans `frontend/app/`
4. Tester en développement

## 🔒 Sécurité

- Authentification JWT
- Rate limiting
- Sanitisation des inputs
- Protection CSRF
- Headers de sécurité
- Logging des événements sensibles
- Encryption des données sensibles

## 📝 Variables d'environnement

### Backend (.env)

```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/kama
JWT_SECRET=your_secret_key
ENCRYPTION_KEY=your_32_char_key
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

## 🤝 Contribution

1. Créer une branche : `git checkout -b feature/nom-feature`
2. Commit vos changements : `git commit -m 'Ajouter feature'`
3. Push : `git push origin feature/nom-feature`
4. Créer une Pull Request

## 📞 Support

Pour tout problème :
1. Vérifier que Node.js 18+ est installé
2. Vérifier les fichiers .env
3. Vérifier que PostgreSQL est en cours d'exécution
4. Voir les logs : `npm run dev`

## 📄 Licence

Propriété de Kama-Délices
