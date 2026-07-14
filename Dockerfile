FROM node:24-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
RUN npm ci
COPY index.js ./index.js
COPY server ./server
COPY test ./test
COPY client ./client
RUN npm run check

FROM node:24-alpine AS production-dependencies

WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
RUN npm ci --omit=dev --ignore-scripts --workspaces=false && npm cache clean --force

FROM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    DATABASE_FILE=/data/db.json

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./package.json
COPY --chown=node:node index.js ./index.js
COPY --chown=node:node server ./server
COPY --from=builder --chown=node:node /app/client/dist ./client/dist

RUN mkdir -p /data && chown node:node /data
USER node

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1
CMD ["node", "index.js"]
