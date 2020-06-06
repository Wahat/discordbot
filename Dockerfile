FROM node:12-buster
RUN mkdir -p /home/node/discordbot/node_modules && chown -R node:node /home/node/discordbot
WORKDIR /home/node/discordbot

COPY package*.json ./

RUN apt-get update && apt-get install -y \
  lame \
  git \
  cmake \
  libmagic-dev \
  libatlas-base-dev
 
run npm install
COPY --chown=node:node . .
RUN chmod +x setup.sh
RUN ./setup.sh

CMD ["node", "main.js"]
