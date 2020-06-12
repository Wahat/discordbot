FROM node:12-buster
WORKDIR /home/node

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

# Python voice recognition
RUN pip install SpeechRecognition

RUN git clone -b master https://github.com/henrymxu/discordbot.git discordbot
WORKDIR /home/node/discordbot
run npm install

RUN chmod +x setup.sh
RUN ./setup.sh

# Other
RUN mkdir -p configs
RUN mkdir -p clips

#"--max_old_space_size=768"
CMD ["node", "main.js"]
