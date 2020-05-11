var c = document.getElementById("game");
var context = c.getContext("2d");

function drawBoard(player, position) {
    var ypos = [
        680, 680, 680, 680, 680, 680, 680, 680, 680, 680,
        605, 605, 605, 605, 605, 605, 605, 605, 605, 605,
        530, 530, 530, 530, 530, 530, 530, 530, 530, 530, 
        455, 455, 455, 455, 455, 455, 455, 455, 455, 455, 
        380, 380, 380, 380, 380, 380, 380, 380, 380, 380, 
        305, 305, 305, 305, 305, 305, 305, 305, 305, 305, 
        230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 
        155, 155, 155, 155, 155, 155, 155, 155, 155, 155, 
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
        5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
    var xpos = [
        25, 100, 175, 250, 325, 400, 475, 550, 625, 700,
        700, 625, 550, 475, 400, 325, 250, 175, 100, 25,
        25, 100, 175, 250, 325, 400, 475, 550, 625, 700,
        700, 625, 550, 475, 400, 325, 250, 175, 100, 25,
        25, 100, 175, 250, 325, 400, 475, 550, 625, 700,
        700, 625, 550, 475, 400, 325, 250, 175, 100, 25,
        25, 100, 175, 250, 325, 400, 475, 550, 625, 700,
        700, 625, 550, 475, 400, 325, 250, 175, 100, 25,
        25, 100, 175, 250, 325, 400, 475, 550, 625, 700,
        700, 625, 550, 475, 400, 325, 250, 175, 100, 25];
    var offset = 13;
    context.beginPath();

    switch (player) {
        case 1:
            context.rect(xpos[position-1] + offset, ypos[position-1] + offset, 27, 27);
            context.fillStyle = "red";
            context.fill();
            break;
        case 2:
            context.rect(xpos[position-1] - offset, ypos[position-1] - offset, 27, 27);
            context.fillStyle = "blue";
            context.fill();
            break;
    }
    context.closePath();
}

var socket;
var playerType;
var gameId;
var dice = document.getElementById("rollDiceButton");
var stateText = document.getElementById("state");
console.log("Starting a 2 players game");
socket = new WebSocket("ws://localhost:3000");
socket.onopen = function () {
    socket.send(JSON.stringify({
        type: "playerJoin"
    }));
};

drawBoard(1, 1);
drawBoard(2, 1);

socket.onmessage = function (event) {
    var json = JSON.parse(event.data);
    console.log(json);
    switch (json.type) {
        case 'playerAdded':
            console.log(json.data.playerType);
            stateText.innerText = "You are player " + colorOfPlayer(json.data.playerType);
            gameId = json.data.gameId;
            playerType = json.data.playerType;
            break;
        case 'gameStart':
            if (playerType === "A") {
                dice.hidden = false;
            } else {
                dice.hidden = true;
            }
            break;
        case 'positionUpdate':
            clearLeCanvas();
            drawBoard(1, json.data.playerAPos);
            drawBoard(2, json.data.playerBPos);
            if (playerType == json.data.playerTurn) {
                dice.hidden = false;
            }
            else {
                dice.hidden = true;
            }
            break;
        case 'winner':
            console.log("player won");
            window.alert("Player " + colorOfPlayer(json.data.playerId)+ " won!");
            break;
    }
}

function clearLeCanvas() {
    context.clearRect(0, 0, c.width, c.height);
}

function colorOfPlayer(number) {
    switch (number) {
        case "A":
            return "Red";
        case "B":
            return "Blue";
    }
}

function rollDice() {
    socket.send(JSON.stringify({
        type: "rollDice",
        data: {
            gameId: gameId,
            playerType: playerType,
        }
    }))
}
