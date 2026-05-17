#ifndef OBC_SENSORS_I2C_BUS_H
#define OBC_SENSORS_I2C_BUS_H

#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

namespace sensors {

class I2cBus {
 public:
  explicit I2cBus(const std::string& device = "/dev/i2c-1");
  ~I2cBus();

  bool open();
  bool isOpen() const;

  bool writeByte(uint8_t addr, uint8_t reg, uint8_t value);
  bool writeBytes(uint8_t addr, uint8_t reg, const uint8_t* values, std::size_t len);
  bool writeCommand(uint8_t addr, uint8_t cmd);
  bool readBytes(uint8_t addr, uint8_t reg, uint8_t* out, std::size_t len);
  bool readByte(uint8_t addr, uint8_t reg, uint8_t* out);

 private:
  bool setSlave(uint8_t addr);

  std::string device_;
  int fd_;
};

}  // namespace sensors

#endif
