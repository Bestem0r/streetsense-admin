# syntax=docker/dockerfile:1

# ---------- build ----------
# Node 24 / npm 11 matches the toolchain package-lock.json was generated with.
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# The arcgis/leaflet bundle is heavy; give the compiler headroom.
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build -- --configuration docker

# ---------- runtime ----------
FROM nginx:1.27-alpine

# The entrypoint renders templates/*.template into conf.d/ at startup; the
# filter keeps it from touching nginx's own $variables.
ENV BACKEND_ORIGIN=http://backend:9091
ENV NGINX_ENVSUBST_FILTER=^BACKEND_

COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/mp-frontend/browser /usr/share/nginx/html

EXPOSE 80
