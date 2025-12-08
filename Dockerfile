# OR node:20-bookworm
FROM node:20-bullseye
RUN apt-get update && apt-get install -y git
WORKDIR /luna
COPY package*.json ./
RUN npm install
RUN npm install -g pm2
COPY . .

ENV IS_DOCKER=true

CMD ["pm2-runtime", "npm", "--", "start"]
