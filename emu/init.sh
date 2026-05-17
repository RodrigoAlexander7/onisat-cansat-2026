#!/bin/bash

# hacemos build
docker build -t pi-builder-trixie .
# run the container
sudo docker run --rm --privileged multiarch/qemu-user-static --reset -p yes

# enter to the container
docker run --rm -it -v /home/totora/Documents/PROFESIONAL/lora-transmision/EMU:/workspace pi-builder-trixie

# instalamos dependencias
apt update
apt install -y git cmake g++ liblgpio-dev nano

# descargamos RadioLib desde github
git clone --depth 1 https://github.com/jgromes/RadioLib.git ~/RadioLib
