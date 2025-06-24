const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

let players = {};
let currentPlayer = 'X';
let gameState = Array(9).fill('');
let gameActive = true;

io.on('connection', (socket) => {
  console.log(`Novo jogador: ${socket.id}`);

  // Atribuir jogador (X ou O)
  if (Object.keys(players).length < 2) {
    const playerSymbol = Object.keys(players).length === 0 ? 'X' : 'O';
    players[socket.id] = playerSymbol;
    socket.emit('player_assigned', playerSymbol);

    // Iniciar jogo quando 2 jogadores estiverem conectados
    if (Object.keys(players).length === 2) {
      io.emit('game_start', { currentPlayer, gameState });
    }
  } else {
    socket.emit('game_full');
  }

  // Receber jogada
  socket.on('make_move', (index) => {
    if (players[socket.id] !== currentPlayer || !gameActive || gameState[index] !== '') return;

    gameState[index] = currentPlayer;
    io.emit('move_made', { index, player: currentPlayer });

    // Verificar vitória/empate
    const winner = checkWinner();
    if (winner) {
      io.emit('game_over', winner);
      gameActive = false;
    } else if (!gameState.includes('')) {
      io.emit('game_over', 'draw');
      gameActive = false;
    } else {
      // Trocar jogador
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      io.emit('player_change', currentPlayer);
    }
  });

  // Resetar jogo
  socket.on('reset_game', () => {
    gameState = Array(9).fill('');
    gameActive = true;
    currentPlayer = 'X';
    io.emit('game_reset', { gameState, currentPlayer });
  });

  // Desconectar
  socket.on('disconnect', () => {
    delete players[socket.id];
    console.log(`Jogador desconectado: ${socket.id}`);
  });
});

function checkWinner() {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // linhas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // colunas
    [0, 4, 8], [2, 4, 6]             // diagonais
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
      return gameState[a];
    }
  }
  return null;
}

const PORT = 1000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});