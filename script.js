const player = document.getElementById("player");
const gameButton = document.getElementById("game-button");
const statusLabel = document.querySelector(".status-label");
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const dropsDisplay = document.getElementById("drops-remaining");
const gameMessage = document.getElementById("game-message");
const messageTitle = document.getElementById("message-title");
const messageText = document.getElementById("message-text");
const restartButton = document.getElementById("restart-button");
const resumeButton = document.getElementById("resume-button");
const resetButton = document.getElementById("reset-button");
const pauseButton = document.getElementById("pause-button");
const winSound = document.getElementById("win-sound");
const mazeBoard = document.querySelector(".maze-inner");
const walls = document.querySelectorAll(".wall");
const directionButtons = document.querySelectorAll(".key[data-direction]");
const isMobileDevice = window.matchMedia("(max-width: 540px)").matches;
const startingLives = 3;
const playerBorderClearance = 1;
const startingPlayerX = 46;
const startingPlayerY = Math.min(
  94,
  100 - ((player.offsetHeight + playerBorderClearance) / mazeBoard.clientHeight) * 100,
);

// Arrange drops in a regular grid and skip positions that overlap a wall.
for (let y = 4; y <= 96; y += 5.5) {
  for (let x = 3.5; x <= 96; x += 4.5) {
    const drop = document.createElement("span");
    drop.className = "drop";
    drop.style.left = `${x}%`;
    drop.style.top = `${y}%`;
    mazeBoard.append(drop);

    if (overlapsWall(drop, -2)) {
      drop.remove();
    }
  }
}

const additionalDropPositions = [
  [77.4, 2.7], [31.3, 2.8], [88.9, 2.8], [93.5, 2.8], [54.7, 3.0],
  [58.0, 3.0], [62.1, 3.0], [85.5, 3.0], [45.3, 3.2], [49.9, 3.2],
  [71.9, 3.2], [40.9, 3.3], [82.4, 3.3], [8.7, 3.5], [97.3, 3.5],
  [22.1, 3.7], [13.2, 3.8], [17.2, 3.8], [26.4, 4.0], [97.3, 10.0],
  [97.3, 14.8], [97.0, 20.6], [97.8, 27.3], [97.6, 32.6], [97.9, 39.4],
  [97.9, 46.7], [97.5, 53.9], [57.4, 55.9], [43.0, 56.6], [46.7, 56.6],
  [50.9, 56.6], [43.0, 61.2], [97.2, 61.6], [42.7, 67.7], [97.6, 68.6],
  [42.7, 73.8], [97.0, 74.0], [10.5, 79.4], [97.6, 79.4], [18.9, 79.5],
  [15.4, 79.7], [63.7, 79.7], [68.1, 79.7], [43.0, 80.0], [58.4, 80.0],
  [97.7, 89.2], [31.5, 96.2], [27.7, 96.3], [22.9, 96.6], [8.9, 96.8],
  [14.3, 96.8], [18.5, 96.8], [63.0, 96.8], [67.5, 96.8], [71.6, 96.8],
  [58.8, 97.0], [36.0, 97.3], [76.9, 97.3], [93.4, 97.3], [97.1, 97.3],
  [81.4, 97.5], [85.6, 97.8], [89.0, 97.8],
];

additionalDropPositions.forEach(([x, y]) => {
  const drop = document.createElement("span");
  drop.className = "drop";
  drop.style.left = `${x - 0.5}%`;
  drop.style.top = `${y - 0.7}%`;
  mazeBoard.append(drop);

  const dropBounds = drop.getBoundingClientRect();
  const overlapsAnotherDrop = Array.from(mazeBoard.querySelectorAll(".drop")).some((otherDrop) => {
    if (otherDrop === drop) return false;

    const otherBounds = otherDrop.getBoundingClientRect();
    return (
      dropBounds.left < otherBounds.right + 2 &&
      dropBounds.right > otherBounds.left - 2 &&
      dropBounds.top < otherBounds.bottom + 2 &&
      dropBounds.bottom > otherBounds.top - 2
    );
  });

  if (overlapsWall(drop) || overlapsAnotherDrop) {
    drop.remove();
  }
});

const bottomRightDropPositions = [
  [80.0, 89.5],
  [84.5, 89.5],
  [89.0, 89.5],
  [93.5, 89.5],
];

bottomRightDropPositions.forEach(([x, y]) => {
  const drop = document.createElement("span");
  drop.className = "drop";
  drop.style.left = `${x}%`;
  drop.style.top = `${y}%`;
  mazeBoard.append(drop);
});

const cleanDrops = Array.from(mazeBoard.querySelectorAll(".drop"));

if (isMobileDevice) {
  cleanDrops.forEach((drop) => drop.remove());

  // Use a responsive grid so small screens keep drops spaced away from walls.
  for (let y = 3; y <= 97; y += 5.5) {
    for (let x = 3; x <= 97; x += 4.5) {
      const drop = document.createElement("span");
      drop.className = "drop";
      drop.style.left = `${x}%`;
      drop.style.top = `${y}%`;
      mazeBoard.append(drop);

      if (overlapsWall(drop, -1)) drop.remove();
    }
  }

  ["hazard-insect", "hazard-polluted", "hazard-algae"].forEach((hazardType) => {
    const hazardsOfType = mazeBoard.querySelectorAll(`.${hazardType}`);
    hazardsOfType.forEach((hazard, index) => {
      if (index >= 2) hazard.remove();
    });
  });
}

const allDrops = mazeBoard.querySelectorAll(".drop");
const hazards = mazeBoard.querySelectorAll(".hazard");

const placedHazards = [];
const mazeBounds = mazeBoard.getBoundingClientRect();
const mazeWidth = mazeBoard.clientWidth;
const mazeHeight = mazeBoard.clientHeight;

hazards.forEach((hazard) => {
  const originalLeft = Math.round(hazard.offsetLeft / mazeWidth * 100);
  const originalTop = Math.round(hazard.offsetTop / mazeHeight * 100);
  let bestPosition = null;

  for (let radius = 0; radius <= 94 && !bestPosition; radius += 1) {
    for (let x = Math.max(2, originalLeft - radius); x <= Math.min(96, originalLeft + radius); x += 1) {
      for (let y = Math.max(2, originalTop - radius); y <= Math.min(96, originalTop + radius); y += 1) {
        if (Math.max(Math.abs(x - originalLeft), Math.abs(y - originalTop)) !== radius) continue;

        hazard.style.left = `${x}%`;
        hazard.style.top = `${y}%`;
        const bounds = hazard.getBoundingClientRect();
        const outsideMaze =
          bounds.left < mazeBounds.left + 5 ||
          bounds.right > mazeBounds.right - 5 ||
          bounds.top < mazeBounds.top + 5 ||
          bounds.bottom > mazeBounds.bottom - 5;
        const overlapsHazard = placedHazards.some((placedHazard) => {
          const placedBounds = placedHazard.getBoundingClientRect();
          return (
            bounds.left < placedBounds.right + 2 &&
            bounds.right > placedBounds.left - 2 &&
            bounds.top < placedBounds.bottom + 2 &&
            bounds.bottom > placedBounds.top - 2
          );
        });

        if (!outsideMaze && !overlapsWall(hazard) && !overlapsHazard) {
          bestPosition = [x, y];
          break;
        }
      }

      if (bestPosition) break;
    }
  }

  if (bestPosition) {
    hazard.style.left = `${bestPosition[0]}%`;
    hazard.style.top = `${bestPosition[1]}%`;
    placedHazards.push(hazard);
  } else {
    hazard.style.left = "";
    hazard.style.top = "";
  }
});

const startingHazardPositions = new Map(
  Array.from(hazards, (hazard) => [hazard, { left: hazard.style.left, top: hazard.style.top }]),
);
const hazardMovement = new Map(
  Array.from(hazards, (hazard) => [hazard, { x: 0, y: 0, nextTurn: 0 }]),
);

let score = 0;
let lives = startingLives;
let dropsRemaining = allDrops.length;
let playerX = startingPlayerX;
let playerY = startingPlayerY;
let isGameRunning = false;
let isPaused = false;
let hazardMovementInterval = null;
let playerMovementInterval = null;
let playerDirection = null;
let hazardCollisionCooldown = 0;

// Show the current score, lives, and drops left on the page.
function updateGameDisplay() {
  scoreDisplay.textContent = score.toLocaleString();
  livesDisplay.textContent = "■ ".repeat(lives).trim();
  livesDisplay.setAttribute("aria-label", `${lives} ${lives === 1 ? "life" : "lives"}`);
  dropsDisplay.textContent = dropsRemaining;
}

// Keep the on-screen controls in sync with the current game state.
function updateControlButtons() {
  directionButtons.forEach((button) => {
    button.disabled = !isGameRunning || isPaused;
  });
  pauseButton.disabled = !isGameRunning;
  pauseButton.textContent = isPaused ? "Resume" : "Pause";
  resumeButton.hidden = !isPaused;
}

// Return the game to its initial state without starting the hazards.
function resetGame() {
  clearInterval(hazardMovementInterval);
  hazardMovementInterval = null;
  stopPlayerMovement();
  score = 0;
  lives = startingLives;
  dropsRemaining = allDrops.length;
  playerX = startingPlayerX;
  playerY = startingPlayerY;
  hazardCollisionCooldown = 0;
  isGameRunning = false;
  isPaused = false;

  allDrops.forEach((drop) => {
    drop.hidden = false;
  });

  hazards.forEach((hazard) => {
    const position = startingHazardPositions.get(hazard);
    hazard.style.left = position.left;
    hazard.style.top = position.top;
    const movement = hazardMovement.get(hazard);
    movement.x = 0;
    movement.y = 0;
    movement.nextTurn = 0;
  });

  player.style.left = `${playerX}%`;
  player.style.top = `${playerY}%`;
  gameMessage.hidden = true;
  restartButton.hidden = true;
  gameButton.disabled = false;
  statusLabel.textContent = "START GAME";
  updateControlButtons();
  updateGameDisplay();
}

// Start a new game after restoring the initial state.
function startGame() {
  resetGame();
  isGameRunning = true;
  restartButton.hidden = false;
  gameButton.disabled = true;
  statusLabel.textContent = "GAME IN PROGRESS";
  hazardMovementInterval = setInterval(moveHazards, 30);
  updateControlButtons();
}

// Stop the game and show why the round ended.
function endGame(won) {
  clearInterval(hazardMovementInterval);
  stopPlayerMovement();
  isGameRunning = false;
  isPaused = false;
  if (won) {
    winSound.currentTime = 0;
    winSound.play().catch((error) => {
      console.error("Could not play the win sound:", error);
    });
  }
  gameButton.disabled = false;
  statusLabel.textContent = "PLAY AGAIN?";
  messageTitle.textContent = won ? "You did It!" : "Game Over!";
  messageText.textContent = won
    ? "You collected enough safe water!"
    : "You ran out of lives!";
  restartButton.hidden = false;
  gameMessage.hidden = false;
  updateControlButtons();
}

// Show or hide the pause message and pause both keyboard and touchscreen play.
function setPaused(paused) {
  if (paused) stopPlayerMovement();

  isPaused = paused;
  statusLabel.textContent = isPaused ? "GAME PAUSED" : "GAME IN PROGRESS";

  if (isPaused) {
    messageTitle.textContent = "Paused";
    messageText.textContent = window.matchMedia("(max-width: 540px)").matches
      ? "Tap Resume to continue."
      : "Press SPACE to resume.";
    restartButton.hidden = true;
    gameMessage.hidden = false;
  } else {
    gameMessage.hidden = true;
  }

  updateControlButtons();
}

// Move the player one step in the current direction.
function movePlayer(direction) {
  if (!isGameRunning || isPaused) return;

  const movement = 0.75;
  const directions = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  };
  const [moveX, moveY] = directions[direction];
  const minPlayerX = (playerBorderClearance / mazeBoard.clientWidth) * 100;
  const minPlayerY = (playerBorderClearance / mazeBoard.clientHeight) * 100;
  const maxPlayerX =
    100 - ((player.offsetWidth + playerBorderClearance) / mazeBoard.clientWidth) * 100;
  const maxPlayerY =
    100 - ((player.offsetHeight + playerBorderClearance) / mazeBoard.clientHeight) * 100;

  for (let step = 0; step < movement; step += 0.25) {
    const nextPlayerX = Math.max(minPlayerX, Math.min(maxPlayerX, playerX + moveX * 0.25));
    const nextPlayerY = Math.max(minPlayerY, Math.min(maxPlayerY, playerY + moveY * 0.25));

    if (nextPlayerX === playerX && nextPlayerY === playerY) {
      stopPlayerMovement();
      break;
    }

    player.style.left = `${nextPlayerX}%`;
    player.style.top = `${nextPlayerY}%`;

    if (isOutsideMazeBorder(player) || overlapsWall(player)) {
      player.style.left = `${playerX}%`;
      player.style.top = `${playerY}%`;
      stopPlayerMovement();
      break;
    }

    playerX = nextPlayerX;
    playerY = nextPlayerY;
  }

  checkForCollisions();
}

// Set a direction and continue moving until blocked or redirected.
function startPlayerMovement(direction) {
  if (!isGameRunning || isPaused) return;

  playerDirection = direction;
  if (playerMovementInterval) return;

  movePlayer(direction);
  if (!playerDirection) return;

  playerMovementInterval = setInterval(() => {
    if (playerDirection) movePlayer(playerDirection);
  }, 150);
}

// Stop movement when the game pauses, resets, or loses focus.
function stopPlayerMovement() {
  clearInterval(playerMovementInterval);
  playerMovementInterval = null;
  playerDirection = null;
}

// Move hazards along random straight segments and choose a new path every so often.
function moveHazards() {
  if (!isGameRunning || isPaused) return;

  const now = performance.now();

  hazards.forEach((hazard) => {
    const movement = hazardMovement.get(hazard);

    if (now >= movement.nextTurn) {
      chooseRandomHazardDirection(hazard, movement, now);
    }

    moveHazard(hazard, movement, now);
  });

  checkForCollisions();
}

// Choose a random straight path and keep it for a short random interval.
function chooseRandomHazardDirection(hazard, movement, now) {
  const startLeft = parseFloat(getComputedStyle(hazard).left);
  const startTop = parseFloat(getComputedStyle(hazard).top);
  const maxLeft = mazeBoard.clientWidth - hazard.offsetWidth;
  const maxTop = mazeBoard.clientHeight - hazard.offsetHeight;
  const possibleDirections = [];
  const directionCount = 36;
  const randomOffset = Math.random() * Math.PI * 2;

  for (let attempt = 0; attempt < directionCount; attempt += 1) {
    const direction = randomOffset + (attempt / directionCount) * Math.PI * 2;
    const nextLeft = startLeft + Math.cos(direction);
    const nextTop = startTop + Math.sin(direction);

    if (nextLeft < 0 || nextTop < 0 || nextLeft > maxLeft || nextTop > maxTop) continue;

    hazard.style.left = `${nextLeft}px`;
    hazard.style.top = `${nextTop}px`;
    const pathIsBlocked = overlapsWall(hazard);
    hazard.style.left = `${startLeft}px`;
    hazard.style.top = `${startTop}px`;

    if (pathIsBlocked) continue;

    possibleDirections.push(direction);
  }

  if (possibleDirections.length > 0) {
    const direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
    movement.x = Math.cos(direction);
    movement.y = Math.sin(direction);
    movement.nextTurn = now + 700 + Math.random() * 900;
    return;
  }

  movement.x = 0;
  movement.y = 0;
  movement.nextTurn = now + 100;
}

// Move in small increments so fast diagonal movement cannot skip through walls.
function moveHazard(hazard, movement, now) {
  const startLeft = parseFloat(getComputedStyle(hazard).left);
  const startTop = parseFloat(getComputedStyle(hazard).top);
  const maxLeft = mazeBoard.clientWidth - hazard.offsetWidth;
  const maxTop = mazeBoard.clientHeight - hazard.offsetHeight;
  const distanceX = movement.x * 0.75;
  const distanceY = movement.y * 0.75;
  const steps = Math.ceil(Math.max(Math.abs(distanceX), Math.abs(distanceY)) / 0.25);

  for (let step = 1; step <= steps; step += 1) {
    const nextLeft = startLeft + (distanceX * step) / steps;
    const nextTop = startTop + (distanceY * step) / steps;

    if (nextLeft < 0 || nextTop < 0 || nextLeft > maxLeft || nextTop > maxTop) {
      chooseRandomHazardDirection(hazard, movement, now);
      return;
    }

    hazard.style.left = `${nextLeft}px`;
    hazard.style.top = `${nextTop}px`;

    if (overlapsWall(hazard)) {
      hazard.style.left = `${startLeft}px`;
      hazard.style.top = `${startTop}px`;
      chooseRandomHazardDirection(hazard, movement, now);
      return;
    }
  }
}

// Check whether an element overlaps any maze wall.
function overlapsWall(element, inset = 0) {
  const elementBounds = element.getBoundingClientRect();
  const collisionBounds = {
    left: elementBounds.left + inset,
    right: elementBounds.right - inset,
    top: elementBounds.top + inset,
    bottom: elementBounds.bottom - inset,
  };

  return Array.from(walls).some((wall) => {
    const wallBounds = wall.getBoundingClientRect();
    const wallX = parseFloat(wall.style.getPropertyValue("--x"));
    const wallY = parseFloat(wall.style.getPropertyValue("--y"));
    const wallWidth = parseFloat(wall.style.getPropertyValue("--w"));
    const wallHeight = parseFloat(wall.style.getPropertyValue("--h"));
    const isHorizontalWall = wallWidth >= wallHeight;
    const isOutermostWall = isHorizontalWall
      ? wallY <= 8 || wallY + wallHeight >= 92
      : wallX <= 8 || wallX + wallWidth >= 92;
    const edgeInset = element === player && isOutermostWall && isHorizontalWall ? 0.95 : 0;
    const wallCollisionBounds = {
      left: wallBounds.left + wallBounds.width * edgeInset,
      right: wallBounds.right - wallBounds.width * edgeInset,
      top: wallBounds.top + wallBounds.height * edgeInset,
      bottom: wallBounds.bottom - wallBounds.height * edgeInset,
    };

    return (
      collisionBounds.left < wallCollisionBounds.right &&
      collisionBounds.right > wallCollisionBounds.left &&
      collisionBounds.top < wallCollisionBounds.bottom &&
      collisionBounds.bottom > wallCollisionBounds.top
    );
  });
}

// Keep the player inside the solid frame around the maze board.
function isOutsideMazeBorder(element) {
  const bounds = element.getBoundingClientRect();
  const mazeBounds = mazeBoard.getBoundingClientRect();
  const leftBorder = mazeBoard.clientLeft;
  const topBorder = mazeBoard.clientTop;
  const rightBorder = mazeBoard.offsetWidth - mazeBoard.clientWidth - leftBorder;
  const bottomBorder = mazeBoard.offsetHeight - mazeBoard.clientHeight - topBorder;

  return (
    bounds.left < mazeBounds.left + leftBorder ||
    bounds.right > mazeBounds.right - rightBorder ||
    bounds.top < mazeBounds.top + topBorder ||
    bounds.bottom > mazeBounds.bottom - bottomBorder
  );
}

// Check whether the player is touching a drop or a hazard.
function checkForCollisions() {
  const playerBounds = player.getBoundingClientRect();

  allDrops.forEach((drop) => {
    if (drop.hidden) return;

    const dropBounds = drop.getBoundingClientRect();
    const touchedDrop =
      playerBounds.left < dropBounds.right &&
      playerBounds.right > dropBounds.left &&
      playerBounds.top < dropBounds.bottom &&
      playerBounds.bottom > dropBounds.top;

    if (touchedDrop) {
      drop.hidden = true;
      score += 100;
      dropsRemaining -= 1;
    }
  });

  if (dropsRemaining === 0) {
    updateGameDisplay();
    endGame(true);
    return;
  }

  const touchedHazard = performance.now() >= hazardCollisionCooldown &&
    Array.from(hazards).some((hazard) => {
      const hazardBounds = hazard.getBoundingClientRect();
      return (
        playerBounds.left < hazardBounds.right &&
        playerBounds.right > hazardBounds.left &&
        playerBounds.top < hazardBounds.bottom &&
        playerBounds.bottom > hazardBounds.top
      );
    });

  if (touchedHazard) {
    lives -= 1;
    hazardCollisionCooldown = performance.now() + 1000;
    playerX = startingPlayerX;
    playerY = startingPlayerY;
    player.style.left = `${playerX}%`;
    player.style.top = `${playerY}%`;
  }

  updateGameDisplay();

  if (lives === 0) {
    endGame(false);
  }
}

gameButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetGame);
pauseButton.addEventListener("click", () => {
  if (isGameRunning) setPaused(!isPaused);
});
resumeButton.addEventListener("click", () => setPaused(false));
directionButtons.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    startPlayerMovement(button.dataset.direction);
  });
  button.addEventListener("click", (event) => {
    if (event.detail === 0) startPlayerMovement(button.dataset.direction);
  });
});
window.addEventListener("blur", stopPlayerMovement);

// Support keyboard movement and pause controls.
document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && isGameRunning) {
    event.preventDefault();
    setPaused(!isPaused);
    return;
  }

  if (!isGameRunning || isPaused) return;

  const directions = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };
  const direction = directions[event.key];

  if (!direction) return;

  event.preventDefault();
  if (!event.repeat) startPlayerMovement(direction);
});

updateGameDisplay();
updateControlButtons();
