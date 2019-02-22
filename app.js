const http = require('http');
const fs = require('fs');

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
    case '/success':
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
