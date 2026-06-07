// Tic-Tac-Toe Game Logic

const ICONS = [
  { id: 'safari', name: 'Safari', svgId: 'svg-safari' },
  { id: 'appstore', name: 'App Store', svgId: 'svg-appstore' },
  { id: 'messages', name: 'Messages', svgId: 'svg-messages' },
  { id: 'phone', name: 'Phone', svgId: 'svg-phone' },
  { id: 'mail', name: 'Mail', svgId: 'svg-mail' },
  { id: 'photos', name: 'Photos', svgId: 'svg-photos' },
  { id: 'camera', name: 'Camera', svgId: 'svg-camera' },
  { id: 'settings', name: 'Settings', svgId: 'svg-settings' },
  { id: 'music', name: 'Music', svgId: 'svg-music' },
  { id: 'maps', name: 'Maps', svgId: 'svg-maps' }
];

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

// State variables
let p1Name = 'Player 1';
let p2Name = 'Player 2';
let p1IconId = null;
let p2IconId = null;

let currentPlayer = 1; // 1 = P1, 2 = P2
let boardState = Array(9).fill(null);
let gameActive = true;

// DOM Elements
const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');
const galleryP1 = document.getElementById('galleryP1');
const galleryP2 = document.getElementById('galleryP2');
const p1Preview = document.getElementById('p1Preview');
const p2Preview = document.getElementById('p2Preview');
const startGameBtn = document.getElementById('startGameBtn');

const p1NameInput = document.getElementById('player1Name');
const p2NameInput = document.getElementById('player2Name');

const p1Indicator = document.getElementById('p1Indicator');
const p2Indicator = document.getElementById('p2Indicator');
const p1IndicatorIcon = document.getElementById('p1IndicatorIcon');
const p2IndicatorIcon = document.getElementById('p2IndicatorIcon');
const p1IndicatorName = document.getElementById('p1IndicatorName');
const p2IndicatorName = document.getElementById('p2IndicatorName');
const turnAnnouncement = document.getElementById('turnAnnouncement');
const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');

const resetGameBtn = document.getElementById('resetGameBtn');
const backToSetupBtn = document.getElementById('backToSetupBtn');

// Initialize Gallery UI
function initGalleries() {
  renderGallery(galleryP1, 1);
  renderGallery(galleryP2, 2);
}

function renderGallery(container, playerNum) {
  container.innerHTML = '';
  ICONS.forEach(icon => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gallery-item';
    btn.dataset.id = icon.id;
    btn.setAttribute('aria-label', `Select ${icon.name}`);
    
    // Get SVG clone
    const svgClone = document.getElementById(icon.svgId).cloneNode(true);
    svgClone.removeAttribute('id');
    btn.appendChild(svgClone);

    btn.addEventListener('click', () => selectIcon(playerNum, icon.id));
    container.appendChild(btn);
  });
}

function selectIcon(playerNum, iconId) {
  if (playerNum === 1) {
    p1IconId = iconId;
  } else {
    p2IconId = iconId;
  }

  updateGallerySelections();
  updatePreviews();
  checkStartButtonStatus();
}

function updateGallerySelections() {
  // Update Player 1 Gallery
  const p1Items = galleryP1.querySelectorAll('.gallery-item');
  p1Items.forEach(item => {
    const itemId = item.dataset.id;
    item.classList.remove('selected', 'disabled');
    
    if (itemId === p1IconId) {
      item.classList.add('selected');
    }
    if (itemId === p2IconId) {
      item.classList.add('disabled');
    }
  });

  // Update Player 2 Gallery
  const p2Items = galleryP2.querySelectorAll('.gallery-item');
  p2Items.forEach(item => {
    const itemId = item.dataset.id;
    item.classList.remove('selected', 'disabled');
    
    if (itemId === p2IconId) {
      item.classList.add('selected');
    }
    if (itemId === p1IconId) {
      item.classList.add('disabled');
    }
  });
}

function updatePreviews() {
  // P1 Preview
  if (p1IconId) {
    const iconObj = ICONS.find(i => i.id === p1IconId);
    const svgClone = document.getElementById(iconObj.svgId).cloneNode(true);
    svgClone.removeAttribute('id');
    p1Preview.innerHTML = '';
    p1Preview.appendChild(svgClone);
  } else {
    p1Preview.innerHTML = '<span class="no-selection">None selected</span>';
  }

  // P2 Preview
  if (p2IconId) {
    const iconObj = ICONS.find(i => i.id === p2IconId);
    const svgClone = document.getElementById(iconObj.svgId).cloneNode(true);
    svgClone.removeAttribute('id');
    p2Preview.innerHTML = '';
    p2Preview.appendChild(svgClone);
  } else {
    p2Preview.innerHTML = '<span class="no-selection">None selected</span>';
  }
}

function checkStartButtonStatus() {
  if (p1IconId && p2IconId && p1IconId !== p2IconId) {
    startGameBtn.removeAttribute('disabled');
  } else {
    startGameBtn.setAttribute('disabled', 'true');
  }
}

// Start the game!
function startGame() {
  p1Name = p1NameInput.value.trim() || 'Player 1';
  p2Name = p2NameInput.value.trim() || 'Player 2';

  // Setup indicators
  p1IndicatorName.textContent = p1Name;
  p2IndicatorName.textContent = p2Name;

  // Add SVGs to indicators
  const p1IconObj = ICONS.find(i => i.id === p1IconId);
  const p1Svg = document.getElementById(p1IconObj.svgId).cloneNode(true);
  p1Svg.removeAttribute('id');
  p1IndicatorIcon.innerHTML = '';
  p1IndicatorIcon.appendChild(p1Svg);

  const p2IconObj = ICONS.find(i => i.id === p2IconId);
  const p2Svg = document.getElementById(p2IconObj.svgId).cloneNode(true);
  p2Svg.removeAttribute('id');
  p2IndicatorIcon.innerHTML = '';
  p2IndicatorIcon.appendChild(p2Svg);

  // Transition screens
  setupScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');

  resetGame();
}

// Reset board state
function resetGame() {
  boardState = Array(9).fill(null);
  gameActive = true;
  currentPlayer = 1;

  // Clean UI
  cells.forEach(cell => {
    cell.innerHTML = '';
    cell.className = 'cell';
    cell.removeAttribute('disabled');
  });

  board.className = 'board';

  updateTurnUI();
}

function updateTurnUI() {
  if (currentPlayer === 1) {
    p1Indicator.classList.add('active');
    p2Indicator.classList.remove('active');
    turnAnnouncement.textContent = `It's ${p1Name}'s turn!`;
    turnAnnouncement.style.color = 'var(--p1-theme)';
  } else {
    p2Indicator.classList.add('active');
    p1Indicator.classList.remove('active');
    turnAnnouncement.textContent = `It's ${p2Name}'s turn!`;
    turnAnnouncement.style.color = 'var(--p2-theme)';
  }
}

// Cell click handler
function handleCellClick(e) {
  const cell = e.currentTarget;
  const index = parseInt(cell.dataset.index);

  if (boardState[index] !== null || !gameActive) {
    return;
  }

  // Record move
  boardState[index] = currentPlayer;

  // Render piece
  const activeIconId = currentPlayer === 1 ? p1IconId : p2IconId;
  const iconObj = ICONS.find(i => i.id === activeIconId);
  const svgClone = document.getElementById(iconObj.svgId).cloneNode(true);
  svgClone.removeAttribute('id');
  cell.appendChild(svgClone);
  cell.setAttribute('disabled', 'true');

  checkGameResult();
}

function checkGameResult() {
  let roundWon = false;
  let winningCombo = null;

  for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
    const combo = WINNING_COMBINATIONS[i];
    const a = boardState[combo[0]];
    const b = boardState[combo[1]];
    const c = boardState[combo[2]];

    if (a === null || b === null || c === null) {
      continue;
    }
    if (a === b && b === c) {
      roundWon = true;
      winningCombo = combo;
      break;
    }
  }

  if (roundWon) {
    gameActive = false;
    
    // Highlight winning cells
    winningCombo.forEach(idx => {
      cells[idx].classList.add('win');
    });

    if (currentPlayer === 1) {
      board.classList.add('win-p1');
      turnAnnouncement.textContent = `🎉 ${p1Name} Wins!`;
      turnAnnouncement.style.color = 'var(--p1-theme)';
    } else {
      board.classList.add('win-p2');
      turnAnnouncement.textContent = `🎉 ${p2Name} Wins!`;
      turnAnnouncement.style.color = 'var(--p2-theme)';
    }

    // Trigger confetti shower!
    fireConfetti();
    return;
  }

  // Check for draw
  const roundDraw = !boardState.includes(null);
  if (roundDraw) {
    gameActive = false;
    turnAnnouncement.textContent = "It's a Draw! 🤝";
    turnAnnouncement.style.color = 'var(--text-main)';
    return;
  }

  // Switch player
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  updateTurnUI();
}

function fireConfetti() {
  const duration = 3.5 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.75 }
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.75 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

// Event Listeners
startGameBtn.addEventListener('click', startGame);
resetGameBtn.addEventListener('click', resetGame);
backToSetupBtn.addEventListener('click', () => {
  gameScreen.classList.add('hidden');
  setupScreen.classList.remove('hidden');
});

cells.forEach(cell => {
  cell.addEventListener('click', handleCellClick);
});

// Initialize on load
initGalleries();
updatePreviews();
checkStartButtonStatus();
