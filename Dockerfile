FROM node:20-bullseye

RUN corepack enable

WORKDIR /luna

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile \
  --allow-build=sharp \
  --allow-build=protobufjs \
  --allow-build=baileys

COPY . .

ENV IS_DOCKER=true

CMD ["pnpm", "start"]