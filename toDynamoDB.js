const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const AWS = require("aws-sdk");
const fs = require("fs");

AWS.config.update({
  region: "********", // Replace with your region
  accessKeyId: "********", // Replace with your access key ID
  secretAccessKey: "********", // Replace with your secret access key
});

const depth = 100;

const port = new SerialPort({ path: 'COM7', baudRate: 9600 }); // Replace with your serial port name
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));
const docClient = new AWS.DynamoDB.DocumentClient();
var id = 0;
parser.on("data", (data) => {
  console.log(data);
  const values = data.split(",");
  if (values[0] === "MotorStatus") {
    const motorStatus = values[1].trim();
    const waterLevel = (depth - Number(values[3].trim())).toString() 
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
		"id": id,
        "timestamp": timestamp,
        "motorStatus": motorStatus,
        "waterLevel": waterLevel,
      }
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
});
