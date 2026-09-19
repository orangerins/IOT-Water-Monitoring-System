#include <OneWire.h>
#include <DallasTemperature.h>

#define TEMP_PIN 2
#define TURBIDITY_PIN A1
#define PH_PIN A0
#define DO_PIN A2

OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);

// ---- DO Sensor Calibration ----
#define VREF 5000
#define ADC_RES 1023

#define CAL1_V 1600       // Replace with YOUR calibration voltage (mV)
#define CAL1_T 25         // Replace with YOUR calibration temperature (C)

const uint16_t DO_Table[41] = {
  14460, 14220, 13820, 13440, 13090, 12740, 12420, 12110, 11810, 11530,
  11260, 11010, 10770, 10530, 10300, 10080, 9860, 9660, 9460, 9270,
  9080, 8900, 8730, 8570, 8410, 8250, 8110, 7960, 7820, 7690,
  7560, 7430, 7300, 7180, 7070, 6950, 6840, 6730, 6630, 6530, 6410
};

// ---- DO Thresholds for Oreochromis niloticus (Nile Tilapia) ----
#define DO_OPTIMAL_MIN   5.0   // mg/L - optimal for growth
#define DO_ACCEPTABLE_MIN 3.0  // mg/L - acceptable but suboptimal
#define DO_STRESS_MIN    1.0   // mg/L - stress threshold, below this is critical

void setup() {
  Serial.begin(9600);
  sensors.begin();

  Serial.println("=== WATER QUALITY MONITOR ===");
  Serial.println("Target species: Oreochromis niloticus (Nile Tilapia)");
}

void loop() {
  // Temperature
  sensors.requestTemperatures();
  float tempC = sensors.getTempCByIndex(0);

  // Turbidity
  int turbidityRaw = analogRead(TURBIDITY_PIN);
  float turbidityVoltage = turbidityRaw * (5.0 / 1023.0);

  // pH sensor
  int phRaw = analogRead(PH_PIN);
  float phVoltage = phRaw * (5.0 / 1023.0);

  // Dissolved Oxygen
  int doRaw = analogRead(DO_PIN);
  uint32_t doVoltage_mV = (uint32_t)doRaw * VREF / ADC_RES;

  int tempIndex = (int)round(tempC);
  if (tempIndex < 0) tempIndex = 0;
  if (tempIndex > 40) tempIndex = 40;

  uint16_t V_saturation = (uint32_t)CAL1_V + (uint32_t)35 * tempIndex - (uint32_t)35 * CAL1_T;
  float doValue = (float)doVoltage_mV * DO_Table[tempIndex] / V_saturation / 1000.0; // mg/L

  // Determine DO status for tilapia
  String doStatus;
  if (doValue >= DO_OPTIMAL_MIN) {
    doStatus = "OPTIMAL";
  } else if (doValue >= DO_ACCEPTABLE_MIN) {
    doStatus = "ACCEPTABLE";
  } else if (doValue >= DO_STRESS_MIN) {
    doStatus = "STRESSFUL - Fish may show reduced feeding";
  } else {
    doStatus = "CRITICAL - Risk of mortality!";
  }

  // Display readings
  Serial.print("Temperature: ");
  Serial.print(tempC);
  Serial.println(" C");

  Serial.print("Turbidity Raw: ");
  Serial.print(turbidityRaw);
  Serial.print(" | Voltage: ");
  Serial.print(turbidityVoltage, 2);
  Serial.println(" V");

  Serial.print("pH Raw: ");
  Serial.print(phRaw);
  Serial.print(" | Voltage: ");
  Serial.print(phVoltage, 2);
  Serial.println(" V");

  Serial.print("DO Raw: ");
  Serial.print(doRaw);
  Serial.print(" | Voltage: ");
  Serial.print(doVoltage_mV);
  Serial.print(" mV | DO: ");
  Serial.print(doValue, 2);
  Serial.println(" mg/L");

  Serial.print("DO Status: ");
  Serial.println(doStatus);

  Serial.println("-------------------------");

  delay(2000);
}