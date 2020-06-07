#!/bin/bash

# Snowboy setup (assuming dependencies are installed)
if [ ! -d "snowboy" ]; then
  git clone https://github.com/henrymxu/snowboy.git
fi

cd snowboy
npm uninstall snowboy
npm install
./node_modules/node-pre-gyp/bin/node-pre-gyp clean configure build

cd ..