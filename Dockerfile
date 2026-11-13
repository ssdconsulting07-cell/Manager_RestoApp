# syntax=docker/dockerfile:1
# Back-office Manager SenYummies : compilation Vite puis service statique par
# nginx. La configuration (adresse de l'API, contact support) est lue au
# demarrage du conteneur : voir docker/40-config-runtime.sh et README
# (section Docker).

# --- 1. Compilation ---------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# --- 2. Service ----------------------------------------------------------------
FROM nginx:1.27-alpine

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/40-config-runtime.sh /docker-entrypoint.d/40-config-runtime.sh
# Fins de ligne Unix garanties (depot clone sous Windows avec autocrlf).
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-config-runtime.sh /etc/nginx/templates/default.conf.template \
 && chmod +x /docker-entrypoint.d/40-config-runtime.sh
COPY --from=build /app/dist /usr/share/nginx/html

# Configuration de l'app (lue par le navigateur via /config.js).
ENV API_BASE_URL=/api/v1 \
    SUPPORT_TELEPHONE= \
    SUPPORT_EMAIL=
# Configuration nginx : ou relayer /api/.
ENV API_UPSTREAM=http://host.docker.internal:8080 \
    NGINX_RESOLVER=127.0.0.11

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
