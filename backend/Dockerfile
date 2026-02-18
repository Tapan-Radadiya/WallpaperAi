# First Stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm i

COPY . .

RUN pnpm run build

# Stage 2
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod

COPY --from=builder /usr/src/app/dist ./dist

COPY .env ./

EXPOSE 3002

CMD [ "pnpm" ,"run", "start:prod"]