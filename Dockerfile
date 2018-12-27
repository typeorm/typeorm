ARG NODE_VERSION=10
FROM node:${NODE_VERSION}

COPY package.json package-lock.json ./app/

WORKDIR /app

RUN npm ci

COPY . .

RUN npm run lint

RUN npm run build
