# syntax=docker/dockerfile:1

# --- Build stage -----------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Install from the lockfile first so dependency layers cache independently
# of application source changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines env vars at build time, so the API URL must be present here
# rather than at container start.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# --- Serve stage -----------------------------------------------------------
FROM nginx:1.29-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
