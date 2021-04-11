process.title = 'Minesweeper';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;
var mongo = require('mongodb');

var MongoClient = require('mongodb').MongoClient;
var mongo_url = "mongodb://localhost:27017";

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
    // an enhanced HTTP request.
    httpServer: server
});

// This callback function is called every time someone tries to connect to the WebSocket server
wsServer.on('request', function (request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    var connection = request.accept(null, request.origin);
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;
    var gamesPlayed = 0;
    var minesLoc = [];

    console.log((new Date()) + ' Connection accepted.');

    // user sent some message
    connection.on('message', function (message) {
        if (message.type === 'utf8') { // accept only text
            if (userName === false) {
                // remember user name
                userName = htmlEntities(message.utf8Data);

                /*
                MONGO DB CODE TO GET USERNAMES
                */ 
                MongoClient.connect(mongo_url, function(err, db){
                    if (err) throw err;
                    var dbo = db.db("cp476-project");
                    var query = { user: userName};
                    var dbResults = "";
                    dbo.collection("highscores").find(query).toArray(function(err, result) {
                        if (err) throw err;
                            //dbResults = result;
                            if (result.length === 0) {
                                var myobj = {user: userName, timesPlayed: 0};
                                dbo.collection("highscores").insertOne(myobj, function(err, res){
                                    if (err) throw err;
                                    console.log((new Date()) + " New User Created");
                                    db.close();
                                    connection.sendUTF(JSON.stringify({ type: 'name', data: userName, gPlayed: 0}));
                                });
                            } else {
                                console.log((new Date()) +  + " Query Results " + result[0]);
                                gamesPlayed = result[0].timesPlayed;
                                connection.sendUTF(JSON.stringify({ type: 'name', data: userName, gPlayed: result[0].timesPlayed}));
                                console.log((new Date()) + ' User is known as: ' + userName);
                                db.close();
                            }
                    
                    });
                });
                

            } else if (message.utf8Data === "mines"){
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
                
            } else if (message.utf8Data === "newGame"){
                gamesPlayed = gamesPlayed + 1
                MongoClient.connect(mongo_url, function(err, db){
                    if (err) throw err;
                    var dbo = db.db("cp476-project");
                    //var myobj = {user: userName, timesPlayed: gamesPlayed}
                    dbo.collection("highscores").update(
                        { user: userName},
                        { $inc: {timesPlayed: 1}}
                    )
                    console.log((new Date()) + " Games played updated in database.")
                    
                    // insertOne(myobj, function(err, res){
                    //     if (err) throw err;
                    //     console.log("1 gameplayed inserted");
                    db.close();
                    //});
                 });
            
            } else {
                console.log((new Date()) + ' Received Message from '
                    + userName + ': ' + message.utf8Data);
            }
        }
    });

    // user disconnected
    connection.on('close', function (connection) {
        if (userName !== false) {
            console.log((new Date()) + " Peer disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
        }
        userName = false;
    });


});
