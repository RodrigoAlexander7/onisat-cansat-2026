#include "imaging/camera.h"

#include <cstdio>
#include <cstdlib>
#include <fstream>
#include <iterator>
#include <string>

#include "config.h"

namespace imaging {

bool Camera::init() {
  const std::string command = "libcamera-still --version >/dev/null 2>&1";
  const int state = std::system(command.c_str());
  if (state != 0) {
    std::printf("[Camera] libcamera-still no disponible\n");
    return false;
  }
  std::printf("[Camera] OK\n");
  return true;
}

std::optional<std::vector<uint8_t>> Camera::capture() {
  const std::string command =
      "libcamera-still -n --immediate --timeout " + std::to_string(config::kCaptureTimeoutMs) +
      " --width " + std::to_string(config::kCaptureWidth) +
      " --height " + std::to_string(config::kCaptureHeight) +
      " --quality " + std::to_string(config::kCaptureJpegQuality) +
      " -o " + std::string(config::kCapturePath) + " >/dev/null 2>&1";

  const int shotState = std::system(command.c_str());
  if (shotState != 0) {
    std::printf("[Camera] Error al capturar imagen\n");
    return std::nullopt;
  }

  std::ifstream input(config::kCapturePath, std::ios::binary);
  if (!input) {
    std::printf("[Camera] No se pudo abrir %s\n", config::kCapturePath);
    return std::nullopt;
  }

  std::vector<uint8_t> bytes((std::istreambuf_iterator<char>(input)), std::istreambuf_iterator<char>());
  input.close();
  std::remove(config::kCapturePath);

  if (bytes.empty()) {
    std::printf("[Camera] Imagen vacia\n");
    return std::nullopt;
  }

  std::printf("[Camera] Imagen capturada: %zu bytes\n", bytes.size());
  return bytes;
}

}  // namespace imaging
