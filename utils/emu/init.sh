#!/bin/bash

# 1. Hacemos build de la imagen local
docker build -t pi-builder-trixie .

# 2. Registramos qemu para emulación multiarquitectura
sudo docker run --rm --privileged multiarch/qemu-user-static --reset -p yes

# 3. Arrancamos el contenedor y le pasamos los comandos en cadena
docker run --rm -it \
  -v /home/totora/Documents/PROFESIONAL/lora-transmision/emu:/workspace \
  pi-builder-trixie /bin/bash -c "
    apt update && \
    apt install -y git cmake g++ liblgpio-dev nano && \
    if [ ! -d '/workspace/RadioLib' ]; then \
        echo 'Clonando RadioLib por primera vez...'; \
        git clone --depth 1 https://github.com/jgromes/RadioLib.git /workspace/RadioLib; \
    else \
        echo 'RadioLib ya existe en tu PC, saltando clonación.'; \
    fi && \
    /bin/bash
  "
