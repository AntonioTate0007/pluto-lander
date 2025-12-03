// User_Setup.h for ESP32-2432S028 (Cheap Yellow Display)
// ST7789V Driver Configuration

#define ST7789_DRIVER

#define TFT_WIDTH  240
#define TFT_HEIGHT 320

#define TFT_MOSI 23
#define TFT_MISO -1
#define TFT_SCLK 18
#define TFT_CS   5
#define TFT_DC   2
#define TFT_RST  4
#define TFT_BL   27

#define TFT_BACKLIGHT_ON HIGH

#define LOAD_GLCD
#define LOAD_FONT2
#define LOAD_FONT4
#define LOAD_FONT6
#define LOAD_FONT7
#define LOAD_FONT8

#define SPI_FREQUENCY 55000000

