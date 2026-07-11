FROM node:24-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
RUN npm ci
COPY client ./client
RUN npm run build

FROM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    DATABASE_FILE=/data/db.json

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
RUN npm ci --omit=dev --ignore-scripts --workspaces=false && npm cache clean --force
COPY index.js ./index.js
COPY server ./server
COPY --from=builder /app/client/dist ./client/dist

RUN mkdir -p /data && chown -R node:node /app /data
USER node

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1
CMD ["node", "index.js"]
