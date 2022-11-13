FROM node:lts-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p ./public ./data \
    && cd ./client \
    && npm install \
    && npm run build \
    && cd .. \
    && cp -r ./client/dist/* ./public \
    && rm -rf ./client

FROM node:lts-bullseye-slim
COPY --from=builder /app .
EXPOSE 3001

CMD ["node", "index.js"]