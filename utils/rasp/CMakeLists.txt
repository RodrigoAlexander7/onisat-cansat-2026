cmake_minimum_required(VERSION 3.18)
project(rpi_sx1278_tx)

# Ajusta esta ruta si clonaste RadioLib en otro lugar
set(RADIOLIB_DIR "$ENV{HOME}/RadioLib")
add_subdirectory(${RADIOLIB_DIR} ${CMAKE_CURRENT_BINARY_DIR}/RadioLib)

add_executable(${PROJECT_NAME} main.cpp)
target_link_libraries(${PROJECT_NAME} RadioLib lgpio)
