#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
int TRIGGER = D3;
int ECHO = D2;
int RELAY = D5;
// Replace with your network credentials
const char *ssid = "*****";
const char *password = "******";
ESP8266WebServer server(80); // instantiate server at port 80 (http port)
int depth = 100;
int lowerLimit = 15;
int upperLimit = 90;

int maxDepth = depth - lowerLimit;
int minDepth = depth - upperLimit;
String dataString = "";
int data;
void setup(void)
{
  pinMode(TRIGGER, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(RELAY, OUTPUT);
  delay(1000);
  Serial.begin(9600);
  WiFi.begin(ssid, password); // begin WiFi connection
  Serial.println("");
  // Wait for connection
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to ");
  Serial.println(ssid);
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  server.on("/data", []()
            { server.send(200, "text/plain", dataString); });
  server.begin();
  Serial.println("Web server started!");
  digitalWrite(RELAY, LOW);
}
void loop(void)
{
  if (digitalRead(RELAY) == HIGH)
  {
    dataString = "MotorStatus,ON,waterLevel," + String(depth - data);
    Serial.println("MotorStatus,ON,waterLevel," + String(depth - data));
  }
  else
  {
    dataString = "MotorStatus,OFF,waterLevel," + String(depth - data);
    Serial.println("MotorStatus,OFF,waterLevel," + String(depth - data));
  }
  digitalWrite(TRIGGER, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIGGER, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER, LOW);
  long duration = pulseIn(ECHO, HIGH);
  data = (duration / 2) / 29.09;
  if (data <= minDepth)
  {
    digitalWrite(RELAY, LOW);
  }
  else if (data >= maxDepth)
  {
    digitalWrite(RELAY, HIGH);
  }
  server.handleClient();
  delay(500);
}