# Pluto Lander - ESP32 Display

ESP32-2432S028 (Cheap Yellow Display) companion screen for Pluto Lander Trading Bot.

## Hardware

- **Board:** ESP32-2432S028
- **Display:** ST7789V 320x240
- **Touch:** XPT2046 (optional)

## Pin Configuration

| Function | GPIO |
|----------|------|
| TFT_MOSI | 23 |
| TFT_SCK | 18 |
| TFT_CS | 5 |
| TFT_DC | 2 |
| TFT_RST | 4 |
| TFT_BL | 27 |
| Touch_CS | 15 |
| SD_CS | 13 |

## Setup

1. Install PlatformIO
2. Open this folder in VS Code
3. Update WiFi credentials in `src/main.cpp`
4. Build and upload:

```bash
pio run -t upload
```

## Test Display

To run a simple display test:
1. Rename `src/test_display.cpp.bak` to `src/main.cpp`
2. Build and upload
3. Should show RED → GREEN → BLUE → "ST7789V SUCCESS!"

## Features

- Boot animation with Pluto Lander logo
- Real-time BTC price
- Portfolio value display
- Daily P&L tracking
- Mini price chart
- Scrolling ticker
- WiFi status indicator

## Communication

The ESP32 fetches data from:
- Coinbase API (BTC price)
- Raspberry Pi backend (portfolio data)

Update `piUrl` in main.cpp to match your Pi's IP address.

