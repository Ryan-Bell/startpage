// TODO docker, tasks list, plex information, simple auth system
// TODO endpoint to get colors set on computer so that they can be applied in css
const http = require('http');
const fs = require('fs');
const url = require('url');
const { spawn } = require('child_process');

// setup the converter for ansi color sequences
const AnsiToHtml = require('ansi-to-html');

const converter = new AnsiToHtml();

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// index and style files
let index;
let style;

const onRequest = (request, response) => {
  console.log(request.url);

  const sendResponse = (body, contentType, statusCode = 200, meta = false) => {
    response.writeHead(statusCode, { 'Content-Type': contentType });
    if (!meta) response.write(body);
    response.end();
  };

  const outputScript = (command, exitCallback) => {
    const child = spawn(command.split(' ')[0], command.split(' ').slice(1));
    let aggregateData = '';
    child.stdout.on('data', (data) => {
      aggregateData += data;
    });

    child.on('exit', () => {
      exitCallback(aggregateData.toString());
    });
  };

  const addTask = (task) => {
    // simple sanatization of user input
    if (task.match(/^[0-9a-z ]+$/i)) {
      // add the task to the startpage list
      const child = spawn('/home/mainuser/bin/t', ['--list', 'startpage', task]);
      child.on('exit', () => {
        sendResponse('successful', 'text/plain', 201);
      });
      return;
    }
    sendResponse('{"message":"Must be 0-9 and a-Z","id":"invalidTask"', 'application/json', 400);
  };

  const meta = request.method === 'HEAD';
  const parsedUrlPath = url.parse(request.url).pathname;
  const queryParams = url.parse(request.url, true).query;

  switch (parsedUrlPath) {
    case '/uptime':
      outputScript('uptime', (output) => {
        sendResponse(output, 'text/plain', 200, meta);
      });
      break;
    case '/weather': {
      let command = '/home/mainuser/go/bin/weather --server http://morganfreeman.rit.edu:1234 -ignore-alerts';

      // if hideicon query param is set and not false then hide ascii art
      if (queryParams && queryParams.hideicon) command += ' --hide-icon';
      outputScript(command, (output) => {
        sendResponse(converter.toHtml(output), 'text/plain');
      });
      break;
    }
    case '/tasks':
      if (request.method === 'POST') {
        let body = '';
        request.on('data', (chunk) => {
          body += chunk.toString();
        });
        request.on('error', () => {
          sendResponse('{"message":"upload failed","id":"failedupload"}', 'application/json', 400);
        });
        request.on('end', () => {
          addTask(body);
        });
      } else {
        outputScript('/home/mainuser/bin/t --list startpage', (output) => {
          sendResponse(output, 'text/plain');
        });
      }
      break;
    case '/style.css':
      style = fs.readFileSync(`${__dirname}/../client/style.css`);
      sendResponse(style, 'text/css', 200, meta);
      break;
    case '/':
    case '/index.html':
      index = fs.readFileSync(`${__dirname}/../client/index.html`);
      sendResponse(index, 'text/html', 200, meta);
      break;
    default:
      sendResponse('{"message":"Not Found","id":"404"}', 'application/json', 404, meta);
      break;
  }
};

http.createServer(onRequest).listen(port);
