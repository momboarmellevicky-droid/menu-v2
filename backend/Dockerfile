FROM node:20-alpine

WORKDIR /app

# Curl nécessaire pour le HEALTHCHECK
RUN apk add --no-cache curl

# Installation de TOUTES les dépendances (dev incluses, nécessaires pour le build TypeScript)
COPY package*.json ./
RUN npm ci

# Copie du code source
COPY . .

# Build TypeScript
RUN npm run build

# Allègement : ne garder que les dépendances de production après le build
RUN npm prune --production

# Exposition du port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Démarrage
CMD ["node", "dist/server.js"]
