# Especificamos la plataforma 32-bits (arm/v7) y el sistema base (trixie)
FROM --platform=linux/arm/v7 debian:trixie

# 1. Agregamos el repositorio oficial de Raspberry Pi marcándolo como de confianza.
# Esto evita que Debian Trixie aborte la instalación por culpa del formato de llave SHA1.
RUN echo "deb [trusted=yes] http://archive.raspberrypi.org/debian trixie main" > /etc/apt/sources.list.d/raspi.list

# 2. Ahora actualizamos e instalamos todas las herramientas y dependencias
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    g++ \
    gcc \
    liblgpio-dev \
    && rm -rf /var/lib/apt/lists/*

# Creamos el directorio de trabajo
WORKDIR /workspace

CMD ["/bin/bash"]
