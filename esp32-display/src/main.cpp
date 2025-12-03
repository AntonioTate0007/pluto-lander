/**
 * PLUTO LANDER ESP32 - Reference Image Match
 * Vertical layout: TIME | BLOCK HEIGHT | BOT STATUS
 */

#include <Arduino.h>
#include <TFT_eSPI.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ArduinoOTA.h>

TFT_eSPI tft = TFT_eSPI();

const char* ssid = "TW";
const char* password = "4075752351";

#define BG     0x0000  // Pure black
#define PANEL  tft.color565(20, 20, 24)
#define GOLD   tft.color565(255, 193, 7)
#define GREEN  tft.color565(76, 175, 80)
#define RED    tft.color565(244, 67, 54)
#define WHITE  0xFFFF
#define GRAY   tft.color565(140, 140, 140)

int blockHeight = 890518;
float blockChange = 5.3;
int hours = 12, mins = 43;
String botStatus = "Waiting for signal...";

void draw() {
    tft.fillScreen(BG);
    
    // ========== SECTION 1: TIME (Top) ==========
    tft.fillRoundRect(8, 8, 304, 90, 10, PANEL);
    
    tft.setTextColor(GRAY, PANEL);
    tft.setTextDatum(TC_DATUM);
    tft.drawString("Local Time", 160, 20, 2);
    
    // Huge time display
    char timeStr[8];
    sprintf(timeStr, "%02d:%02d", hours, mins);
    tft.setTextColor(WHITE, PANEL);
    tft.drawString(timeStr, 160, 50, 7);
    
    // ========== SECTION 2: BLOCK HEIGHT (Middle) ==========
    tft.fillRoundRect(8, 106, 304, 120, 10, PANEL);
    
    // Header with icon
    tft.fillCircle(20, 120, 6, GOLD);
    tft.setTextColor(GRAY, PANEL);
    tft.setTextDatum(TL_DATUM);
    tft.drawString("Block Height", 32, 115, 2);
    
    // Percentage on right
    char pctStr[12];
    sprintf(pctStr, "%.1f%%", blockChange);
    tft.setTextDatum(TR_DATUM);
    tft.setTextColor(GREEN, PANEL);
    tft.drawString(pctStr, 312, 115, 2);
    
    // Massive block number
    tft.setTextColor(WHITE, PANEL);
    tft.setTextDatum(TC_DATUM);
    char blockStr[20];
    sprintf(blockStr, "%d", blockHeight);
    tft.drawString(blockStr, 160, 155, 6);
    
    // Green sparkline graph
    int y0 = 200;
    int prevY = y0;
    for(int i = 0; i < 280; i += 4) {
        int y = y0 + random(-8, 8);
        tft.drawLine(20 + i - 4, prevY, 20 + i, y, GREEN);
        prevY = y;
    }
    
    // ========== SECTION 3: BOT STATUS (Bottom) ==========
    tft.fillRoundRect(8, 234, 304, 100, 10, PANEL);
    
    tft.setTextColor(GOLD, PANEL);
    tft.setTextDatum(TC_DATUM);
    tft.drawString("Bot Ready", 160, 250, 2);
    
    tft.setTextColor(GRAY, PANEL);
    tft.drawString(botStatus, 160, 280, 2);
    
    // Status indicator bar
    tft.fillRect(60, 310, 200, 4, GRAY);
    
    // Footer
    tft.setTextColor(GRAY, BG);
    tft.setTextDatum(BC_DATUM);
    tft.drawString("PLUTO LAUNCHER", 160, 468, 2);
}

void fetchData() {
    if (WiFi.status() != WL_CONNECTED) return;
    
    HTTPClient http;
    
    // Fetch block height
    http.begin("https://mempool.space/api/blocks/tip/height");
    http.setTimeout(5000);
    if (http.GET() == 200) {
        blockHeight = http.getString().toInt();
    }
    http.end();
    
    // Calculate change (mock for now)
    blockChange = 5.3 + random(-50, 50) / 100.0;
}

void setupOTA() {
    ArduinoOTA.setHostname("pluto-esp32");
    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        int pct = (progress * 100) / total;
        tft.fillRect(60, 200, 200, 20, BG);
        tft.fillRect(62, 202, (pct * 196) / 100, 16, GREEN);
        
        char buf[10];
        sprintf(buf, "%d%%", pct);
        tft.setTextColor(WHITE, BG);
        tft.setTextDatum(MC_DATUM);
        tft.drawString(buf, 160, 230, 2);
    });
    ArduinoOTA.begin();
}

void setup() {
    pinMode(21, OUTPUT);
    digitalWrite(21, HIGH);
    
    tft.init();
    tft.setRotation(0);  // Portrait
    tft.invertDisplay(false);
    tft.fillScreen(BG);
    
    // Boot screen
    tft.setTextColor(GOLD, BG);
    tft.setTextDatum(MC_DATUM);
    tft.drawString("PLUTO", 120, 200, 4);
    tft.drawString("LAUNCHER", 120, 240, 4);
    
    tft.setTextColor(GRAY, BG);
    tft.drawString("Connecting...", 120, 300, 2);
    
    WiFi.begin(ssid, password);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        tft.setTextColor(GREEN, BG);
        tft.drawString("Connected!", 120, 350, 2);
        setupOTA();
        delay(1000);
    }
    
    fetchData();
    draw();
}

void loop() {
    ArduinoOTA.handle();
    
    static unsigned long lastTime = 0;
    static unsigned long lastFetch = 0;
    static unsigned long lastDraw = 0;
    static int msgIndex = 0;
    
    // Update time every second
    if (millis() - lastTime > 1000) {
        mins++;
        if (mins >= 60) {
            mins = 0;
            hours++;
            if (hours >= 24) hours = 0;
        }
        lastTime = millis();
        
        // Rotate status messages
        const char* messages[] = {
            "Waiting for signal...",
            "Monitoring markets...",
            "System ready...",
            "Standby mode..."
        };
        botStatus = messages[msgIndex++ % 4];
    }
    
    // Fetch data every 30 seconds
    if (millis() - lastFetch > 30000) {
        fetchData();
        lastFetch = millis();
    }
    
    // Redraw every 2 seconds
    if (millis() - lastDraw > 2000) {
        draw();
        lastDraw = millis();
    }
    
    delay(100);
}
