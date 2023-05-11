const axios = require("axios");
const AWS = require("aws-sdk");
const fs = require("fs");
const sendMail = require('./sendMail')

//Authenticating AWS
AWS.config.update({
  region: "*****", // Replace with your region
  accessKeyId: "*****", // Replace with your access key ID
  secretAccessKey: "*****", // Replace with your secret access key
});

//Variables required
const senderEmail = "*****";
const receiverEmail = "*******";
const emailSubject = "Faulty Water Tank Motor";
const emailBody = "The motor that is being used in the water tank might be faulty. Please switch it OFF manually and report the technician to avoid failure.";
var testLevel = 0;
const maxTTL = 20;
var ttl = maxTTL;
const depth = 100;
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = "WaterLevelLogs"
var id = 0;
const maxItems = 7;
const url = "http://192.168.127.98:80/data"; // Replace with the IP address and port number of your ESP8266 server


function deleteAllItems(tableName, callback) {
  const params = {
    TableName: tableName
  };

  docClient.scan(params, (err, data) => {
    if (err) {
      console.log(err);
      callback(err);
      return;
    }

    const deleteRequests = data.Items.map(item => {
      return {
        DeleteRequest: {
          Key: {
            'id': item.id // Replace with the correct attribute name for the primary key
          }
        }
      };
    });

    const params = {
      RequestItems: {
        [tableName]: deleteRequests
      }
    };

    docClient.batchWrite(params, (err, data) => {
      if (err) {
        console.log(err);
        callback(err);
      } else {
        console.log("Done Deleting the elements from dynamodb")
        callback(null, data);
      }
    });
  });
}



//The actual loop
setInterval(() => {
  axios
    .get(url)
    .then((response) => {
      const data = response.data;
      console.log(data);
      const values = data.split(",");
      if (values[0] === "MotorStatus") {
        const motorStatus = values[1].trim();
        var waterLevel = ((Number(values[3].trim()) / depth) * 100).toString();
        if (waterLevel <= 0) {
          waterLevel = 0;
        } else if (waterLevel >= 100) {
          waterLevel = 100;
        }

        // To check if the motor is faulty
        if (motorStatus === "ON") {
          if (testLevel < waterLevel) {
            testLevel = waterLevel;
            ttl = maxTTL;
          } else if (testLevel >= waterLevel) {
            ttl--;
          }

          console.log(`TTL - ${ttl}`);

          if (ttl === 0) {
            sendMail(senderEmail, receiverEmail, emailSubject, emailBody);
            ttl = maxTTL;
          }
        } else {
          ttl = maxTTL;
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

        // Delete if the total items are 30
        if (id === maxItems) {
          deleteAllItems(tableName, (err, data) => {
            if (err) {
              console.error('Error deleting items:', err);
            } else {
              console.log('All items deleted from table:', tableName);
            }
          });

          id = 0;
        }
      }
    })
    .catch((error) => {
      console.log(error);
    });
}, 1000);
