const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

let index, style;

const onRequest = (request, response) => {


  const sendResponse = (body, contentType, statusCode = 200) => {
    response.writeHead(statusCode, {'Content-Type': contentType});
    response.write(body);
    response.end();
  }

  console.log(request.url);
  switch (request.url) {
    case '/uptime':
      const child = spawn('uptime');
      let aggregateData = '';
      child.stdout.on('data', (data) => {
        aggregateData += data;
      });

      child.on('exit', (code, signal) => {
        sendResponse(aggregateData, 'text/plain');
      });
      break;
    case '/weather':
      (function(){
        const child = spawn('/home/mainuser/go/bin/weather', ['--server', 'http://morganfreeman.rit.edu:1234']);
        let aggregateData = '';
        child.on('error', (data) => {
          console.log('error');
          console.log(data);
        });
        child.stdout.on('data', (data) => {
          aggregateData += data;
        });
        child.stderr.on('data', (data) => {
          aggregateData += data;
        });

        child.on('exit', (code, signal) => {
          sendResponse(aggregateData, 'text/plain');
        });
      })();
      break;
    case '/style.css':
      style = fs.readFileSync(`${__dirname}/style.css`);
      sendResponse(style, 'text/css');
      break;
    case '/':
    case '/index.html':
    default:
      index = fs.readFileSync(`${__dirname}/index.html`);
      sendResponse(index, 'text/html');
      break;
  }

}

http.createServer(onRequest).listen(port);
