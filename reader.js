var AWS = require('aws-sdk');

var s3 = new AWS.S3();
var params = {Bucket: 'upld-bkt-223378'};

s3.listObjectsV2(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else {
    console.log(data.Contents[0].Key);           // successful response
    for (var i = 0; i < data.Contents.length; i++) {
      var getParams = {Bucket: 'upld-bkt-223378', Key: data.Contents[i].Key};
      s3.getObject(getParams, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
          console.log(data.Body.toString());           // successful response
        }
      });
      copyObject(data.Contents[i].Key);
    }
  }
});

function copyObject(key) {
  var params = {
    Bucket: "bakp-bkt-223378",
    CopySource: "/upld-bkt-223378/" + key,
    Key: key
 };
 s3.copyObject(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else {
     console.log(data);           // successful response
     deleteObject(params.Key);
   }
 });
}

function deleteObject(key) {
  var params = {
  Bucket: "upld-bkt-223378",
  Key: key
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
