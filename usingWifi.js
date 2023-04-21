const axios = require("axios");
const AWS = require("aws-sdk");
const fs = require("fs");

AWS.config.update({
  region: "****", // Replace with your region
  accessKeyId: "****", // Replace with your access key ID
  secretAccessKey: "***", // Replace with your secret access key
});

const depth = 100;   // Replace with the depth of the tank
const docClient = new AWS.DynamoDB.DocumentClient();
var id = 0;
const url = "http://192.168.69.98:80/data"; // Replace with the IP address and port number of your ESP8266 server

setInterval(() => {
  axios
    .get(url)
    .then((response) => {
      const data = response.data;
      console.log(data);
      const values = data.split(",");
      if (values[0] === "MotorStatus") {
        const motorStatus = values[1].trim();
        var waterLevel = ((Number(values[3].trim()) / depth) *100).toString();
        if (waterLevel <= 0) {
          waterLevel = 0;
        } else if (waterLevel >= 100) {
          waterLevel = 100;
        }
        const timestamp = new Date().toISOString();

        const log = `${timestamp} - Motor Status: ${motorStatus}, Water Level: ${waterLevel}\n`;

        // Append log to file
        fs.appendFile("log.txt", log, (err) => {
          if (err) throw err;
          //console.log("Log appended to file!");
        });

        const params = {
          TableName: "WaterLevelLogs", // Replace with your table name
          Item: {
            id: id,
            timestamp: timestamp,
            motorStatus: motorStatus,
            waterLevel: waterLevel,
          },
        };

        docClient.put(params, (err, data) => {
          if (err) {
            console.error("Unable to add item", err);
          } else {
            console.log("Item added to table");
          }
        });
        id++;
      }
    })
    .catch((error) => {
      console.log(error);
    });
}, 1000);
