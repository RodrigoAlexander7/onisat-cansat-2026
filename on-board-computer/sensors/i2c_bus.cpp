#include "i2c_bus.h"

#include <fcntl.h>
#include <sys/ioctl.h>
#include <unistd.h>

#include <cstdio>

#include <linux/i2c-dev.h>

namespace sensors {

I2cBus::I2cBus(const std::string& device) : device_(device), fd_(-1) {}

I2cBus::~I2cBus() {
  if (fd_ >= 0) {
    close(fd_);
    fd_ = -1;
  }
}

bool I2cBus::open() {
  if (fd_ >= 0) {
    return true;
  }
  fd_ = ::open(device_.c_str(), O_RDWR);
  if (fd_ < 0) {
    std::printf("[I2C] No se pudo abrir %s\n", device_.c_str());
    return false;
  }
  return true;
}

bool I2cBus::isOpen() const {
  return fd_ >= 0;
}

bool I2cBus::setSlave(uint8_t addr) {
  if (!open()) {
    return false;
  }
  return ioctl(fd_, I2C_SLAVE, addr) >= 0;
}

bool I2cBus::writeCommand(uint8_t addr, uint8_t cmd) {
  if (!setSlave(addr)) {
    return false;
  }
  return ::write(fd_, &cmd, 1) == 1;
}

bool I2cBus::writeByte(uint8_t addr, uint8_t reg, uint8_t value) {
  return writeBytes(addr, reg, &value, 1);
}

bool I2cBus::writeBytes(uint8_t addr, uint8_t reg, const uint8_t* values, std::size_t len) {
  if (!setSlave(addr)) {
    return false;
  }
  std::vector<uint8_t> buffer;
  buffer.reserve(len + 1);
  buffer.push_back(reg);
  buffer.insert(buffer.end(), values, values + len);
  return static_cast<std::size_t>(::write(fd_, buffer.data(), buffer.size())) == buffer.size();
}

bool I2cBus::readBytes(uint8_t addr, uint8_t reg, uint8_t* out, std::size_t len) {
  if (!setSlave(addr)) {
    return false;
  }
  if (::write(fd_, &reg, 1) != 1) {
    return false;
  }
  return static_cast<std::size_t>(::read(fd_, out, len)) == len;
}

bool I2cBus::readByte(uint8_t addr, uint8_t reg, uint8_t* out) {
  return readBytes(addr, reg, out, 1);
}

}  // namespace sensors
