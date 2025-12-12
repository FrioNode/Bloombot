# Debian-based Node 20
FROM node:20-bullseye

RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /luna

RUN git clone https://github.com/frionode/luna.git .

RUN npm install
RUN npm install -g pm2

ENV IS_DOCKER=true

CMD ["pm2-runtime", "npm", "--", "start"]