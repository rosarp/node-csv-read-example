const aws = require('aws-sdk');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });

exports.handler = async (event, context) => {
  return csvProcess(event);
};

/*
const event = {
  "Records": [
    {
      "s3": {
        "object": {
          "key": "order.csv"
        },
        "bucket": {
          "name": "upld-bkt-223378"
        }
      }
    }
  ]
}
*/

csvProcess(event);

function csvProcess(event) {
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  const params = {
      Bucket: bucket
  };

  s3.listObjectsV2(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {                                // successful response
      for (var i = 0; i < data.Contents.length; i++) {
        console.log(data.Contents[i].Key);
        var getParams = {
          Bucket: params.Bucket,
          Key: data.Contents[i].Key
        };
        s3.getObject(getParams, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else {
            console.log(data.Body.toString());           // successful response
          }
        });
        copyObject(getParams);
      }
    }
  });
  return key;
}

function copyObject(getParams) {
  var params = {
    Bucket: "bakp-bkt-223378",
    CopySource: "/upld-bkt-223378/" + getParams.Key,
    Key: getParams.Key
 };
 s3.copyObject(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else {
     console.log(data);           // successful response
     deleteObject(getParams);
   }
 });
}

function deleteObject(getParams) {
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

var parse = require('csv-parse');
var http = require('http');

var http_options = { hostname: '127.0.0.1', port: '3000', method: 'post' };

//require('should');

function sendPostRequest() {
  var output = [];
  // Create the parser
  var parser = parse({delimiter: ':'});
  // Use the writable stream api
  parser.on('readable', function(){
    while(record = parser.read()){
      output.push(record);

      var post_req = http.request(http_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
          console.log('Response: ' + chunk);
        });
      });
      post_req.write(JSON.stringify(record));
      post_req.end();
    }
  });
  // Catch any error
  parser.on('error', function(err){
    console.log(err.message);
  });
  // When we are done, test that the parsed output matched what expected
  parser.on('finish', function(){
    /*output.should.eql([
      [ 'one', 'two', 'three', 'four', 'five' ],
      [ 'ichi', 'ni', 'san', 'shi', 'go' ]
    ]);*/
  });
  // Now that setup is done, write data to the stream
  parser.write("one:two:three:four:five\n");
  parser.write("ichi:ni:san:shi:go\n");
  // Close the readable stream
  parser.end();
}
