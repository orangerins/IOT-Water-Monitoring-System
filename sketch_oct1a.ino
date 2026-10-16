#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <SoftwareSerial.h>

// ===============================
// SENSOR PINS
// ===============================

// Corrected sensor assignments
#define TURBIDITY_PIN A1
#define PH_PIN        A0
#define DO_PIN        A2
#define TEMP_PIN      2

// ===============================
// UNO -> ESP32 UART
// ===============================

// D3 = RX (unused)
// D7 = TX -> voltage divider -> ESP32 GPIO16

#define ESP_RX_PIN 3
#define ESP_TX_PIN 7

SoftwareSerial espSerial(ESP_RX_PIN, ESP_TX_PIN);

// ===============================
// TEMPERATURE SENSOR
// ===============================

OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);

// ===============================
// LCD
// ===============================

LiquidCrystal_I2C lcd(0x27, 16, 2);

unsigned long previousLCD = 0;
int lcdPage = 0;

void setup() {

  // PC Serial Monitor
  Serial.begin(9600);

  // ESP32 communication
  espSerial.begin(9600);

  // Initialize temperature sensor
  sensors.begin();

  // Initialize LCD
  lcd.init();
  lcd.backlight();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Water Quality");

  lcd.setCursor(0, 1);
  lcd.print("System Starting");

  delay(2000);

  Serial.println("==========================");
  Serial.println("UNO SENSOR SYSTEM STARTED");
  Serial.println("==========================");

  Serial.println("Turbidity: A1");
  Serial.println("pH: A0");
  Serial.println("DO: A2");
  Serial.println("Temperature: D2");
}

void loop() {

  // ===============================
  // TEMPERATURE
  // ===============================

  sensors.requestTemperatures();

  float tempC = sensors.getTempCByIndex(0);

  // ===============================
  // TURBIDITY
  // ===============================

  int turbidityRaw = analogRead(TURBIDITY_PIN);

  float turbidityVoltage =
    turbidityRaw * (5.0 / 1023.0);

  // ===============================
  // PH
  // ===============================

  int phRaw = analogRead(PH_PIN);

  float phVoltage =
    phRaw * (5.0 / 1023.0);

  // ===============================
  // DISSOLVED OXYGEN
  // ===============================

  int doRaw = analogRead(DO_PIN);

  float doVoltage =
    doRaw * (5.0 / 1023.0);

  // ===============================
  // UNO SERIAL MONITOR
  // ===============================

  Serial.println();
  Serial.println("------ SENSOR DATA ------");

  Serial.print("Temperature: ");
  Serial.print(tempC, 2);
  Serial.println(" C");

  Serial.print("Turbidity Raw: ");
  Serial.println(turbidityRaw);

  Serial.print("Turbidity Voltage: ");
  Serial.print(turbidityVoltage, 2);
  Serial.println(" V");

  Serial.print("pH Raw: ");
  Serial.println(phRaw);

  Serial.print("pH Voltage: ");
  Serial.print(phVoltage, 2);
  Serial.println(" V");

  Serial.print("DO Raw: ");
  Serial.println(doRaw);

  Serial.print("DO Voltage: ");
  Serial.print(doVoltage, 2);
  Serial.println(" V");

  // ===============================
  // SEND DATA TO ESP32
  // ===============================

  espSerial.print("TEMP:");
  espSerial.print(tempC, 2);

  espSerial.print(",TURB_RAW:");
  espSerial.print(turbidityRaw);

  espSerial.print(",TURB_V:");
  espSerial.print(turbidityVoltage, 2);

  espSerial.print(",PH_RAW:");
  espSerial.print(phRaw);

  espSerial.print(",PH_V:");
  espSerial.print(phVoltage, 2);

  espSerial.print(",DO_RAW:");
  espSerial.print(doRaw);

  espSerial.print(",DO_V:");
  espSerial.println(doVoltage, 2);

  // ===============================
  // LCD ROTATION
  // ===============================

  if (millis() - previousLCD >= 3000) {

    previousLCD = millis();

    lcd.clear();

    if (lcdPage == 0) {

      lcd.setCursor(0, 0);
      lcd.print("Temp:");
      lcd.print(tempC, 1);
      lcd.print(" C");

      lcd.setCursor(0, 1);
      lcd.print("Turb:");
      lcd.print(turbidityRaw);

    }

    else if (lcdPage == 1) {

      lcd.setCursor(0, 0);
      lcd.print("pH Raw:");
      lcd.print(phRaw);

      lcd.setCursor(0, 1);
      lcd.print("pH V:");
      lcd.print(phVoltage, 2);

    }

    else {

      lcd.setCursor(0, 0);
      lcd.print("DO Raw:");
      lcd.print(doRaw);

      lcd.setCursor(0, 1);
      lcd.print("DO V:");
      lcd.print(doVoltage, 2);

    }

    lcdPage++;

    if (lcdPage > 2) {
      lcdPage = 0;
    }
  }

  delay(1000);
}