/**
 * Pluto Launcher - ESP32-2432S028 Display
 * ST7789V Driver - Cheap Yellow Display
 * 
 * Boot sequence test + Pluto Launcher UI
 */

#include <Arduino.h>
#include <TFT_eSPI.h>
#include <SPI.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Display instance
TFT_eSPI tft = TFT_eSPI();

// Colors - Pluto Lander theme
#define COLOR_BG        0x0000  // Black
#define COLOR_GOLD      0xFD20  // Gold accent
#define COLOR_GREEN     0x07E0  // Positive
#define COLOR_RED       0xF800  // Negative
#define COLOR_CYAN      0x07FF  // Cyan accent
#define COLOR_PURPLE    0x881F  // Purple accent
#define COLOR_GRAY      0x7BEF  // Gray text
#define COLOR_WHITE     0xFFFF  // White

// WiFi credentials (update these)
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Raspberry Pi backend URL
const char* piUrl = "http://192.168.1.208:8000";

// Data variables
float portfolioValue = 0;
float dailyPL = 0;
float dailyPLPercent = 0;
float btcPrice = 0;
String trend = "neutral";
String position = "STANDBY";
String tickerText = "Initializing...";
int chartData[60] = {0};
int chartIndex = 0;

// Animation variables
unsigned long lastUpdate = 0;
unsigned long lastChartScroll = 0;
unsigned long lastTickerScroll = 0;
int tickerX = 320;
float logoOpacity = 0;
int bootPhase = 0;

// Screen dimensions (rotated)
#define SCREEN_W 320
#define SCREEN_H 240

//===========================================
// BOOT ANIMATION
//===========================================

void drawBootSequence() {
    // Phase 0: Black screen
    if (bootPhase == 0) {
        tft.fillScreen(COLOR_BG);
        delay(200);
        bootPhase = 1;
    }
    
    // Phase 1: Draw glowing ring
    if (bootPhase == 1) {
        int cx = SCREEN_W / 2;
        int cy = SCREEN_H / 2 - 20;
        
        // Glow rings (outer to inner)
        for (int r = 60; r > 40; r -= 2) {
            uint16_t color = tft.color565(255 * (60-r) / 20, 165 * (60-r) / 20, 38 * (60-r) / 20);
            tft.drawCircle(cx, cy, r, color);
            delay(20);
        }
        
        // Inner solid circle
        tft.fillCircle(cx, cy, 40, COLOR_GOLD);
        delay(100);
        bootPhase = 2;
    }
    
    // Phase 2: Draw rocket icon
    if (bootPhase == 2) {
        int cx = SCREEN_W / 2;
        int cy = SCREEN_H / 2 - 20;
        
        // Simple rocket shape
        tft.fillTriangle(cx, cy-25, cx-12, cy+10, cx+12, cy+10, COLOR_WHITE);
        tft.fillRect(cx-8, cy+10, 16, 15, COLOR_GRAY);
        tft.fillTriangle(cx-8, cy+25, cx-15, cy+35, cx-8, cy+35, COLOR_RED);
        tft.fillTriangle(cx+8, cy+25, cx+15, cy+35, cx+8, cy+35, COLOR_RED);
        
        // Flame
        tft.fillTriangle(cx, cy+35, cx-6, cy+25, cx+6, cy+25, COLOR_GOLD);
        
        delay(300);
        bootPhase = 3;
    }
    
    // Phase 3: Text fade in
    if (bootPhase == 3) {
        tft.setTextColor(COLOR_GOLD, COLOR_BG);
        tft.setTextDatum(MC_DATUM);
        tft.drawString("PLUTO LANDER", SCREEN_W/2, SCREEN_H/2 + 50, 4);
        
        tft.setTextColor(COLOR_GRAY, COLOR_BG);
        tft.drawString("Trading Bot Display", SCREEN_W/2, SCREEN_H/2 + 75, 2);
        
        delay(500);
        bootPhase = 4;
    }
    
    // Phase 4: Gold flash
    if (bootPhase == 4) {
        tft.fillScreen(COLOR_GOLD);
        delay(150);
        tft.fillScreen(COLOR_BG);
        delay(100);
        bootPhase = 5;
    }
}

//===========================================
// UI DRAWING FUNCTIONS
//===========================================

void drawTopBar() {
    // Background
    tft.fillRect(0, 0, SCREEN_W, 28, tft.color565(20, 20, 30));
    
    // WiFi icon
    if (WiFi.status() == WL_CONNECTED) {
        tft.fillCircle(15, 14, 6, COLOR_GREEN);
    } else {
        tft.fillCircle(15, 14, 6, COLOR_RED);
    }
    
    // Time
    tft.setTextColor(COLOR_WHITE, tft.color565(20, 20, 30));
    tft.setTextDatum(TL_DATUM);
    
    // Get time (or show placeholder)
    char timeStr[10];
    sprintf(timeStr, "%02d:%02d", hour(), minute());
    tft.drawString(timeStr, 30, 6, 2);
    
    // Title
    tft.setTextColor(COLOR_GOLD, tft.color565(20, 20, 30));
    tft.setTextDatum(MC_DATUM);
    tft.drawString("PLUTO LANDER", SCREEN_W/2, 14, 2);
    
    // Trend indicator
    uint16_t trendColor = COLOR_GRAY;
    if (trend == "up") trendColor = COLOR_GREEN;
    else if (trend == "down") trendColor = COLOR_RED;
    tft.fillCircle(SCREEN_W - 15, 14, 6, trendColor);
}

void drawMainMetrics() {
    int y = 35;
    
    // Portfolio Value
    tft.setTextColor(COLOR_GRAY, COLOR_BG);
    tft.setTextDatum(TL_DATUM);
    tft.drawString("Portfolio Value", 10, y, 2);
    
    tft.setTextColor(COLOR_WHITE, COLOR_BG);
    char valStr[20];
    sprintf(valStr, "$%.2f", portfolioValue);
    tft.drawString(valStr, 10, y + 18, 4);
    
    // Daily P&L
    y += 55;
    tft.setTextColor(COLOR_GRAY, COLOR_BG);
    tft.drawString("Daily P&L", 10, y, 2);
    
    uint16_t plColor = dailyPL >= 0 ? COLOR_GREEN : COLOR_RED;
    tft.setTextColor(plColor, COLOR_BG);
    char plStr[30];
    sprintf(plStr, "%s$%.2f (%.1f%%)", dailyPL >= 0 ? "+" : "", dailyPL, dailyPLPercent);
    tft.drawString(plStr, 10, y + 18, 2);
    
    // BTC Price (right side)
    tft.setTextColor(COLOR_GRAY, COLOR_BG);
    tft.setTextDatum(TR_DATUM);
    tft.drawString("BTC-USD", SCREEN_W - 10, 35, 2);
    
    tft.setTextColor(COLOR_GOLD, COLOR_BG);
    char btcStr[15];
    sprintf(btcStr, "$%.0f", btcPrice);
    tft.drawString(btcStr, SCREEN_W - 10, 53, 4);
    
    // Position Status
    tft.setTextDatum(TR_DATUM);
    tft.setTextColor(COLOR_GRAY, COLOR_BG);
    tft.drawString("Status", SCREEN_W - 10, 90, 2);
    
    uint16_t posColor = COLOR_CYAN;
    if (position == "LONG") posColor = COLOR_GREEN;
    else if (position == "SHORT") posColor = COLOR_RED;
    tft.setTextColor(posColor, COLOR_BG);
    tft.drawString(position.c_str(), SCREEN_W - 10, 108, 2);
}

void drawMiniChart() {
    int chartY = 135;
    int chartH = 50;
    int chartW = SCREEN_W - 20;
    
    // Chart background
    tft.fillRect(10, chartY, chartW, chartH, tft.color565(15, 15, 20));
    tft.drawRect(10, chartY, chartW, chartH, tft.color565(40, 40, 50));
    
    // Draw line chart
    if (chartIndex > 1) {
        int maxVal = 1;
        int minVal = 100000;
        for (int i = 0; i < chartIndex && i < 60; i++) {
            if (chartData[i] > maxVal) maxVal = chartData[i];
            if (chartData[i] < minVal) minVal = chartData[i];
        }
        int range = maxVal - minVal;
        if (range < 1) range = 1;
        
        for (int i = 1; i < chartIndex && i < 60; i++) {
            int x1 = 10 + ((i-1) * chartW / 60);
            int x2 = 10 + (i * chartW / 60);
            int y1 = chartY + chartH - ((chartData[i-1] - minVal) * (chartH-4) / range) - 2;
            int y2 = chartY + chartH - ((chartData[i] - minVal) * (chartH-4) / range) - 2;
            tft.drawLine(x1, y1, x2, y2, COLOR_CYAN);
        }
    }
}

void drawTicker() {
    int tickerY = 195;
    
    // Ticker background
    tft.fillRect(0, tickerY, SCREEN_W, 24, tft.color565(25, 20, 10));
    
    // Scrolling text
    tft.setTextColor(COLOR_GOLD, tft.color565(25, 20, 10));
    tft.setTextDatum(TL_DATUM);
    tft.drawString(tickerText.c_str(), tickerX, tickerY + 4, 2);
    
    // Scroll ticker
    tickerX -= 2;
    int textWidth = tickerText.length() * 12;
    if (tickerX < -textWidth) {
        tickerX = SCREEN_W;
    }
}

void drawStatusBar() {
    int y = SCREEN_H - 20;
    
    // Background
    tft.fillRect(0, y, SCREEN_W, 20, tft.color565(15, 15, 20));
    
    // WiFi signal
    tft.setTextColor(COLOR_GRAY, tft.color565(15, 15, 20));
    tft.setTextDatum(TL_DATUM);
    if (WiFi.status() == WL_CONNECTED) {
        tft.drawString("WiFi OK", 5, y + 3, 1);
    } else {
        tft.setTextColor(COLOR_RED, tft.color565(15, 15, 20));
        tft.drawString("No WiFi", 5, y + 3, 1);
    }
    
    // FPS / Update time
    tft.setTextColor(COLOR_GRAY, tft.color565(15, 15, 20));
    tft.setTextDatum(TR_DATUM);
    tft.drawString("Pluto Lander v3.0", SCREEN_W - 5, y + 3, 1);
}

//===========================================
// DATA FETCHING
//===========================================

void fetchDataFromPi() {
    if (WiFi.status() != WL_CONNECTED) return;
    
    HTTPClient http;
    
    // Fetch BTC price from Coinbase
    http.begin("https://api.coinbase.com/v2/prices/BTC-USD/spot");
    int httpCode = http.GET();
    if (httpCode == 200) {
        String payload = http.getString();
        JsonDocument doc;
        deserializeJson(doc, payload);
        btcPrice = doc["data"]["amount"].as<float>();
    }
    http.end();
    
    // Add to chart
    chartData[chartIndex % 60] = (int)btcPrice;
    chartIndex++;
    
    // TODO: Fetch from Pi backend when available
    // For now, use placeholder data
    portfolioValue = 10000 + random(-500, 500);
    dailyPL = random(-100, 200);
    dailyPLPercent = dailyPL / 100.0;
    
    tickerText = "BTC: $" + String((int)btcPrice) + " | System Active | Waiting for signals...";
}

int hour() { return (millis() / 3600000) % 24; }
int minute() { return (millis() / 60000) % 60; }

//===========================================
// SETUP & LOOP
//===========================================

void setup() {
    Serial.begin(115200);
    delay(300);
    
    // Turn on backlight
    pinMode(TFT_BL, OUTPUT);
    digitalWrite(TFT_BL, HIGH);
    
    Serial.println("Initializing ST7789V...");
    
    // Initialize display
    tft.init();
    tft.setRotation(1);  // Landscape
    tft.fillScreen(COLOR_BG);
    
    Serial.println("Display initialized!");
    
    // Run boot animation
    while (bootPhase < 5) {
        drawBootSequence();
    }
    
    Serial.println("Boot sequence complete!");
    
    // Connect to WiFi
    tft.fillScreen(COLOR_BG);
    tft.setTextColor(COLOR_WHITE, COLOR_BG);
    tft.setTextDatum(MC_DATUM);
    tft.drawString("Connecting to WiFi...", SCREEN_W/2, SCREEN_H/2, 2);
    
    WiFi.begin(ssid, password);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi connected!");
        tft.drawString("WiFi Connected!", SCREEN_W/2, SCREEN_H/2 + 20, 2);
    } else {
        Serial.println("\nWiFi failed, continuing...");
        tft.drawString("WiFi Failed - Offline Mode", SCREEN_W/2, SCREEN_H/2 + 20, 2);
    }
    
    delay(1000);
    tft.fillScreen(COLOR_BG);
    
    // Initial data fetch
    fetchDataFromPi();
}

void loop() {
    unsigned long now = millis();
    
    // Update data every 10 seconds
    if (now - lastUpdate > 10000) {
        fetchDataFromPi();
        lastUpdate = now;
        
        // Redraw static elements
        tft.fillScreen(COLOR_BG);
        drawTopBar();
        drawMainMetrics();
        drawMiniChart();
        drawStatusBar();
    }
    
    // Update ticker every 50ms
    if (now - lastTickerScroll > 50) {
        drawTicker();
        lastTickerScroll = now;
    }
    
    delay(10);
}

