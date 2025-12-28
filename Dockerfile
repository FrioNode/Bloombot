FROM node:20-bullseye

RUN corepack enable

WORKDIR /luna

COPY package.json ./

RUN pnpm install

COPY . .

ENV IS_DOCKER=true

CMD ["pnpm", "start"]