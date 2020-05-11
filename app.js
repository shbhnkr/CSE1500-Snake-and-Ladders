var express = require("express");
var http = require("http");
const WebSocket = require('ws');

var app = express();
var server = http.createServer(app);

const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname + "/public"));

app.use('/game*', function (req, res, err) {
  res.sendFile(__dirname + "/public/game.html")
})

app.get('/*', (req, res) => {
  //example of data to render; here gameStatus is an object holding this information
  res.render('splash.ejs', { gamesStarted: gamesStarted, gamesOngoing: gamesOngoing(), gamesCompleted: gamesCompleted });
})

let gamesStarted = 0
let gamesOngoing = function () {
  let glen = games.length
  let count = 0
  for (let i = 0; i < glen; i++) {
    if (games[i].state === "ongoing")
      count++;
  }
  return count
}
let gamesCompleted = 0

//array which stores all games
var games = []

//array of board positions
var board = [];
createBoard();

/*
game {
  state: "waiting" | "ongoing" | "ended"
  playerA:
  playerB: 
  playerAPos:
  playerBPos:
  currentTurn: "A" | "B"
}
*/

wss.on("connection", function (ws) {
  console.log("Connection Made");

  ws.on("close", function () {
    let gameId
    let player
    for (let index = 0; index < games.length; index++) {
      const game = games[index];
      if (game.playerA === ws) {
        gameId = index;
        player = "A"
        break
      } else if (game.playerB === ws) {
        gameId = index;
        player = "B"
        break
      }
    }
    if (games[gameId].state !== "ended") {
      if (player === "A" && games[gameId].playerB) {
        games[gameId].playerB.send(JSON.stringify({
          type: "abort"
        }))
      }
      else if (player === "B" && games[gameId].playerA) {
        games[gameId].playerA.send(JSON.stringify({
          type: "abort"
        }))
      }
      gamesCompleted++
      games[gameId].state = "ended"
    }
  })

  ws.on("message", function (json_msg) {
    let message = JSON.parse(json_msg)

    switch (message.type) {
      case "playerJoin":
        let gameFound
        for (let gameIndex = 0; gameIndex < games.length; gameIndex++) {
          let game = games[gameIndex]
          if (game.state === "waiting") {
            gameFound = game
            if (!game.playerA) {
              game.playerA = ws
              ws.send(JSON.stringify({
                type: "playerAdded",
                data: {
                  gameId: gameIndex,
                  playerType: "A"
                }
              }))
            }
            else if (!game.playerB) {
              game.playerB = ws
              ws.send(JSON.stringify({
                type: "playerAdded",
                data: {
                  gameId: gameIndex,
                  playerType: "B"
                }
              }))
              game.state = "ongoing"

              game.playerA.send(JSON.stringify({
                type: "gameStart"
              }))
              game.playerB.send(JSON.stringify({
                type: "gameStart"
              }))

              gamesStarted++;
            }
          }
        }
        if (!gameFound) {
          games.push({
            state: "waiting",
            playerA: ws,
            playerB: null,
            playerAPos: 1,
            playerBPos: 1,
            currentTurn: "A"
          })
          ws.send(JSON.stringify({
            type: "playerAdded",
            data: {
              gameId: games.length - 1,
              playerType: "A"
            }
          }))
        }
        break

      case "rollDice":
        let game = games[message.data.gameId]
        let player = message.data.playerType
        if (player === "A") {
          let newPos = rollDice(game.playerAPos)
          if (newPos >= 100) {
            winnerMessage(game, "A")
          }
          else {
            let jsonObj = JSON.stringify({
              type: "positionUpdate",
              data: {
                playerTurn: nextPlayer(player),
                playerAPos: newPos,
                playerBPos: game.playerBPos
              }
            })
            game.playerA.send(jsonObj)
            game.playerB.send(jsonObj)
            game.playerAPos = newPos
          }
        }
        else if (player === "B") {
          let newPos = rollDice(game.playerBPos)
          if (newPos >= 100) {
            winnerMessage(game, "B")
          }
          else {
            let jsonObj = JSON.stringify({
              type: "positionUpdate",
              data: {
                playerTurn: nextPlayer(player),
                playerAPos: game.playerAPos,
                playerBPos: newPos
              }
            })
            game.playerA.send(jsonObj)
            game.playerB.send(jsonObj)
            game.playerBPos = newPos
          }
        }
        break

    }
  })
});

function winnerMessage(game, player) {
  game.state = "ended"
  gamesCompleted++
  game.playerA.send(JSON.stringify({
    type: "winner",
    data: {
      playerId: player
    }
  }))
  game.playerB.send(JSON.stringify({
    type: "winner",
    data: {
      playerId: player
    }
  }))

  if (player === "A")
    game.playerAPos = 100
  else if (player === "B")
    game.playerBPos = 100
}

function nextPlayer(currentPlayer) {
  if (currentPlayer === "A")
    return "B"
  else if (currentPlayer === "B")
    return "A"
}

function rollDice(currentPos) {
  let diceRoll = Math.floor(Math.random() * 6) + 1
  return validMove(diceRoll + currentPos)
}

function createBoard() {
  for (let i = 0; i < 100; i++) {
    board[i] = -1;
  }

  //Ladder position
  board[5] = 26; board[10] = 29; board[20] = 58; board[33] = 67; board[71] = 90; board[56] = 97;
  //Snake position
  board[93] = 52; board[82] = 78; board[85] = 34; board[87] = 75; board[61] = 41; board[44] = 18; board[35] = 28; board[49] = 8;

//   //Test
//   board[2] = 99; board[3] = 99; board[4] = 99; board[5] = 99; board[6] = 99; board[7] = 99;
}

function validMove(position) {
  if (position >= 100)
    return 100;
  if (board[position] == -1) {
    return position;
  } else {
    return board[position];
  }
}


server.listen(3000);

