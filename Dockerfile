FROM node:20-alpine

# Install git if you have Git dependencies (optional)
RUN apk add --no-cache git

WORKDIR /bloombot

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]

