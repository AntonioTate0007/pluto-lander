/**
 * PLUTO LAUNCHER ESP32 - AITRIP ESP32-2432S028R
 * 2.8" ILI9341 TFT Display
 * WebSocket connection to Pi backend
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ArduinoOTA.h>
#include <WebSocketsClient.h>
#include <TFT_eSPI.h>

// Use TFT_eSPI instead of Adafruit (better for ESP32)
TFT_eSPI tft = TFT_eSPI();

// Configuration
#include "config.h"

// Colors
#define BG_DARK     tft.color565(5, 10, 25)   // Deep navy
#define CARD        tft.color565(20, 25, 35)
#define BTC_ORANGE  tft.color565(247, 147, 26) // #f7931a
#define GREEN       tft.color565(34, 197, 94)
#define RED         tft.color565(239, 68, 68)
#define WHITE       0xFFFF
#define GRAY        tft.color565(140, 140, 140)

// Data from WebSocket
struct TelemetryData {
    float btc_price = 0;
    float btc_change_24h = 0;
    float profit_usd = 0;
    float profit_today = 0;
    String mode = "standby";
    float sparkline[20] = {0};
    int sparkline_count = 0;
    unsigned long last_update = 0;
    bool connected = false;
} telemetry;

// State machine
enum DisplayState {
    STATE_SCREEN1_BTC,
    STATE_SCREEN2_PROFIT,
    STATE_SCREENSAVER,
    STATE_ERROR
};

DisplayState currentState = STATE_SCREEN1_BTC;
unsigned long stateStartTime = 0;
unsigned long lastScreenSwitch = 0;

// WebSocket client
WebSocketsClient webSocket;

// Backlight PWM
const int pwmChannel = 0;
const int pwmFreq = 5000;
const int pwmResolution = 8;

void setBacklight(int brightness) {
    ledcWrite(pwmChannel, brightness);
}

void drawBtcScreen() {
    tft.fillScreen(BG_DARK);
    
    // Card background
    tft.fillRoundRect(10, 20, 220, 140, 8, CARD);
    
    // Label
    tft.setTextColor(GRAY, CARD);
    tft.setTextDatum(TC_DATUM);
    tft.drawString("BTC / USD", 120, 30, 2);
    
    // Big price
    char priceStr[20];
    sprintf(priceStr, "%.2f", telemetry.btc_price);
    tft.setTextColor(WHITE, CARD);
    tft.drawString(priceStr, 120, 70, 4);
    
    // 24h change
    uint16_t changeColor = telemetry.btc_change_24h >= 0 ? GREEN : RED;
    char changeStr[15];
    sprintf(changeStr, "%s%.2f%% (24h)", 
            telemetry.btc_change_24h >= 0 ? "+" : "", 
            telemetry.btc_change_24h);
    tft.setTextColor(changeColor, CARD);
    tft.drawString(changeStr, 120, 110, 2);
    
    // Sparkline
    if (telemetry.sparkline_count > 1) {
        int chartX = 20;
        int chartY = 140;
        int chartW = 200;
        int chartH = 30;
        
        float minVal = telemetry.sparkline[0];
        float maxVal = telemetry.sparkline[0];
        for (int i = 0; i < telemetry.sparkline_count; i++) {
            if (telemetry.sparkline[i] < minVal) minVal = telemetry.sparkline[i];
            if (telemetry.sparkline[i] > maxVal) maxVal = telemetry.sparkline[i];
        }
        float range = maxVal - minVal;
        if (range < 1) range = 1;
        
        int prevX = -1, prevY = -1;
        for (int i = 0; i < telemetry.sparkline_count; i++) {
            int x = chartX + (i * chartW / telemetry.sparkline_count);
            int y = chartY + chartH - ((telemetry.sparkline[i] - minVal) / range * chartH);
            if (prevX >= 0) {
                tft.drawLine(prevX, prevY, x, y, BTC_ORANGE);
            }
            prevX = x;
            prevY = y;
        }
    }
    
    // Status bar
    tft.fillRect(10, 180, 220, 30, CARD);
    tft.setTextColor(WHITE, CARD);
    tft.setTextDatum(TL_DATUM);
    tft.drawString("Mode: ", 20, 188, 2);
    
    uint16_t modeColor = GRAY;
    if (telemetry.mode == "live") modeColor = GREEN;
    else if (telemetry.mode == "error") modeColor = RED;
    
    tft.setTextColor(modeColor, CARD);
    tft.drawString(telemetry.mode.toUpperCase(), 70, 188, 2);
    
    // Status indicator
    tft.fillCircle(200, 195, 6, modeColor);
}

void drawProfitScreen() {
    tft.fillScreen(BG_DARK);
    
    // Card background
    tft.fillRoundRect(10, 20, 220, 180, 8, CARD);
    
    // Label
    tft.setTextColor(GRAY, CARD);
    tft.setTextDatum(TC_DATUM);
    tft.drawString("Total Profit", 120, 30, 2);
    
    // Big profit number
    char profitStr[20];
    sprintf(profitStr, "$%.2f", telemetry.profit_usd);
    tft.setTextColor(WHITE, CARD);
    tft.drawString(profitStr, 120, 80, 4);
    
    // Today's profit
    tft.setTextColor(GRAY, CARD);
    tft.drawString("Today:", 120, 130, 2);
    
    uint16_t todayColor = telemetry.profit_today >= 0 ? GREEN : RED;
    char todayStr[20];
    sprintf(todayStr, "%s$%.2f", 
            telemetry.profit_today >= 0 ? "+" : "", 
            telemetry.profit_today);
    tft.setTextColor(todayColor, CARD);
    tft.drawString(todayStr, 120, 150, 2);
    
    // Mini bar chart (last 5 days - mock for now)
    int barW = 30;
    int barH = 40;
    int startX = 30;
    int baseY = 180;
    for (int i = 0; i < 5; i++) {
        int h = random(10, barH);
        uint16_t barColor = (i % 2 == 0) ? GREEN : RED;
        tft.fillRect(startX + i * (barW + 10), baseY - h, barW, h, barColor);
    }
    
    // Connection status
    tft.fillRect(10, 220, 220, 30, CARD);
    tft.setTextColor(telemetry.connected ? GREEN : RED, CARD);
    tft.setTextDatum(TC_DATUM);
    tft.drawString(telemetry.connected ? "Alpaca Connected" : "Disconnected", 120, 230, 2);
}

void drawScreensaverMining() {
    static float angle = 0;
    static int hexY[5] = {0};
    static bool initialized = false;
    
    if (!initialized) {
        for (int i = 0; i < 5; i++) {
            hexY[i] = random(-50, 0);
        }
        initialized = true;
    }
    
    tft.fillScreen(BG_DARK);
    
    // Rotating Bitcoin icon (simple circle with B)
    int centerX = 120;
    int centerY = 100;
    int radius = 40;
    
    angle += 0.05;
    tft.drawCircle(centerX, centerY, radius, BTC_ORANGE);
    tft.setTextColor(BTC_ORANGE, BG_DARK);
    tft.setTextDatum(MC_DATUM);
    tft.drawString("B", centerX, centerY, 4);
    
    // Falling hexagons
    for (int i = 0; i < 5; i++) {
        hexY[i] += 2;
        if (hexY[i] > 320) {
            hexY[i] = -20;
        }
        
        int x = 30 + i * 45;
        // Simple hexagon (6-sided polygon)
        int size = 8;
        for (int j = 0; j < 6; j++) {
            float a = (j * PI / 3) + angle;
            int x1 = x + cos(a) * size;
            int y1 = hexY[i] + sin(a) * size;
            float a2 = ((j + 1) * PI / 3) + angle;
            int x2 = x + cos(a2) * size;
            int y2 = hexY[i] + sin(a2) * size;
            tft.drawLine(x1, y1, x2, y2, GRAY);
        }
    }
    
    // Fake hashrate text
    tft.setTextColor(GRAY, BG_DARK);
    tft.setTextDatum(BC_DATUM);
    char hashStr[20];
    sprintf(hashStr, "Hashrate: %d TH/s", random(100, 200));
    tft.drawString(hashStr, 120, 310, 1);
}

void drawErrorScreen() {
    tft.fillScreen(BG_DARK);
    tft.setTextColor(RED, BG_DARK);
    tft.setTextDatum(MC_DATUM);
    tft.drawString("BACKEND", 120, 120, 4);
    tft.drawString("OFFLINE", 120, 160, 4);
    tft.drawString("RETRYING...", 120, 200, 2);
    
    // Flashing status bar
    static bool flash = false;
    flash = !flash;
    if (flash) {
        tft.fillRect(10, 280, 220, 20, RED);
    }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.println("WebSocket Disconnected");
            telemetry.connected = false;
            currentState = STATE_ERROR;
            break;
            
        case WStype_CONNECTED:
            Serial.println("WebSocket Connected");
            telemetry.connected = true;
            break;
            
        case WStype_TEXT:
            {
                JsonDocument doc;
                deserializeJson(doc, payload);
                
                if (doc["type"] == "telemetry") {
                    telemetry.btc_price = doc["btc_price"] | 0.0;
                    telemetry.btc_change_24h = doc["btc_change_24h"] | 0.0;
                    telemetry.profit_usd = doc["profit_usd"] | 0.0;
                    telemetry.profit_today = doc["profit_today"] | 0.0;
                    telemetry.mode = doc["mode"] | "standby";
                    
                    if (doc.containsKey("sparkline")) {
                        JsonArray arr = doc["sparkline"];
                        telemetry.sparkline_count = min(arr.size(), 20);
                        for (int i = 0; i < telemetry.sparkline_count; i++) {
                            telemetry.sparkline[i] = arr[i] | 0.0;
                        }
                    }
                    
                    telemetry.last_update = millis();
                }
            }
            break;
            
        default:
            break;
    }
}

void setup() {
    Serial.begin(115200);
    delay(300);
    
    // Backlight PWM setup
    ledcSetup(pwmChannel, pwmFreq, pwmResolution);
    ledcAttachPin(TFT_BL, pwmChannel);
    setBacklight(255); // Full brightness
    
    // Initialize display
    tft.init();
    tft.setRotation(0); // Portrait
    tft.fillScreen(BG_DARK);
    
    // Boot splash
    tft.setTextColor(BTC_ORANGE, BG_DARK);
    tft.setTextDatum(MC_DATUM);
    tft.drawString("PLUTO", 120, 120, 4);
    tft.drawString("LAUNCHER", 120, 160, 4);
    tft.setTextColor(GRAY, BG_DARK);
    tft.drawString("Connecting...", 120, 200, 2);
    
    // Connect WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        tft.setTextColor(GREEN, BG_DARK);
        tft.drawString("WiFi Connected!", 120, 230, 2);
        
        // Setup WebSocket
        webSocket.begin(BACKEND_HOST, BACKEND_PORT, BACKEND_WS_PATH, "http");
        webSocket.onEvent(webSocketEvent);
        webSocket.setReconnectInterval(5000);
        webSocket.enableHeartbeat(15000, 3000, 2);
        
        // Setup OTA
        ArduinoOTA.setHostname("pluto-esp32");
        ArduinoOTA.begin();
        
        delay(1000);
    } else {
        tft.setTextColor(RED, BG_DARK);
        tft.drawString("WiFi Failed", 120, 230, 2);
        currentState = STATE_ERROR;
        delay(2000);
    }
    
    stateStartTime = millis();
}

void loop() {
    ArduinoOTA.handle();
    webSocket.loop();
    
    unsigned long now = millis();
    
    // State machine logic
    if (telemetry.mode == "idle" && currentState != STATE_SCREENSAVER) {
        currentState = STATE_SCREENSAVER;
        stateStartTime = now;
    } else if (telemetry.mode != "idle" && currentState == STATE_SCREENSAVER) {
        currentState = STATE_SCREEN1_BTC;
        stateStartTime = now;
    }
    
    // Screen rotation
    if (currentState == STATE_SCREEN1_BTC && (now - stateStartTime) > SCREEN1_DURATION_MS) {
        currentState = STATE_SCREEN2_PROFIT;
        stateStartTime = now;
    } else if (currentState == STATE_SCREEN2_PROFIT && (now - stateStartTime) > SCREEN2_DURATION_MS) {
        currentState = STATE_SCREEN1_BTC;
        stateStartTime = now;
    }
    
    // Redraw current screen
    static unsigned long lastDraw = 0;
    if (now - lastDraw > 1000) { // Update every second
        switch (currentState) {
            case STATE_SCREEN1_BTC:
                drawBtcScreen();
                break;
            case STATE_SCREEN2_PROFIT:
                drawProfitScreen();
                break;
            case STATE_SCREENSAVER:
                drawScreensaverMining();
                break;
            case STATE_ERROR:
                drawErrorScreen();
                break;
        }
        lastDraw = now;
    }
    
    delay(10);
}
