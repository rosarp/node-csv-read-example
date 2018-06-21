const AWS = require('aws-sdk');
const http = require('http');
const parse = require('csv-parse');

const s3 = new AWS.S3();

exports.handler = function (event, context) {
  return csvProcess(event);
};

const runLocally = false;
if (runLocally) {
  const event = {"Records": [{"s3": {"object": {"key": "order.csv"},"bucket": {"name": "upld-bkt-223378"}}}]};
  csvProcess(event);
}

function csvProcess(event) {
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  const getParams = {
      Bucket: bucket,
      Key: key
  };

  s3.getObject(getParams, function(err, data) {
    if (err) {
      console.log(err, err.stack);
    }
    else {
      // console.log(data.Body.toString());
      sendFileToAPI(data.Body.toString());
    }
    copyFileFromBucket(s3, getParams);
  });
  return key;
}

function copyFileFromBucket(s3, getParams) {
  var params = {
    Bucket: "bakp-bkt-223378",
    CopySource: "/" + getParams.Bucket + "/" + getParams.Key,
    Key: getParams.Key
 };
 s3.copyObject(params, function(err, data) {
   if (err) {
     console.log(err, err.stack);
   }
   else {
     console.log(data);
     deleteFileFromBucket(s3, getParams);
   }
 });
}

function deleteFileFromBucket(s3, getParams) {
  var params = {
  Bucket: getParams.Bucket,
  Key: getParams.Key
 };
 s3.deleteObject(params, function(err, data) {
   if (err) console.log(err, err.stack);
   else {
     console.log(data);
   }
 });
}

function sendFileToAPI(csvData) {
  var columnParser = parse({delimiter: ','});

  //const http_options = { hostname: '127.0.0.1', port: '8080', method: 'post' };
  const http_options = { hostname: 'ec2-54-88-214-236.compute-1.amazonaws.com', port: '8080', method: 'post' };

  // Use the writable stream api
  columnParser.on('readable', function(){
    var rowRecord = columnParser.read();
    while(rowRecord){
      var post_req = http.request(http_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
          console.log('Response: ' + chunk);
          // TODO: Log chunk to mongodb
        });
      });
      post_req.write(JSON.stringify(rowRecord));
      post_req.end();
      rowRecord = columnParser.read();
    }
  });
  // Catch any error
  columnParser.on('error', function(err){
    console.log('ColumnParser: ' + err.message);
  });

  columnParser.write(csvData);
  // Close the readable stream
  columnParser.end();
}
