#ifndef OBC_IMAGING_QUEUE_H
#define OBC_IMAGING_QUEUE_H

#include <cstdint>
#include <optional>
#include <queue>
#include <vector>

namespace imaging {

class ImageQueue {
 public:
  bool enqueueImage(const std::vector<uint8_t>& jpegBytes);
  bool hasPending() const;
  std::optional<std::vector<uint8_t>> popFragment();
  void clear();

 private:
  uint8_t nextImageId_ = 0;
  std::queue<std::vector<uint8_t>> fragments_;
};

}  // namespace imaging

#endif
