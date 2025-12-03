/**
 * ESP32 Configuration
 * AITRIP ESP32-2432S028R with 2.8" ILI9341 TFT
 */

#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
static const char* WIFI_SSID = "TW";
static const char* WIFI_PASS = "4075752351";

// Backend Configuration
static const char* BACKEND_HOST = "192.168.1.208";
static const int BACKEND_PORT = 8000;
static const char* BACKEND_WS_PATH = "/ws/telemetry";

// Display Configuration
#define TFT_CS   5
#define TFT_DC   2
#define TFT_RST  4
#define TFT_MOSI 23
#define TFT_MISO 19
#define TFT_CLK  18
#define TFT_BL   32

// Display dimensions (landscape for CYD)
#define TFT_WIDTH  320
#define TFT_HEIGHT 240

#endif
