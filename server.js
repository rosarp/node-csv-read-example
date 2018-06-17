const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  let post_data = '';
  req.on('data', function(data) {
    post_data += data;
  })
  req.on('end', function(data) {
    console.log("Body: " + post_data);
    res.end(JSON.parse(post_data)[3]);
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
