const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

// setup the converter for ansi color sequences
const ansiConverter = require('ansi-to-html');
let converter = new ansiConverter();

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// index and style files
let index, style;

const onRequest = (request, response) => {


  const sendResponse = (body, contentType, statusCode = 200) => {
    response.writeHead(statusCode, {'Content-Type': contentType});
    response.write(body);
    response.end();
  }

  const handleTasks = () => {
    const child = spawn('/home/mainuser/bin/t', ['--list', 'startpage']);
    let aggregateData = '';
    child.stdout.on('data', (data) => {
      aggregateData += data;
    });

    child.on('exit', (code, signal) => {
      sendResponse(aggregateData, 'text/plain');
    });
  };

  const handleWeather = () => {
    const child = spawn('/home/mainuser/go/bin/weather', ['--server', 'http://morganfreeman.rit.edu:1234', '-ignore-alerts']);
    let aggregateData = '';
    child.on('error', (data) => {
      console.log(data);
    });
    child.stdout.on('data', (data) => {
      aggregateData += data;
    });
    child.stderr.on('data', (data) => {
      aggregateData += data;
    });

    child.on('exit', (code, signal) => {
      sendResponse(converter.toHtml(aggregateData.toString()), 'text/plain');
    });
  };

  console.log(request.url);
  //TODO docker, tasks list, plex information, simple auth system but stay logged in on local machine
  //TODO endpoint to get colors set on computer so that they can be applied in css
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
      handleWeather();
      break;
    case '/tasks':
      handleTasks();
      break;
    case '/style.css':
      style = fs.readFileSync(`${__dirname}/style.css`);
      sendResponse(style, 'text/css');
      break;
    case '/':
    case '/index.html':
      index = fs.readFileSync(`${__dirname}/index.html`);
      sendResponse(index, 'text/html');
      break;
    default:
      sendResponse('Page Not Found', 'text/plain', 404);
      break;
  }
}


http.createServer(onRequest).listen(port);
