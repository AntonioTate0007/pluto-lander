/**
 * PLUTO LAUNCHER ESP32 - ESP32-2432S028 (CYD)
 * 2.8" ST7789V TFT Display
 * Vertical 3-section layout: TIME | BLOCK HEIGHT | BOT STATUS
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ArduinoOTA.h>
#include <TFT_eSPI.h>
#include <time.h>

TFT_eSPI tft = TFT_eSPI();

// Configuration
#include "config.h"

// Colors
#define BG_BLACK    0x0000
#define PANEL       tft.color565(20, 20, 20)  // Dark gray panel
#define WHITE       0xFFFF
#define GRAY        tft.color565(140, 140, 140)
#define GREEN       tft.color565(34, 197, 94)
#define RED         tft.color565(239, 68, 68)
#define GOLD        tft.color565(255, 193, 7)

// Data
struct DisplayData {
    int blockHeight = 890518;
    float blockChange = 5.3;
    String botStatus = "Waiting for signal...";
    bool botReady = true;
    unsigned long lastUpdate = 0;
} data;

// Time
time_t now;
struct tm timeinfo;

void drawTimePanel() {
    // Panel background (top section)
    tft.fillRoundRect(8, 8, 224, 90, 10, PANEL);
    
    // Label "Local Time"
    tft.setTextColor(GRAY, PANEL);
    tft.setTextDatum(TL_DATUM);
    tft.drawString("Local Time", 20, 20, 2);
    
    // Get current time
    time(&now);
    localtime_r(&now, &timeinfo);
    
    // Huge time display (12-hour format with AM/PM)
    char timeStr[12];
    int hour12 = timeinfo.tm_hour % 12;
    if (hour12 == 0) hour12 = 12; // Convert 0 to 12 for 12-hour format
    const char* ampm = (timeinfo.tm_hour < 12) ? "AM" : "PM";
    sprintf(timeStr, "%d:%02d %s", hour12, timeinfo.tm_min, ampm);
    tft.setTextColor(WHITE, PANEL);
    tft.setTextDatum(TC_DATUM);
    tft.drawString(timeStr, 120, 55, 7); // Large font size 7
}

void drawBlockHeightPanel() {
    // Panel background (middle section)
    tft.fillRoundRect(8, 106, 224, 120, 10, PANEL);
    
    // Header "Block Height"
    tft.setTextColor(GRAY, PANEL);
    tft.setTextDatum(TL_DATUM);
    tft.drawString("Block Height", 20, 118, 2);
    
    // Percentage on right (5.3%)
    char pctStr[12];
    sprintf(pctStr, "%.1f%%", data.blockChange);
    tft.setTextDatum(TR_DATUM);
    tft.setTextColor(GREEN, PANEL);
    tft.drawString(pctStr, 228, 118, 2);
    
    // Massive block number (890,518)
    tft.setTextColor(WHITE, PANEL);
    tft.setTextDatum(TC_DATUM);
    char blockStr[20];
    sprintf(blockStr, "%d", data.blockHeight);
    tft.drawString(blockStr, 120, 155, 6); // Large font size 6
    
    // Green sparkline graph below number
    int y0 = 200;
    int prevY = y0;
    int graphWidth = 200;
    int graphHeight = 20;
    for(int i = 0; i < graphWidth; i += 4) {
        int y = y0 + random(-6, 6);
        if (i > 0) {
            tft.drawLine(20 + i - 4, prevY, 20 + i, y, GREEN);
        }
        prevY = y;
    }
}

void drawBotStatusPanel() {
    // Panel background (bottom section)
    tft.fillRoundRect(8, 234, 224, 86, 10, PANEL);
    
    // "Bot Ready" status (yellow/gold color)
    tft.setTextColor(GOLD, PANEL);
    tft.setTextDatum(TC_DATUM);
    tft.drawString("Bot Ready", 120, 250, 2);
    
    // Status message "Waiting for signal..."
    tft.setTextColor(WHITE, PANEL);
    tft.drawString(data.botStatus, 120, 280, 2);
    
    // Status indicator bar at bottom (gray)
    tft.fillRect(60, 310, 120, 4, GRAY);
}

void drawMainDisplay() {
    tft.fillScreen(BG_BLACK);
    drawTimePanel();
    drawBlockHeightPanel();
    drawBotStatusPanel();
}

void fetchBlockHeight() {
    if (WiFi.status() != WL_CONNECTED) return;
    
    HTTPClient http;
    http.begin("https://mempool.space/api/blocks/tip/height");
    http.setTimeout(5000);
    if (http.GET() == 200) {
        int newHeight = http.getString().toInt();
        if (newHeight > 0) {
            // Calculate change
            if (data.blockHeight > 0) {
                data.blockChange = ((float)(newHeight - data.blockHeight) / data.blockHeight) * 100.0;
            }
            data.blockHeight = newHeight;
            data.lastUpdate = millis();
        }
    }
    http.end();
}

void setupOTA() {
    ArduinoOTA.setHostname("pluto-esp32");
    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        int pct = (progress * 100) / total;
        tft.fillRect(60, 200, 120, 20, BG_BLACK);
        tft.setTextColor(WHITE, BG_BLACK);
        tft.setTextDatum(TC_DATUM);
        char pctStr[10];
        sprintf(pctStr, "%d%%", pct);
        tft.drawString(pctStr, 120, 210, 2);
    });
    ArduinoOTA.begin();
}

void setup() {
    Serial.begin(115200);
    delay(300);
    
    // Backlight
    pinMode(TFT_BL, OUTPUT);
    digitalWrite(TFT_BL, HIGH);
    
    // Initialize display
    tft.init();
    tft.setRotation(0); // Portrait (240x320) - vertical layout
    tft.fillScreen(BG_BLACK);
    
    // Boot splash
    tft.setTextColor(GOLD, BG_BLACK);
    tft.setTextDatum(MC_DATUM);
    tft.drawString("PLUTO", 160, 100, 4);
    tft.drawString("LAUNCHER", 160, 140, 4);
    tft.setTextColor(GRAY, BG_BLACK);
    tft.drawString("Connecting...", 160, 180, 2);
    
    // Connect WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        tft.setTextColor(GREEN, BG_BLACK);
        tft.drawString("WiFi Connected!", 160, 200, 2);
        
        // Configure time
        configTime(0, 0, "pool.ntp.org", "time.nist.gov");
        delay(2000);
        
        // Setup OTA
        setupOTA();
        
        // Fetch initial data
        fetchBlockHeight();
        
        delay(1000);
    } else {
        tft.setTextColor(RED, BG_BLACK);
        tft.drawString("WiFi Failed", 160, 200, 2);
        delay(2000);
    }
    
    // Draw main display
    drawMainDisplay();
}

void loop() {
    ArduinoOTA.handle();
    
    // Update time every second
    static unsigned long lastTimeUpdate = 0;
    if (millis() - lastTimeUpdate > 1000) {
        drawTimePanel();
        lastTimeUpdate = millis();
    }
    
    // Update block height every 60 seconds
    static unsigned long lastBlockUpdate = 0;
    if (millis() - lastBlockUpdate > 60000) {
        fetchBlockHeight();
        drawBlockHeightPanel();
        lastBlockUpdate = millis();
    }
    
    // Update bot status (mock for now)
    static unsigned long lastStatusUpdate = 0;
    if (millis() - lastStatusUpdate > 5000) {
        // Rotate status messages
        static int statusIndex = 0;
        const char* statuses[] = {
            "Waiting for signal...",
            "Monitoring markets...",
            "Ready to trade..."
        };
        data.botStatus = statuses[statusIndex % 3];
        statusIndex++;
        drawBotStatusPanel();
        lastStatusUpdate = millis();
    }
    
    delay(100);
}
