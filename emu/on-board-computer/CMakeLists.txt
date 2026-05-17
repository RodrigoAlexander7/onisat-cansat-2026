cmake_minimum_required(VERSION 3.18)
project(on_board_computer)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/RadioLib/CMakeLists.txt")
  set(RADIOLIB_DIR "${CMAKE_CURRENT_SOURCE_DIR}/RadioLib")
else()
  set(RADIOLIB_DIR "$ENV{HOME}/RadioLib")
endif()

if(NOT EXISTS "${RADIOLIB_DIR}/CMakeLists.txt")
  message(FATAL_ERROR "RadioLib no encontrado. Coloca RadioLib en ${CMAKE_CURRENT_SOURCE_DIR}/RadioLib o en $HOME/RadioLib")
endif()

add_subdirectory(${RADIOLIB_DIR} ${CMAKE_CURRENT_BINARY_DIR}/RadioLib)

add_executable(${PROJECT_NAME}
  src/main.cpp
  src/comms/lora.cpp
  src/comms/packet.cpp
  src/imaging/camera.cpp
  src/imaging/queue.cpp
  sensors/i2c_bus.cpp
  sensors/altimeter.cpp
  sensors/environment.cpp
  sensors/imu.cpp
  sensors/magnetometer.cpp
  sensors/power.cpp
)

target_include_directories(${PROJECT_NAME} PRIVATE
  ${CMAKE_CURRENT_SOURCE_DIR}
  ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(${PROJECT_NAME} PRIVATE RadioLib lgpio jpeg)
