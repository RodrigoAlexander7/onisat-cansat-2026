#include "imaging/camera.h"

#include <cstdio>
#include <cstdlib>
#include <fstream>
#include <iterator>
#include <string>
#include <unistd.h>
#include <vector>

#include <jpeglib.h>

#include "config.h"

namespace imaging {

namespace {

struct RgbImage {
  int width = 0;
  int height = 0;
  std::vector<uint8_t> pixels;
};

bool readFile(const std::string& path, std::vector<uint8_t>* out) {
  std::ifstream input(path, std::ios::binary);
  if (!input) {
    return false;
  }
  out->assign(std::istreambuf_iterator<char>(input), std::istreambuf_iterator<char>());
  return !out->empty();
}

bool decodeJpeg(const std::vector<uint8_t>& jpeg, RgbImage* out) {
  jpeg_decompress_struct cinfo;
  jpeg_error_mgr jerr;
  cinfo.err = jpeg_std_error(&jerr);
  jpeg_create_decompress(&cinfo);
  jpeg_mem_src(&cinfo, const_cast<unsigned char*>(jpeg.data()), jpeg.size());
  jpeg_read_header(&cinfo, TRUE);
  cinfo.out_color_space = JCS_RGB;
  jpeg_start_decompress(&cinfo);

  out->width = static_cast<int>(cinfo.output_width);
  out->height = static_cast<int>(cinfo.output_height);
  out->pixels.resize(static_cast<size_t>(out->width * out->height * 3));

  while (cinfo.output_scanline < cinfo.output_height) {
    uint8_t* row = &out->pixels[cinfo.output_scanline * out->width * 3];
    jpeg_read_scanlines(&cinfo, &row, 1);
  }

  jpeg_finish_decompress(&cinfo);
  jpeg_destroy_decompress(&cinfo);
  return !out->pixels.empty();
}

bool encodeJpeg(const RgbImage& image, int quality, std::vector<uint8_t>* out) {
  jpeg_compress_struct cinfo;
  jpeg_error_mgr jerr;
  cinfo.err = jpeg_std_error(&jerr);
  jpeg_create_compress(&cinfo);

  unsigned char* buffer = nullptr;
  unsigned long bufferSize = 0;
  jpeg_mem_dest(&cinfo, &buffer, &bufferSize);

  cinfo.image_width = image.width;
  cinfo.image_height = image.height;
  cinfo.input_components = 3;
  cinfo.in_color_space = JCS_RGB;

  jpeg_set_defaults(&cinfo);
  jpeg_set_quality(&cinfo, quality, TRUE);
  cinfo.restart_interval = config::kJpegRestartIntervalMcus;
  jpeg_start_compress(&cinfo, TRUE);

  while (cinfo.next_scanline < cinfo.image_height) {
    JSAMPROW row = const_cast<JSAMPROW>(
        reinterpret_cast<const JSAMPLE*>(&image.pixels[cinfo.next_scanline * image.width * 3]));
    jpeg_write_scanlines(&cinfo, &row, 1);
  }

  jpeg_finish_compress(&cinfo);
  out->assign(buffer, buffer + bufferSize);
  jpeg_destroy_compress(&cinfo);
  std::free(buffer);
  return !out->empty();
}

RgbImage makeAnaglyph(const RgbImage& left, const RgbImage& right, int shiftPx) {
  RgbImage out;
  out.width = left.width;
  out.height = left.height;
  out.pixels.resize(left.pixels.size(), 0);

  for (int y = 0; y < out.height; ++y) {
    for (int x = 0; x < out.width; ++x) {
      int rx = x + shiftPx;
      if (rx < 0) rx = 0;
      if (rx >= out.width) rx = out.width - 1;

      const size_t leftIndex = static_cast<size_t>((y * out.width + x) * 3);
      const size_t rightIndex = static_cast<size_t>((y * out.width + rx) * 3);
      out.pixels[leftIndex + 0] = left.pixels[leftIndex + 0];
      out.pixels[leftIndex + 1] = right.pixels[rightIndex + 1];
      out.pixels[leftIndex + 2] = right.pixels[rightIndex + 2];
    }
  }

  return out;
}

RgbImage cropSbsHalf(const RgbImage& sbs, bool leftHalf) {
  RgbImage out;
  out.width = sbs.width / 2;
  out.height = sbs.height;
  out.pixels.resize(static_cast<size_t>(out.width * out.height * 3));

  const int xOffset = leftHalf ? 0 : out.width;
  for (int y = 0; y < out.height; ++y) {
    for (int x = 0; x < out.width; ++x) {
      const size_t src = static_cast<size_t>((y * sbs.width + (x + xOffset)) * 3);
      const size_t dst = static_cast<size_t>((y * out.width + x) * 3);
      out.pixels[dst + 0] = sbs.pixels[src + 0];
      out.pixels[dst + 1] = sbs.pixels[src + 1];
      out.pixels[dst + 2] = sbs.pixels[src + 2];
    }
  }
  return out;
}

RgbImage resizeNearest(const RgbImage& src, int dstWidth, int dstHeight) {
  RgbImage out;
  out.width = dstWidth;
  out.height = dstHeight;
  out.pixels.resize(static_cast<size_t>(dstWidth * dstHeight * 3));

  for (int y = 0; y < dstHeight; ++y) {
    const int sy = (y * src.height) / dstHeight;
    for (int x = 0; x < dstWidth; ++x) {
      const int sx = (x * src.width) / dstWidth;
      const size_t srcIdx = static_cast<size_t>((sy * src.width + sx) * 3);
      const size_t dstIdx = static_cast<size_t>((y * dstWidth + x) * 3);
      out.pixels[dstIdx + 0] = src.pixels[srcIdx + 0];
      out.pixels[dstIdx + 1] = src.pixels[srcIdx + 1];
      out.pixels[dstIdx + 2] = src.pixels[srcIdx + 2];
    }
  }

  return out;
}

}  // namespace

bool Camera::init() {
  const bool hasFswebcam = (access("/usr/bin/fswebcam", X_OK) == 0) || (std::system("command -v fswebcam >/dev/null 2>&1") == 0);
  const bool hasStereoDevice = (access(config::kStereoCameraDevice, F_OK) == 0);
  if (hasFswebcam && hasStereoDevice) {
    backend_ = Backend::kFswebcam;
    std::printf("[Camera] Backend fswebcam SBS (%s)\n", config::kStereoCameraDevice);
    return true;
  }
  std::printf("[Camera] fswebcam no disponible o camara SBS ausente (fswebcam=%d, sbs=%d)\n",
              hasFswebcam ? 1 : 0,
              hasStereoDevice ? 1 : 0);
  return false;
}

std::optional<std::vector<uint8_t>> Camera::capture() {
  if (backend_ != Backend::kFswebcam) {
    std::printf("[Camera] Backend no inicializado\n");
    return std::nullopt;
  }

  const std::string sbsPath = "/tmp/cansat_sbs.jpg";
  const std::string sbsCmd =
      "fswebcam -d " + std::string(config::kStereoCameraDevice) +
      " -r " + std::to_string(config::kSbsCaptureWidth) + "x" + std::to_string(config::kSbsCaptureHeight) +
      " --skip " + std::to_string(config::kFswebcamSkipFrames) +
      " --jpeg " + std::to_string(config::kCaptureJpegQuality) +
      " --no-banner " + sbsPath + " >/dev/null 2>&1";
  if (std::system(sbsCmd.c_str()) != 0) {
    std::printf("[Camera] Error al capturar imagen SBS\n");
    return std::nullopt;
  }

  std::vector<uint8_t> sbsJpeg;
  if (!readFile(sbsPath, &sbsJpeg)) {
    std::printf("[Camera] No se pudo leer imagen SBS\n");
    std::remove(sbsPath.c_str());
    return std::nullopt;
  }
  std::remove(sbsPath.c_str());

  RgbImage sbsRgb;
  if (!decodeJpeg(sbsJpeg, &sbsRgb)) {
    std::printf("[Camera] Error al decodificar JPEG para anaglifo\n");
    return std::nullopt;
  }
  if (sbsRgb.width % 2 != 0) {
    std::printf("[Camera] Imagen SBS invalida (ancho impar: %d)\n", sbsRgb.width);
    return std::nullopt;
  }

  RgbImage leftRgb = cropSbsHalf(sbsRgb, true);
  RgbImage rightRgb = cropSbsHalf(sbsRgb, false);
  leftRgb = resizeNearest(leftRgb, config::kAnaglyphOutputWidth, config::kAnaglyphOutputHeight);
  rightRgb = resizeNearest(rightRgb, config::kAnaglyphOutputWidth, config::kAnaglyphOutputHeight);

  const RgbImage anaglyph = makeAnaglyph(leftRgb, rightRgb, config::kAnaglyphShiftPx);
  std::vector<uint8_t> outJpeg;
  if (!encodeJpeg(anaglyph, config::kCaptureJpegQuality, &outJpeg)) {
    std::printf("[Camera] Error al codificar anaglifo JPEG\n");
    return std::nullopt;
  }

  std::printf("[Camera] Anaglifo generado en onboard: %zu bytes\n", outJpeg.size());
  return outJpeg;
}

}  // namespace imaging
