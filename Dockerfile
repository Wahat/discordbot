FROM node:12-buster
WORKDIR /home/node

ARG git_token
RUN git clone -b v1.4.0-alpha https://${git_token}:x-oauth-basic@github.com/henrymxu/discordbot.git discordbot

RUN apt-get update && apt-get install -y \
  git \
  cmake \
  lame \
  libasound-dev \
  espeak \
  ffmpeg \
  libmagic-dev \
  libatlas-base-dev \
  python-pip

WORKDIR /home/node/discordbot
run npm install
RUN chmod +x setup.sh
RUN ./setup.sh

# Python voice recognition
RUN pip install SpeechRecognition

# Other
RUN mkdir -p configs
RUN mkdir -p clips

CMD ["node", "main.js"]
