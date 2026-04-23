# Stage 1 — build des assets front Laravel (Vite) avec Node officiel (évite le Node Debian obsolète / non supporté).
FROM node:22-bookworm-slim AS builder

WORKDIR /var/www

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# Stage 2 — Nginx minimal pour servir public/
FROM nginx:1.27-alpine

COPY ./docker/production/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /var/www/public /var/www/public

WORKDIR /var/www/public

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
