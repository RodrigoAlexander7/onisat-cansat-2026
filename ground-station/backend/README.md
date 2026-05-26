## backend for the ground station
### Main directory

This is the main directory for the backend of the ground station. It contains the code to connect the frontend with the LoRa transmitter like:
---
esp -> backend -> frontend
---

- mock_temp.py: mock server to test the frontend
- plot_telemetry.py: script after mission to generate graphs with the mission data (de inicio a fin)
- recv_images.py: maybe wrong name, this script receive the images and senssors data and save them in a csv file, follow the last implementation of the LoRa transmitter and on-board-computer with the ***finite state machine***
- recv_no_fsm.py: deprecated script (saved just for reference) receive the data from the LoRa transmitter without the ***finite state machine***