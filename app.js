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

  const sendResponse = (body, contentType, statusCode = 200, meta = false) => {
    response.writeHead(statusCode, {'Content-Type': contentType});
    if (!meta) response.write(body);
    response.end();
  }

  const handleTasks = () => {
    const child = spawn('/home/mainuser/bin/t', ['--list', 'startpage']);
    let aggregateData = '';
    child.stdout.on('data', (data) => {
      aggregateData += data;
    });

    child.on('exit', (code, signal) => {
      //TODO look at the code?
      sendResponse(aggregateData, 'text/plain');
    });
  };

  const addTask = (task) => {
    // simple sanatization of user input
    if (task.match(/^[0-9a-z ]+$/i)){
      // add the task to the startpage list
      const child = spawn('/home/mainuser/bin/t', ['--list', 'startpage', task]);
      child.on('exit', (code, signal) => {
        sendResponse('successful', 'text/plain', 201);
      });
      return;
    } 
    sendResponse('Must be 0-9 and a-Z', 'text/plain', 400);
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
  let meta = request.method == 'HEAD';
  let parsedUrlPath = url.parse(request.url).pathname;
  switch (parsedUrlPath) {
    case '/uptime':
      const child = spawn('uptime');
      let aggregateData = '';
      child.stdout.on('data', (data) => {
        aggregateData += data;
      });

      child.on('exit', (code, signal) => {
        sendResponse(aggregateData, 'text/plain', 200, meta);
      });
      break;
    case '/weather':
      handleWeather();
      break;
    case '/tasks':
      if (request.method == 'POST') {
        let body = '';
        request.on('data', chunk => {
          body += chunk.toString(); // convert Buffer to string
        });
        request.on('end', () => {
          addTask(body);
        });
      } else {
        handleTasks();
      }
      break;
    case '/style.css':
      style = fs.readFileSync(`${__dirname}/style.css`);
      sendResponse(style, 'text/css', 200, meta);
      break;
    case '/':
    case '/index.html':
      index = fs.readFileSync(`${__dirname}/index.html`);
      sendResponse(index, 'text/html', 200, meta);
      break;
    default:
      sendResponse('Page Not Found', 'text/plain', 404, meta);
      break;
  }
}


http.createServer(onRequest).listen(port);
