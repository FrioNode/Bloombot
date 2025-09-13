FROM node:20-alpine
RUN apk add --no-cache git
WORKDIR /bloombot
COPY package*.json ./
RUN npm install
RUN npm install pm2 -g
COPY . .

ENV IS_DOCKER=true

CMD ["pm2-runtime", "npm", "--", "start"]