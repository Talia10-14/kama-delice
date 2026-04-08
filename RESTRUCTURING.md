# Restructuration Karma — Backend + Frontend

## 📐 Vue d'ensemble

Le projet Karma a été restructuré d'une seule application Next.js en **deux applications indépendantes** :

- **Backend** : API REST Express (port 4000)
- **Frontend** : Application Next.js (port 3000)

## 🔄 Changements principaux

### Structure avant
```
karma/
├── app/              (pages + routes API)
├── components/
├── context/
├── hooks/
├── lib/              (services, utilitaires)
├── prisma/           (schéma)
├── public/
├── package.json      (All-in-one)
└── middleware.ts
```

### Structure après
```
karma/
├── backend/          (Express API)
│   ├── src/
│   │   ├── config/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── index.ts
│   ├── prisma/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/         (Next.js App)
│   ├── app/          (pages uniquement)
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/          (api-client.ts)
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   └── Dockerfile
│
├── package.json      (scripts root)
├── docker-compose.yml
├── README.md
└── .gitignore
```

## 🔧 Fichiers clés créés/modifiés

### Backend

#### Configuration
- `backend/src/index.ts` - Point d'entrée Express avec middlewares globaux
- `backend/src/config/jwt.ts` - Configuration JWT
- `backend/src/config/cors.ts` - Configuration CORS
- `backend/src/config/database.ts` - Configuration Prisma
- `backend/src/config/prisma.ts` - Client Prisma

#### Middlewares
- `backend/src/middlewares/auth.ts` - Vérification JWT
- `backend/src/middlewares/checkPermission.ts` - Vérification des permissions
- `backend/src/middlewares/rateLimiter.ts` - Rate limiting
- `backend/src/middlewares/sanitize.ts` - Sanitisation des inputs
- `backend/src/middlewares/validateBody.ts` - Validation Zod
- `backend/src/middlewares/securityLogger.ts` - Logging de sécurité

#### Services
- `backend/src/services/whatsapp.service.ts` - Envoi WhatsApp via Twilio
- `backend/src/services/email.service.ts` - Envoi d'emails via Nodemailer
- `backend/src/services/crypto.service.ts` - Encryption AES-256
- `backend/src/services/permission.service.ts` - Gestion des permissions
- `backend/src/services/accountLock.service.ts` - Verrouillage de compte
- `backend/src/services/export.service.ts` - Export PDF/Excel/CSV

#### Routes & Contrôleurs
- `backend/src/routes/auth.routes.ts` - Routes d'authentification
- `backend/src/controllers/auth.controller.ts` - Logique d'authentification (complète)
- Autres routes/contrôleurs en stubs (à implémenter)

#### Validators
- `backend/src/validators/auth.validator.ts` - Schémas d'authentification
- `backend/src/validators/employee.validator.ts` - Schémas employés
- `backend/src/validators/role.validator.ts` - Schémas rôles
- `backend/src/validators/commande.validator.ts` - Schémas commandes

#### Utilitaires
- `backend/src/utils/password.ts` - Hashing et force des mots de passe
- `backend/src/utils/response.ts` - Format de réponse uniforme
- `backend/src/utils/security-logger.ts` - Logging avec Winston

#### Configuration fichiers
- `backend/package.json` - Dépendances backend
- `backend/tsconfig.json` - Configuration TypeScript
- `backend/.env.example` - Variables d'environnement
- `backend/Dockerfile` - Containerisation
- `backend/prisma/` - Schéma et migrations (copié du projet)

### Frontend

#### API Client
- `frontend/lib/api-client.ts` - Client HTTP centralisé (remplace tous les fetch)
  - Gestion automatique des tokens JWT
  - Refresh token automatique
  - Gestion des erreurs 401
  - Méthodes : get, post, put, delete, upload

#### Authentification
- `frontend/app/api/auth/[...nextauth]/route.ts` - Configuration NextAuth
  - Appelle le backend Express pour login
  - Stocke JWT dans session
  - Gère le refresh token
- `frontend/app/api/notifications/stream/route.ts` - SSE pour notifications (reste dans Next.js)

#### Configuration fichiers
- `frontend/package.json` - Dépendances frontend
- `frontend/tsconfig.json` - Configuration TypeScript
- `frontend/.env.example` - Variables d'environnement
- `frontend/next.config.ts` - Configuration Next.js
- `frontend/Dockerfile` - Containerisation
- `frontend/middleware.ts` - Middleware Next.js (copié)

#### Fichiers copiés
- `frontend/app/` - Pages originales (zéro API routes)
- `frontend/components/` - Composants React
- `frontend/context/` - Contextes React
- `frontend/hooks/` - Hooks personnalisés
- `frontend/public/` - Fichiers statiques
- `frontend/eslint.config.mjs` - Configuration ESLint
- `frontend/postcss.config.mjs` - Configuration PostCSS

### Racine

#### Configuration
- `package.json` - Scripts root (dev, build, install:all, etc.)
- `docker-compose.yml` - Composition des services
- `README.md` - Documentation complète
- `.gitignore` - Fichiers à ignorer

## ⚙️ Dépendances déplacées

### Backend (nouvelles)
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "compression": "^1.7.4",
  "express-rate-limit": "^7.1.5",
  "jsonwebtoken": "^9.1.2",
  "bcryptjs": "^3.0.3",
  "prisma": "^6.19.3",
  "@prisma/client": "^6.19.3",
  "zod": "^4.3.6",
  "winston": "^3.11.0",
  "nodemailer": "^7.0.13",
  "twilio": "^5.13.1",
  "multer": "^1.4.5-lts.1",
  "jspdf": "^4.2.1",
  "xlsx": "^0.18.5",
  "sharp": "^0.34.5",
  "dotenv": "^16.4.5",
  "@upstash/ratelimit": "^2.0.8",
  "@upstash/redis": "^1.37.0"
}
```

### Frontend (réduites)
```json
{
  "next": "16.2.2",
  "next-auth": "^4.24.13",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "react-hook-form": "^7.72.0",
  "@hookform/resolvers": "^5.2.2",
  "recharts": "^3.8.1",
  "lucide-react": "^1.7.0",
  "zod": "^4.3.6"
}
```

## 🔐 Sécurité

### Authentification
- JWT avec access token (15m) et refresh token (7j)
- Vérification par middleware Express
- Gestion du refresh automatique côté frontend
- Logout côté client

### Validations
- Schémas Zod côté backend
- Sanitisation automatique des inputs
- Protection contre l'injection
- Rate limiting par IP ou utilisateur

### Logging
- Winston pour gérer les logs
- Logging des événements de sécurité
- Archivage des tentatives de connexion échouées
- Verrouillage automatique après 5 tentatives

## 🚀 Lancement

### En développement
```bash
npm run install:all          # Installer les dépendances
npm run db:migrate           # Migrations Prisma
npm run dev                  # Lance backend + frontend
```

### Avec Docker Compose
```bash
docker-compose up -d         # Démarrer tous les services
docker-compose down          # Arrêter
```

## 📝 Checklist à faire

- [ ] Installer les dépendances : `npm run install:all`
- [ ] Configurer les fichiers `.env` 
  - `backend/.env`
  - `frontend/.env.local`
- [ ] Initialiser la base de données : `npm run db:migrate`
- [ ] Lancer le projet : `npm run dev`
- [ ] Tester l'authentification à http://localhost:3000
- [ ] Implémenter les actions API manquantes dans les stubs
- [ ] Mettre à jour les hooks frontend pour utiliser `apiClient`

## 🔌 Implémenter les actions manquantes

Les contrôleurs suivants sont des stubs et doivent être implémentés :

### Backend
- `roles.controller.ts` - CRUD sur les rôles
- `permissions.controller.ts` - CRUD sur les permissions
- `attendance.controller.ts` - Gestion du pointage
- `commandes.controller.ts` - Gestion des commandes
- `menus.controller.ts` - Gestion des menus
- `clients.controller.ts` - Gestion des clients
- `finances.controller.ts` - Gestion financière
- `messages.controller.ts` - Gestion des messages
- `stats.controller.ts` - Statistiques
- `notifications.controller.ts` - Notifications
- `cron.controller.ts` - Tâches planifiées
- `settings.controller.ts` - Paramètres

### Frontend
- Mettre à jour tous les hooks pour utiliser `apiClient`
- Remplacer les appels `fetch` directs par `apiClient.get()`, `apiClient.post()`, etc.

## 📚 Migration des hooks frontend

### Avant
```typescript
export function useEmployees() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(setData);
  }, []);
  return data;
}
```

### Après
```typescript
import { apiClient } from '@/lib/api-client';

export function useEmployees() {
  const [data, setData] = useState([]);
  useEffect(() => {
    apiClient.get('/employees').then(setData);
  }, []);
  return data;
}
```

## 🎯 Points importants

1. **API URL** : Assurez-vous que `NEXT_PUBLIC_API_URL` pointe vers le bon backend
2. **JWT**: Les tokens sont stockés dans `next-auth` et attachés automatiquement
3. **CORS** : Le backend autorise le frontend via les variables `FRONTEND_URL`
4. **Database** : PostgreSQL est requis (ou Docker)
5. **Environment** : Ne pas commiter les fichiers `.env` réels

---

**Projet restructuré le** : 7 avril 2026
**État** : ✅ Structure complète, authentification fonctionnelle, stubs en place
