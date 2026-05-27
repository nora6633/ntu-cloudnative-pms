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
# Backend hostname and port for the nginx upstream pool (e.g. Railway private networking).
# Split into two vars so nginx can use them in an upstream block with the "resolve" flag.
ENV BACKEND_HOST=
ENV BACKEND_PORT=
# Tells the nginx Docker entrypoint to read /etc/resolv.conf and export
# NGINX_LOCAL_RESOLVERS — used by nginx.conf.template for dynamic DNS resolution.
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=true
EXPOSE ${PORT}
