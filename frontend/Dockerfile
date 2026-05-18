# Build stage
FROM node:lts-alpine AS builder
WORKDIR /app

# Install dependencies first — cached as long as package-lock.json doesn't change
COPY package.json package-lock.json .
RUN npm ci

COPY . .
# No VITE_API_URL build arg needed — injected at runtime via the /config.js nginx location
RUN npm run build

# Runtime stage — nginx:alpine is ~5 MB and purpose-built for serving static files
FROM nginx:alpine

# Static build output from the previous stage
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx's official image processes *.template files in this directory at startup,
# substituting env vars via envsubst — covers both NGINX_PORT and VITE_API_URL
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

ENV PORT=80
ENV VITE_API_URL=
# Backend internal URL for the nginx proxy (e.g. Railway private networking URL).
# When set, /api/* requests are proxied to this URL — no cross-origin cookie issues.
ENV BACKEND_URL=
EXPOSE ${PORT}
