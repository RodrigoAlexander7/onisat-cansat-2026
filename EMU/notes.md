1. Entra al contenedor interactivo montando tu código:


docker run --rm -it -v /home/totora/Documents/PROFESIONAL/lora-transmision/EMU:/workspace pi-builder-trixie

(El -v /ruta/a/tu/codigo:/workspace hace un "espejo". Todo lo que el contenedor genere ahí, aparecerá mágicamente en tu disco duro real).
