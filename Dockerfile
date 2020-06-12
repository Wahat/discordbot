FROMnode:12-buster
WORKDIR/home/node

RUNapt-getupdate&&apt-getinstall-y\
git\
cmake\
lame\
libasound-dev\
espeak\
ffmpeg\
libmagic-dev\
libatlas-base-dev\
python-pip

#Pythonvoicerecognition
RUNpipinstallSpeechRecognition

RUNgitclone-bmasterhttps://github.com/henrymxu/discordbot.gitdiscordbot
WORKDIR/home/node/discordbot
runnpminstall

RUNchmod+xsetup.sh
RUN./setup.sh

#Other
RUNmkdir-pconfigs
RUNmkdir-pclips

#"--max_old_space_size=768"
CMD["node","main.js"]
