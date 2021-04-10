process.title = 'Minesweeper';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs');
var url = require('url');

// list of currently connected clients (users)
var clients = [];
var height = 8;
var width = 8;
var mines = 10;
var gameCreated = false;
let minesLoc = [];

/**
 * Helper function for escaping input strings
 */
 function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var server = http.createServer(function (req, res) {
    var q = url.parse(req.url, true);
    console.log(q.pathname);
    var filename = "." + q.pathname;
    fs.readFile(filename, function (err, data) {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            return res.end("404 Not Found");
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(data);
        return res.end();
    });
});
server.listen(webSocketsServerPort, function () {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
 var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// This callback function is called every time someone tries to connect to the WebSocket server
wsServer.on('request', function (request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin);
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;

    console.log((new Date()) + ' Connection accepted.');

    // user sent some message
    connection.on('message', function (message) {
        if (message.type === 'utf8') { // accept only text
            if (userName === false) {
                // remember user name
                userName = htmlEntities(message.utf8Data);
                connection.sendUTF(JSON.stringify({ type: 'name', data: userName }));
                console.log((new Date()) + ' User is known as: ' + userName);

            } else if (message.utf8Data === "mines"){
                //if (gameCreated === false){
                    minesLoc = []
                    let randomx, randomy, minesPlanted = 0;
                    for (let i = 0; i < height; i++) {
                        minesLoc.push([]);
                        for (let j = 0; j < width; j++) {
                            minesLoc[i][j] = {
                                isMine: false,
                            };
                        }
                    }
                    while (minesPlanted < mines) {
                        randomx = Math.floor((Math.random() * 1000) + 1) % width;
                        randomy = Math.floor((Math.random() * 1000) + 1) % height;
                        if (!(minesLoc[randomx][randomy].isMine)) {
                            minesLoc[randomx][randomy].isMine = true;
                            minesPlanted++;
                        }
                    }
                    connection.send(JSON.stringify({type: 'mines', data: minesLoc}));
                    gameCreated = true;
                // } else {
                //     connection.send(JSON.stringify({type: 'mines', data: minesLoc}));
                //     gameCreated = false;
                // }
                
            } else { // log and broadcast the message
                console.log((new Date()) + ' Received Message from '
                    + userName + ': ' + message.utf8Data);
            }
        }
    });

    // user disconnected
    connection.on('close', function (connection) {
        if (userName !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
        }
    });


});
