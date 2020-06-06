#!/bin/bash

# Snowboy setup (assuming dependencies are installed)
if [ ! -d "snowboy" ]; then
  git clone https://github.com/Kitt-AI/snowboy.git
fi

cd snowboy
npm uninstall snowboy
npm install
./node_modules/node-pre-gyp/bin/node-pre-gyp clean configure build

# Python voice recognition
pip install SpeechRecognition

# Other
mkdir -p configs
mkdir -p clips