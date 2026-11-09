FROM node:22-alpine

WORKDIR /app

# Copia só os manifests primeiro para aproveitar o cache de camadas
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o restante do código
COPY . .

ENV NODE_ENV=production

EXPOSE 3000

# Roda sem privilégios de root
USER node

CMD ["node", "index.js"]