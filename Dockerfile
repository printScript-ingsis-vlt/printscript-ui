# Buildea la vite application con la version de Node que pide el package.json
FROM node:20-alpine AS build

WORKDIR /app

# Instala dependencias
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Solo para el build de produccion
FROM nginx:1.27-alpine AS runtime

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1/health || exit 1
