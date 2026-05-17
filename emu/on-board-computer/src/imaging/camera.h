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
};

}  // namespace imaging

#endif
