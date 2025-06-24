const socket = io();
let playerSymbol = null;
const cells = document.querySelectorAll('.cell');
const statusDiv = document.getElementById('status');
const resetBtn = document.getElementById('reset');

// Atualizar tabuleiro
function updateBoard(index, symbol) {
  cells[index].textContent = symbol;
}

// Atualizar status
function updateStatus(message) {
  statusDiv.textContent = message;
}

// Eventos do Socket.IO
socket.on('player_assigned', (symbol) => {
  playerSymbol = symbol;
  updateStatus(`Você é o jogador ${playerSymbol}. Aguardando oponente...`);
});

socket.on('game_full', () => {
  updateStatus('Sala cheia! Apenas 2 jogadores permitidos.');
});

socket.on('game_start', (data) => {
  updateStatus(`Jogo iniciado! Vez do jogador ${data.currentPlayer}`);
});

socket.on('move_made', (data) => {
  updateBoard(data.index, data.player);
});

socket.on('player_change', (player) => {
  updateStatus(`Vez do jogador ${player}`);
});

socket.on('game_over', (result) => {
  if (result === 'draw') {
    updateStatus('Empate! Clique em Reiniciar.');
  } else {
    updateStatus(`Jogador ${result} venceu! Clique em Reiniciar.`);
  }
});

socket.on('game_reset', (data) => {
  cells.forEach(cell => cell.textContent = '');
  gameState = data.gameState;
  updateStatus(`Jogo reiniciado! Vez do jogador ${data.currentPlayer}`);
});

// Cliques no tabuleiro
cells.forEach(cell => {
  cell.addEventListener('click', () => {
    const index = cell.getAttribute('data-index');
    socket.emit('make_move', parseInt(index));
  });
});

// Botão de reinício
resetBtn.addEventListener('click', () => {
  socket.emit('reset_game');
});