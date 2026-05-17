docker build -t pi-builder-trixie .

sudo docker run --rm --privileged multiarch/qemu-user-static --reset -p yes

1. Entra al contenedor interactivo montando tu código:

docker run --rm -it -v /home/totora/Documents/PROFESIONAL/lora-transmision/EMU:/workspace pi-builder-trixie

siempre hace cd /workspace 

(El -v /ruta/a/tu/codigo:/workspace hace un "espejo". Todo lo que el contenedor genere ahí, aparecerá mágicamente en tu disco duro real).

## Para compilar se usa
  cmake -S . -B build
  cmake --build build -j4
  
# y para correrlo
  sudo ./rpi_sx1278_tx

# en caso de hacerlo por primera ves instalar las dependencias (SI SALE ERROR AL INSTALARLAS NO IMPORTAN, COSAS DEL KERNEL XDDD) 
  apt install -y cmake g++ liblgpio-dev libjpeg-dev fswebcam v4l-utils i2c-tools
