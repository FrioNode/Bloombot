FROM node:20-alpine

# Create app directory
WORKDIR /bloombot

# Install app dependencies
COPY package*.json ./
RUN npm install -g pm2 && npm install

# Copy app source
COPY . .

# Expose a dummy port (Fly needs this even if not used)
EXPOSE 3000

# Start your bot using PM2
CMD ["pm2-runtime", "bloom.js"]