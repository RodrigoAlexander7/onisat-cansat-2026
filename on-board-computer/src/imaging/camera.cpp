#include "imaging/camera.h"

#include <cstdio>
#include <cstdlib>
#include <fstream>
#include <iterator>
#include <string>
#include <unistd.h>

#include "config.h"

namespace imaging {

bool Camera::init() {
  const bool hasFswebcam = (access("/usr/bin/fswebcam", X_OK) == 0) || (std::system("command -v fswebcam >/dev/null 2>&1") == 0);
  const bool hasUsbDevice = (access(config::kUsbCameraDevice, F_OK) == 0);
  if (hasFswebcam && hasUsbDevice) {
    backend_ = Backend::kFswebcam;
    std::printf("[Camera] Backend fswebcam (%s)\n", config::kUsbCameraDevice);
    return true;
  }
  std::printf("[Camera] fswebcam no disponible o dispositivo ausente (fswebcam=%d, device=%d)\n",
              hasFswebcam ? 1 : 0,
              hasUsbDevice ? 1 : 0);
  return false;
}

std::optional<std::vector<uint8_t>> Camera::capture() {
  std::string command;
  if (backend_ == Backend::kFswebcam) {
    command =
        "fswebcam -d " + std::string(config::kUsbCameraDevice) +
        " -r " + std::to_string(config::kCaptureWidth) + "x" + std::to_string(config::kCaptureHeight) +
        " --jpeg " + std::to_string(config::kCaptureJpegQuality) +
        " --no-banner " + std::string(config::kCapturePath) + " >/dev/null 2>&1";
  } else {
    std::printf("[Camera] Backend no inicializado\n");
    return std::nullopt;
  }

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
