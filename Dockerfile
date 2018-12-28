ARG NODE_VERSION=10
FROM node:${NODE_VERSION}-alpine

COPY package.json package-lock.json ./app/

WORKDIR /app

RUN npm i

COPY . .

RUN npm run lint

RUN npm run build
