#include "imaging/queue.h"

#include <algorithm>
#include <cstdio>

#include "comms/packet.h"
#include "config.h"

namespace imaging {

bool ImageQueue::enqueueImage(const std::vector<uint8_t>& jpegBytes) {
  if (jpegBytes.empty()) {
    return false;
  }

  const std::size_t chunkSize = config::kMaxLoraPayloadBytes - comms::packet::kImageHeaderSize;
  const std::size_t totalFragments =
      (jpegBytes.size() + chunkSize - 1) / chunkSize;

  if (totalFragments == 0 || totalFragments > config::kMaxImageFragments) {
    std::printf("[Queue] Imagen demasiado grande: %zu bytes (%zu fragmentos)\n",
                jpegBytes.size(),
                totalFragments);
    return false;
  }

  for (std::size_t index = 0; index < totalFragments; ++index) {
    const std::size_t start = index * chunkSize;
    const std::size_t end = std::min(start + chunkSize, jpegBytes.size());
    std::vector<uint8_t> chunk(jpegBytes.begin() + start, jpegBytes.begin() + end);

    fragments_.push(comms::packet::buildImageFragment(
        nextImageId_,
        static_cast<uint8_t>(index),
        static_cast<uint8_t>(totalFragments),
        chunk));
  }

  std::printf("[Queue] Encolada imagen %u: %zu fragmentos\n", nextImageId_, totalFragments);
  ++nextImageId_;
  return true;
}

bool ImageQueue::hasPending() const {
  return !fragments_.empty();
}

std::optional<std::vector<uint8_t>> ImageQueue::popFragment() {
  if (fragments_.empty()) {
    return std::nullopt;
  }

  std::vector<uint8_t> fragment = fragments_.front();
  fragments_.pop();
  return fragment;
}

void ImageQueue::clear() {
  while (!fragments_.empty()) {
    fragments_.pop();
  }
}

}  // namespace imaging
