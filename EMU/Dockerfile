# Especificamos la plataforma 32-bits (arm/v7) y el sistema base (trixie)
FROM --platform=linux/arm/v7 debian:trixie

# 1. Instalamos herramientas básicas para poder descargar las llaves de seguridad
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 2. Agregamos la llave GPG y el repositorio oficial de Raspberry Pi (versión trixie)
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL http://archive.raspberrypi.org/debian/raspberrypi.gpg.key | gpg --dearmor -o /etc/apt/keyrings/raspberrypi.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/raspberrypi.gpg] http://archive.raspberrypi.org/debian trixie main" > /etc/apt/sources.list.d/raspi.list

# 3. Ahora que el contenedor conoce el repositorio de la Pi, instalamos todo
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
