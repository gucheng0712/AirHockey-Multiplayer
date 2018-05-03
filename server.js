var players = [];
var connections = [];
var ball;

var express = require('express');
var app = express();
var server = app.listen(process.env.PORT || 3000);
app.use(express.static('public'));
console.log("Server is Running!");
var socket = require('socket.io');
var io = socket(server);


setInterval(heartbeat, 16);
heartbeatBall();

function heartbeat() {
    io.sockets.emit('heartbeat', players);

}

function heartbeatBall() {
    io.sockets.emit('heartbeatBall', ball);
}



io.sockets.on('connection', function (socket) {
    if (connections.length < 2) {
        connections.push(socket);
        io.sockets.emit('getPlayerNum', connections.length);
        console.log("Connection Num: " + connections.length);

    } else {
        return;
    }

    socket.on('start', function (data) {
        var p = new Player(socket.id, data.x, data.y, data.w, data.h, data.points);
        players.push(p);
        console.log("Player Num: " + players.length);
    });

    socket.on('startBall', function (data) {
        ball = new Ball(socket.id, data.x, data.y, data.xv, data.yv, data.r);
    });

    socket.on('disconnect', function (data) {
        connections.splice(connections.indexOf(socket), 1);
        players.pop();
        //players = [];
        //players.splice(connections.indexOf(socket), 1);
        console.log("disconnected");
        console.log("Connection Num: " + connections.length);
        console.log("Player Num: " + players.length);
    });

    socket.on('update', function (data) {
        var p;
        for (var i = 0; i < players.length; i++) {
            if (socket.id == players[i].id) {
                p = players[i];
                p.x = data.x;
                p.y = data.y;
                p.v = data.v;
                p.w = data.w;
                p.h = data.h;
                p.points = data.points;
            }
        }

    });

    socket.on('updateBall', function (data) {
        ball.x = data.x;
        ball.y = data.y;
        ball.xv = data.xv;
        ball.yv = data.yv;
        ball.r = data.r;
    });

});

function Player(id, x, y, v, w, h, p) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.points = p;
}

function Ball(id, x, y, xv, yv, r) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.xv = xv;
    this.yv = yv;
    this.r = r;
}
