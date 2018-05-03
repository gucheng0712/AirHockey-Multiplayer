var socket;
var player;
var ball;
var lastPos;
var canPlay = false;
var players = [];
var onlinePlayerNum = 0;

var waitImg;

var randomR, randomG, randomB;

var transitionStart = -1;
var transitionDuration = 1000;
var bgColor;
var bgStartColor;
var bgTargetColor;

function preload() {
    waitImg = loadImage('https://source.unsplash.com/random');
}

function setup() {
    socket = io.connect('https://arcane-sands-59256.herokuapp.com/');

    randomR = random(255);
    randomG = random(255);
    randomB = random(255);
    bgColor = color(255, 0, 0);
    bgTargetColor = bgColor;
    createCanvas(800, 600);
    ball = new Ball(width / 2, height / 2, 4, 4, 30);
    socket.on('getPlayerNum', function (data) {
        onlinePlayerNum = data;
        print(onlinePlayerNum);
        if (player == null) {
            if (onlinePlayerNum == 2)
                player = new Player(50);
            else
                player = new Player(width - 50);
            var data = {
                x: player.x,
                y: player.y,
                v: player.velocity,
                w: player.w,
                h: player.h,
                points: player.points
            };
            socket.emit('start', data);
        }


        var data = {
            x: ball.x,
            y: ball.y,
            xv: ball.xv,
            yv: ball.yv,
            r: ball.r
        };
        socket.emit('startBall', data);

        if (onlinePlayerNum == 2) {
            canPlay = true;
        }
    });

    socket.on('heartbeat', function (data) {
        players = data;
    });

    socket.on('heartbeatBall', function (data) {
        if (data != null) {
            ball.x = data.x,
                ball.y = data.y,
                ball.xv = data.xv,
                ball.yv = data.yv,
                ball.r = data.r
        }
    });

}

function draw() {
    envt();
    waitingRoom();
    inGame();
}

function envt() {
    lerpBackgroundColor();
    background(80);
    fill(bgColor)
    stroke(220);
    rect(width * 0.1, height / 2, width * 0.2, height / 2, 50);
    rect(width * 0.9, height / 2, width * 0.2, height / 2, 50);
    rect(width / 2, height / 2, width * 0.9, height * 0.9, 10);

    fill(200);
    ellipse(width / 2, height / 2, width / 10, width / 10)
    fill(220);
    rect(width / 2, height * 0.1, 200, 60);
    fill(10)
    rect(width / 2, height * 0.1, 180, 42);
    noFill();
    stroke(255);
    strokeWeight(3);
    line(width / 2, 0, width / 2, height);
    ellipse(width / 2, height / 2, width / 3, width / 3);
    noStroke();
}



function throwBall() {
    ball.x = width / 2;
    ball.y = height / 2;
}

function waitingRoom() {
    if (canPlay == false) {
        image(waitImg, 0, 0);
    }
}

function inGame() {
    if (canPlay == true) {
        createAnotherPlayer();
        player.drawPlayer();
        player.playerMovement();
        ball.drawBall();
        ball.ballMovement();

        bouncingOrScoring();
        emitUpdatedData();
    }
}

function emitUpdatedData() {
    var data = {
        x: player.x,
        y: player.y,
        w: player.w,
        h: player.h,
        points: player.points
    };

    socket.emit('update', data);

    var data = {
        x: ball.x,
        y: ball.y,
        xv: ball.xv,
        yv: ball.yv,
        r: ball.r
    };
    socket.emit('updateBall', data);
}

function createAnotherPlayer() {
    for (var i = 0; i < players.length; i++) {
        var id = players[i].id;
        if (id != socket.id) {
            fill(0);
            noStroke();
            ellipse(players[i].x, players[i].y, players[i].w * 1.1, players[i].h * 1.1);
            fill(randomR, randomG, randomB);
            rectMode(CENTER);
            rect(players[i].x, players[i].y, players[i].w, players[i].h, 20);
            fill(0)
            ellipse(players[i].x, players[i].y, players[i].w / 2.5, players[i].h / 2.5);
            fill(80);
            ellipse(players[i].x, players[i].y, players[i].w / 3, players[i].h / 3);
            stroke(220);
        }
    }
    scoreBoard(players);
}

function scoreBoard(_player) {
    textSize(40);
    fill(220, 0, 0);
    stroke(255);
    for (var i = 0; i < _player.length; i++) {
        if (_player[i].points != null) {
            if (_player[i].x < width / 2) {
                text(_player[i].points.toString(), width / 2 - 80, 75);
            } else {
                text(_player[i].points.toString(), width / 2 + 10, 75);
            }

        }
    }
}

function bouncingOrScoring() {

    for (var i = 0; i < players.length; i++) {
        //        var id = players[i].id;
        //        if (id != socket.id) {
        if (ball.collision(players[i]) && players[i].x < width / 2) {
            ball.xv = 15;
        }

        if (ball.collision(players[i]) && players[i].x > width / 2) {
            ball.xv = -15;
        }

        //      }
    }
    //    if (ball.collision(player) && player.x < width / 2) {
    //        ball.xv = 15;
    //    }
    //
    //    if (ball.collision(player) && player.x > width / 2) {
    //        ball.xv = -15;
    //    }
    if (ball.y > height / 4 && ball.y < 3 * height / 4) {
        if (ball.x < 0) {
            throwBall();
            if (player.x > width / 2) {
                player.points++;
            }
        }
        if (ball.x > width) {
            throwBall();
            if (player.x < width / 2)
                player.points++;
        }
        //print(player.points);
    }
}

function lerpBackgroundColor() {


    if (transitionStart > -1) {
        var elapsedTime = millis() - transitionStart;

        if (elapsedTime > transitionDuration) {
            bgColor = bgTargetColor;
            transitionStart = -1;
        }
        var t = elapsedTime / transitionDuration;
        bgColor = lerpColor(bgColor, bgTargetColor, t);
    }

    if (frameCount % 200 == 0) {
        transitionStart = millis();
        bgStartColor = bgColor;
        bgTargetColor = color(random(255), random(255), random(255));
    }
}





// Objects
function Player(x) {
    this.x = x;
    this.y = height / 2;
    this.velocity = 4;
    this.w = 40;
    this.h = 40;
    this.points = 0;

    this.drawPlayer = function () {

        rectMode(CENTER);
        noStroke();
        fill(0);
        ellipse(this.x, this.y, this.w + 3, this.h + 3);
        fill(0, 200, 255);
        rect(this.x, this.y, this.w, this.h, 20);
        fill(0);
        ellipse(this.x, this.y, this.w / 2.5, this.h / 2.5);
        fill(80);
        ellipse(this.x, this.y, this.w / 3, this.h / 3);
        stroke(220);
    }

    this.playerMovement = function () {
        if (keyIsDown(UP_ARROW)) {
            this.y -= this.velocity;
        } else if (keyIsDown(DOWN_ARROW)) {
            this.y += this.velocity;
        }
    }
}

function Ball(x, y, xv, yv, r) {
    this.x = x;
    this.y = y;
    this.xv = xv;
    this.yv = yv;
    this.r = r;
    this.drawBall = function () {
        fill(255);
        stroke(0);
        ellipse(this.x, this.y, this.r, this.r);
        noStroke();
    }

    this.ballMovement = function () {
        if (this.y <= height * 0.1 - this.r / 2)
            this.yv = 10;
        if (this.y >= height * 0.9 + this.r / 2)
            this.yv = -10;
        if (ball.y < height / 4 || ball.y > 3 * height / 4) {
            if (this.x <= width * 0.1 - this.r / 2) {
                this.xv = 10;
            }
            if (this.x >= width * 0.9 + this.r / 2) {
                this.xv = -10;
            }
        }

        this.y += this.yv;
        this.x += this.xv;
    }

    this.collision = function (obj) {
        var d = dist(this.x, this.y, obj.x, obj.y);
        if (this.y <= obj.y + obj.h / 2 && this.y >= obj.y - obj.h / 2)
            if (this.x <= obj.x + obj.w / 2 && this.x >= obj.x - obj.w / 2) {
                if (this.y - obj.y < 0)
                    this.yv = 8;
                else if (this.y - obj.y == 0)
                    this.yv = 0;
                else
                    this.yv = -8;
                return true;
            }
        return false;
    }
}
