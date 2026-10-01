FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_BASE_URL=
ARG VITE_SEND_TENANT_HEADER=false
ARG VITE_DEFAULT_EMPRESA_ID=1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SEND_TENANT_HEADER=$VITE_SEND_TENANT_HEADER
ENV VITE_DEFAULT_EMPRESA_ID=$VITE_DEFAULT_EMPRESA_ID
RUN npm run build

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
