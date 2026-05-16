# Especificamos la plataforma 32-bits (arm/v7) y el sistema base (trixie)
FROM --platform=linux/arm/v7 debian:trixie

# Actualizamos los repositorios e instalamos las herramientas de compilación
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Creamos el directorio donde montaremos tu código
WORKDIR /workspace

# Mantenemos el contenedor vivo esperando comandos
CMD ["/bin/bash"]
