## Emulator for LoRa Transmitter

### Auxiliary directory

This is a simple emulator for a LoRa transmitter. It is used for compile all the `on-board-computer` cpp files outside the raspberry (that sometimes can't do it)

- on-board-computer/ : this dir is just the compu of the root dir with the same name
- Dockerfile : the docker file to build the image
- init.sh : the script to run the emulator
- notes.md : some notes about the emulator