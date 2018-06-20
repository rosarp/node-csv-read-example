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
      // TODO: Reading full csv. Need to read line by line
      // console.log(data.Body.toString());
      sendPostRequest(data.Body.toString());
    }
    copyObject(s3, getParams);
  });
  return key;
}

function copyObject(s3, getParams) {
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
     deleteObject(s3, getParams);
   }
 });
}

function deleteObject(s3, getParams) {
  var params = {
  Bucket: getParams.Bucket,
  Key: getParams.Key
 };
 s3.deleteObject(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else {
     console.log(data);           // successful response
   }
 });
}

//require('should');

function sendPostRequest(csvData) {
  var columnParser = parse({delimiter: ','});

  const http_options = { hostname: '127.0.0.1', port: '3000', method: 'post' };

  var output = [];
  // Use the writable stream api
  columnParser.on('readable', function(){
    var record = columnParser.read();
    while(record){
      output.push(record);
      /*
      var post_req = http.request(http_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
          console.log('Response: ' + chunk);
        });
      });
      post_req.write(JSON.stringify(record));
      post_req.end();
      */
      record = columnParser.read();
    }
  });
  // Catch any error
  columnParser.on('error', function(err){
    console.log('ColumnParser: ' + err.message);
  });
  // When we are done, test that the parsed output matched what expected
  columnParser.on('finish', function(){
    /*output.should.eql([
      [ 'one', 'two', 'three', 'four', 'five' ],
      [ 'ichi', 'ni', 'san', 'shi', 'go' ]
    ]);*/
  });

  columnParser.write(csvData);
  // Close the readable stream
  columnParser.end();
}
