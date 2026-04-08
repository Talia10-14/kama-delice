FROM node:20-alpine

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Générer les clients Prisma
RUN npx prisma generate

# Builder l'application
RUN npm run build

# Exposer le port
EXPOSE 4000

# Lancer l'application
CMD ["npm", "start"]
