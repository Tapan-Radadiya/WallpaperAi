FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json ./

RUN npm i -g pnpm

RUN pnpm i


COPY . .

COPY .env ./

RUN pnpm run build

EXPOSE 3002


CMD [ "pnpm" ,"run", "start:prod"]