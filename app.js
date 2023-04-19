const AWS = require('aws-sdk');
const express = require('express');
const ejs = require("ejs");
const app = express();
const port = 3000;

app.set("view engine", "ejs");
AWS.config.update({
    region: "*******", 
    accessKeyId: "*******", 
    secretAccessKey: "*******", 
  });


const dynamodb = new AWS.DynamoDB();


const tableName = 'WaterLevelLogs';


app.get('/', (req, res) => {
  
  const params = {
    TableName: tableName
  };

  
  dynamodb.scan(params, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error getting latest entry from DynamoDB');
    } else {
      
      const sortedItems = data.Items.sort((a, b) => {
        return b.id.N - a.id.N;
      });

      
      const latestItem = sortedItems[0];
      console.log(latestItem);

      
      res.render("index", { item: latestItem});
    }
  });
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
