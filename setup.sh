#!/bin/bash

if [ ! -d "snowboy" ]; then
  git clone https://github.com/Kitt-AI/snowboy.git
fi

cd snowboy
npm uninstall snowboy
npm install
./node_modules/node-pre-gyp/bin/node-pre-gyp clean configure build

pip install SpeechRecognition

mkdir -p configs
mkdir -p clips