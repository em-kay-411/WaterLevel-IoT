#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
int TRIGGER = D3;
int ECHO   = D2;
int RELAY = D5;
// Replace with your network credentials
const char* ssid = "Galaxy M3194C2";
const char* password = "eeyy6643";
ESP8266WebServer server(80);   //instantiate server at port 80 (http port)

String page = "";
int data; 
void setup(void){
 pinMode(TRIGGER, OUTPUT); 
 pinMode(ECHO, INPUT); 
 pinMode(RELAY, OUTPUT);
  delay(1000);
  Serial.begin(9600);
  WiFi.begin(ssid, password); //begin WiFi connection
  Serial.println("");
  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to ");
  Serial.println(ssid);
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  server.on("/", [](){
    String dataString = String(data);
    String motorStatus = digitalRead(RELAY) == HIGH ? "ON" : "OFF";
    String postData = "motor_status=" + motorStatus + "&water_level=" + dataString;
    WiFiClient client;
    if (client.connect("localhost", 8080)) {
      client.println("POST /data HTTP/1.1");
      client.println("Content-Type: application/x-www-form-urlencoded");
      client.println("Content-Length: " + String(postData.length()));
      client.println();
      client.println(postData);
      client.flush();
      client.stop();
    }
    page = "<head><meta http-equiv=\"refresh\" content=\"3\"></head><center><h1>Web based Water Level monitor</h1><h3>Current water level is :-</h3> <h4>"+String(data)+"</h4> <br> <h3>Current motor status is :-</h3> <h4>"+motorStatus+"</h4> </center>";
    server.send(200,"text/html",page);
});
  server.begin();
  Serial.println("Web server started!");
  digitalWrite(RELAY, LOW);
}
 void loop(void){
  if(digitalRead(RELAY) == HIGH){
    Serial.println("MotorStatus,ON,waterLevel," + String(data));
  } else{
    Serial.println("MotorStatus,OFF,waterLevel," + String(data));
  }
  digitalWrite(TRIGGER, LOW);  
  delayMicroseconds(2); 
  digitalWrite(TRIGGER, HIGH);
  delayMicroseconds(10); 
  digitalWrite(TRIGGER, LOW);
  long duration = pulseIn(ECHO, HIGH);
  data = (duration/2) / 29.09;
  if(data <= 5){
    digitalWrite(RELAY, LOW);
  } else if(data >= 15){
    digitalWrite(RELAY, HIGH);
  }
  server.handleClient();
  delay(10000);
}