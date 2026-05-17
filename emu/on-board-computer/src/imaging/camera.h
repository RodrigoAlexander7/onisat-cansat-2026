#ifndef OBC_IMAGING_CAMERA_H
#define OBC_IMAGING_CAMERA_H

#include <cstdint>
#include <optional>
#include <vector>

namespace imaging {

class Camera {
 public:
  bool init();
  std::optional<std::vector<uint8_t>> capture();

 private:
  enum class Backend {
    kNone,
    kFswebcam,
    kLibcamera,
  };

  Backend backend_ = Backend::kNone;
};

}  // namespace imaging

#endif
