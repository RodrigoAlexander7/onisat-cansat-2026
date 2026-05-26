#ifndef OBC_CONFIG_H
#define OBC_CONFIG_H

#include <cstddef>
#include <cstdint>

namespace config {

constexpr uint8_t kSpiChannel = 0;
constexpr uint32_t kLoraNssPin = 24;
constexpr uint32_t kLoraDio0Pin = 25;
constexpr uint32_t kLoraRstPin = 22;

constexpr float kLoraFrequencyMhz = 433.0f;
constexpr float kLoraBandwidthKhz = 250.0f;
constexpr uint8_t kLoraSpreadingFactor = 7;
constexpr uint8_t kLoraCodingRate = 5;
constexpr uint8_t kLoraSyncWord = 0x12;
constexpr int8_t kLoraTxPowerDbm = 17;
constexpr uint16_t kLoraPreambleLength = 8;
constexpr uint8_t kLoraGain = 0;
constexpr bool kLoraEnableCrc = true;

constexpr std::size_t kMaxLoraPayloadBytes = 100;
constexpr uint8_t kImagePacketType = 0x01;
constexpr uint8_t kImageStartPacketType = 0x10;  // RTS start marker
constexpr uint8_t kImageEndPacketType = 0x11;    // RTS end marker
constexpr uint8_t kTelemetryPacketType = 0x02;
constexpr std::size_t kMaxImageFragments = 255;
constexpr uint8_t kFragmentRepeatCount = 1;

constexpr int kSbsCaptureWidth = 2560;
constexpr int kSbsCaptureHeight = 720;
constexpr int kAnaglyphOutputWidth = 320;
constexpr int kAnaglyphOutputHeight = 240;
constexpr int kCaptureJpegQuality = 65;
constexpr unsigned int kJpegRestartIntervalMcus = 8;
constexpr int kCaptureTimeoutMs = 1000;
constexpr const char* kCapturePath = "/tmp/cansat_capture.jpg";
constexpr const char* kStereoCameraDevice = "/dev/video0";
constexpr int kFswebcamSkipFrames = 20;
constexpr int kAnaglyphShiftPx = 6;

constexpr int kCaptureCount = 5;
constexpr unsigned long kCaptureIntervalMs = 3000;
constexpr unsigned long kInterPacketDelayMs = 60;
constexpr int kImageFragmentsPerTelemetry = 10;
constexpr unsigned long kTelemetryPeriodMs = 200;  // 5 Hz

constexpr float kAscentDetectMeters = 3.0f;
constexpr int kAscentConfirmSamples = 3;
constexpr float kFreeFallDetectMeters = 300.0f;
constexpr float kFreeFallAccelThresholdMs2 = 3.0f;
constexpr int kFreeFallAccelSamples = 3;
constexpr float kServoDeployAltitudeMeters = 200.0f;
constexpr float kServoDeployDescendingSpeedMinMs = 0.2f;
constexpr uint8_t kServo1Gpio = 18;  // Pin fisico 12
constexpr uint8_t kServo2Gpio = 13;  // Pin fisico 33
constexpr float kServo1DeployAngleDeg = 75.0f;
constexpr float kServo2DeployAngleDeg = 30.0f;
constexpr int kServoPwmFrequencyHz = 50;
constexpr float kServoMinPulseUs = 500.0f;
constexpr float kServoMaxPulseUs = 2500.0f;
constexpr unsigned long kServoHoldMs = 900;
constexpr float kLandingAltToleranceMeters = 5.0f;
constexpr int kLandingStableSamples = 10;
constexpr float kImpactAccelThresholdMs2 = 25.0f;
constexpr unsigned long kLandingTelemetryDurationMs = 30000;

}  // namespace config

#endif
