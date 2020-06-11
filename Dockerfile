FROM node:12-buster
WORKDIR /home/node

RUN git clone -b master https://github.com/henrymxu/discordbot.git discordbot

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

CMD ["node", "--max-old-space-size=768 main.js"]
