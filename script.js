const player = document.getElementById("player");
const gameButton = document.getElementById("game-button");
const statusLabel = document.querySelector(".status-label");
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const dropsDisplay = document.getElementById("drops-remaining");
const gameMessage = document.getElementById("game-message");
const setupContent = document.getElementById("setup-content");
const messageTitle = document.getElementById("message-title");
const messageText = document.getElementById("message-text");
const restartButton = document.getElementById("restart-button");
const setupStartButton = document.getElementById("setup-start-button");
const resumeButton = document.getElementById("resume-button");
const resetButton = document.getElementById("reset-button");
const pauseButton = document.getElementById("pause-button");
const winSound = document.getElementById("win-sound");
const collectSound = document.getElementById("collect-sound");
const mazeBoard = document.querySelector(".maze-inner");
const walls = document.querySelectorAll(".wall");
const difficultySelect = document.getElementById("difficulty-select");
const directionButtons = document.querySelectorAll(".key[data-direction]");
const isMobileDevice = window.matchMedia("(max-width: 540px)").matches;
const difficultySettings = {
  easy: {
    stepX: 6.1,
    stepY: 6.8,
    startX: 3.5,
    startY: 4,
    maxX: 96,
    maxY: 96,
    topRowY: 2.5,
    rightColumnX: 96.5,
    bottomRowY: 96,
    hazardClasses: [
      "hazard-insect-one",
      "hazard-insect-two",
      "hazard-polluted-one",
      "hazard-polluted-two",
      "hazard-algae-one",
    ],
  },
  normal: {
    stepX: 4.5,
    stepY: 5.5,
    startX: 3.5,
    startY: 4,
    maxX: 96,
    maxY: 96,
    topRowY: 2.5,
    rightColumnX: 96.5,
    bottomRowY: 96,
    hazardClasses: [
      "hazard-insect-one",
      "hazard-insect-two",
      "hazard-insect-three",
      "hazard-insect-four",
      "hazard-polluted-one",
      "hazard-polluted-two",
      "hazard-polluted-three",
      "hazard-polluted-four",
      "hazard-algae-one",
      "hazard-algae-two",
      "hazard-algae-three",
    ],
  },
  hard: {
    stepX: 3.8,
    stepY: 4.8,
    startX: 3.5,
    startY: 4,
    maxX: 96,
    maxY: 96,
    topRowY: 2.5,
    rightColumnX: 96.5,
    bottomRowY: 96,
    hazardClasses: [
      "hazard-insect-one",
      "hazard-insect-two",
      "hazard-insect-three",
      "hazard-insect-four",
      "hazard-insect-five",
      "hazard-insect-six",
      "hazard-polluted-one",
      "hazard-polluted-two",
      "hazard-polluted-three",
      "hazard-polluted-four",
      "hazard-polluted-five",
      "hazard-polluted-six",
      "hazard-polluted-seven",
      "hazard-polluted-eight",
      "hazard-algae-one",
      "hazard-algae-two",
      "hazard-algae-three",
      "hazard-algae-four",
      "hazard-algae-five",
    ],
  },
};
let currentDifficulty = difficultySelect.value;
let hazards = Array.from(mazeBoard.querySelectorAll(".hazard"));
let allDrops = [];
const startingLives = 3;
const playerBorderClearance = 1;
const startingPlayerX = 46;
const startingPlayerY = Math.min(
  94,
  100 - ((player.offsetHeight + playerBorderClearance) / mazeBoard.clientHeight) * 100,
);

function setHazardsForDifficulty() {
  const selectedDifficulty = difficultySettings[currentDifficulty];

  hazards.forEach((hazard) => {
    hazard.hidden = true;
  });

  selectedDifficulty.hazardClasses.forEach((hazardClassName) => {
    const hazard = mazeBoard.querySelector(`.${hazardClassName}`);
    if (hazard) {
      hazard.hidden = false;
    }
  });

  hazards = Array.from(mazeBoard.querySelectorAll(".hazard")).filter((hazard) => !hazard.hidden);
}

function buildDropLayout() {
  const settings = difficultySettings[currentDifficulty];

  Array.from(mazeBoard.querySelectorAll(".drop")).forEach((drop) => drop.remove());

  for (let y = settings.startY; y <= settings.maxY; y += settings.stepY) {
    if (Math.abs(y - settings.bottomRowY) < 2) continue;

    for (let x = settings.startX; x <= settings.maxX; x += settings.stepX) {
      if (isDropPositionOpen(x, y)) {
        const drop = document.createElement("span");
        drop.className = "drop";
        drop.style.left = `${x}%`;
        drop.style.top = `${y}%`;
        mazeBoard.append(drop);
      }
    }
  }

  for (let x = settings.startX; x <= settings.maxX; x += settings.stepX) {
    if (isDropPositionOpen(x, settings.topRowY)) {
      const drop = document.createElement("span");
      drop.className = "drop";
      drop.style.left = `${x}%`;
      drop.style.top = `${settings.topRowY}%`;
      mazeBoard.append(drop);
    }
  }

  for (let y = settings.startY; y <= settings.maxY; y += settings.stepY) {
    if (isDropPositionOpen(settings.rightColumnX, y)) {
      const drop = document.createElement("span");
      drop.className = "drop";
      drop.style.left = `${settings.rightColumnX}%`;
      drop.style.top = `${y}%`;
      mazeBoard.append(drop);
    }
  }

  for (let x = settings.startX; x <= settings.maxX; x += settings.stepX) {
    if (isDropPositionOpen(x, settings.bottomRowY)) {
      const drop = document.createElement("span");
      drop.className = "drop";
      drop.style.left = `${x}%`;
      drop.style.top = `${settings.bottomRowY}%`;
      mazeBoard.append(drop);
    }
  }

  const manualDropAdditions = [
    [8.5, 18.0], [22.0, 18.0], [39.5, 20.5], [58.5, 20.5], [74.0, 20.5],
    [90.5, 20.5], [13.5, 57.5], [31.0, 57.5], [48.5, 57.5], [66.5, 57.5],
    [84.0, 57.5], [31.0, 75.0], [52.0, 75.0], [77.0, 75.0],
  ];

  manualDropAdditions.forEach(([x, y]) => {
    if (!isDropPositionOpen(x, y, 0)) return;

    const drop = document.createElement("span");
    drop.className = "drop";
    drop.style.left = `${x}%`;
    drop.style.top = `${y}%`;
    mazeBoard.append(drop);
  });

  function removeLowerOfTopOverlapPairs() {
    const topDrops = Array.from(mazeBoard.querySelectorAll(".drop"))
      .map((drop) => ({
        drop,
        left: parseFloat(drop.style.left),
        top: parseFloat(drop.style.top),
      }))
      .filter(({ top }) => top >= 1 && top <= 18);

    topDrops.sort((a, b) => a.left - b.left || a.top - b.top);

    for (let index = 1; index < topDrops.length; index += 1) {
      const previous = topDrops[index - 1];
      const current = topDrops[index];

      if (Math.abs(current.left - previous.left) < 1.2 && current.top - previous.top < 3) {
        const lowerDrop = current.top > previous.top ? current.drop : previous.drop;
        lowerDrop.remove();
      }
    }
  }

  removeLowerOfTopOverlapPairs();

  const cleanDrops = Array.from(mazeBoard.querySelectorAll(".drop"));
  if (isMobileDevice) {
    cleanDrops.forEach((drop) => drop.remove());

    for (let y = 3; y <= 97; y += settings.stepY) {
      for (let x = 3; x <= 97; x += settings.stepX) {
        if (!isDropPositionOpen(x, y, -1)) continue;

        const drop = document.createElement("span");
        drop.className = "drop";
        drop.style.left = `${x}%`;
        drop.style.top = `${y}%`;
        mazeBoard.append(drop);
      }
    }

    ["hazard-insect", "hazard-polluted", "hazard-algae"].forEach((hazardType) => {
      const hazardsOfType = mazeBoard.querySelectorAll(`.${hazardType}`);
      hazardsOfType.forEach((hazard, index) => {
        if (index >= 2) hazard.remove();
      });
    });
  }

  pruneUnsafeDrops();
  allDrops = mazeBoard.querySelectorAll(".drop");
}

function isDropPositionOpen(x, y, inset = -2) {
  const drop = document.createElement("span");
  drop.className = "drop";
  drop.style.left = `${x}%`;
  drop.style.top = `${y}%`;
  mazeBoard.append(drop);

  const inOpenSpace =
    !overlapsWall(drop, inset) &&
    !Array.from(hazards).some((hazard) => {
      const dropBounds = drop.getBoundingClientRect();
      const hazardBounds = hazard.getBoundingClientRect();
      return (
        dropBounds.left < hazardBounds.right + 1 &&
        dropBounds.right > hazardBounds.left - 1 &&
        dropBounds.top < hazardBounds.bottom + 1 &&
        dropBounds.bottom > hazardBounds.top - 1
      );
    }) &&
    (() => {
      const dropBounds = drop.getBoundingClientRect();
      const mazeBounds = mazeBoard.getBoundingClientRect();
      return (
        dropBounds.left > mazeBounds.left + 2 &&
        dropBounds.right < mazeBounds.right - 2 &&
        dropBounds.top > mazeBounds.top + 2 &&
        dropBounds.bottom < mazeBounds.bottom - 2
      );
    })();

  drop.remove();
  return inOpenSpace;
}

function pruneUnsafeDrops() {
  Array.from(mazeBoard.querySelectorAll(".drop")).forEach((drop) => {
    const dropBounds = drop.getBoundingClientRect();
    const mazeBounds = mazeBoard.getBoundingClientRect();
    const isInsideBoard =
      dropBounds.left > mazeBounds.left + 2 &&
      dropBounds.right < mazeBounds.right - 2 &&
      dropBounds.top > mazeBounds.top + 2 &&
      dropBounds.bottom < mazeBounds.bottom - 2;
    const overlapsHazard = Array.from(hazards).some((hazard) => {
      const hazardBounds = hazard.getBoundingClientRect();
      return (
        dropBounds.left < hazardBounds.right + 1 &&
        dropBounds.right > hazardBounds.left - 1 &&
        dropBounds.top < hazardBounds.bottom + 1 &&
        dropBounds.bottom > hazardBounds.top - 1
      );
    });

    if (!isInsideBoard || overlapsWall(drop, -2) || overlapsHazard) {
      drop.remove();
    }
  });
}

setHazardsForDifficulty();
buildDropLayout();

let placedHazards = [];
const mazeBounds = mazeBoard.getBoundingClientRect();
const mazeWidth = mazeBoard.clientWidth;
const mazeHeight = mazeBoard.clientHeight;
let startingHazardPositions = new Map();
let hazardMovement = new Map();

function refreshHazardTracking() {
  startingHazardPositions = new Map();
  hazardMovement = new Map();
  placedHazards = [];

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

    startingHazardPositions.set(hazard, { left: hazard.style.left, top: hazard.style.top });
    hazardMovement.set(hazard, { x: 0, y: 0, nextTurn: 0 });
  });
}

refreshHazardTracking();

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
let isMilestonePause = false;
const waterMilestones = [25, 50, 75];
const reachedWaterMilestones = new Set();

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
  resumeButton.hidden = !isPaused || isMilestonePause;
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
  isMilestonePause = false;
  reachedWaterMilestones.clear();
  setupContent.hidden = true;

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

difficultySelect.addEventListener("change", () => {
  currentDifficulty = difficultySelect.value;
  setHazardsForDifficulty();
  buildDropLayout();
  refreshHazardTracking();
  showSetupScreen();
  updateGameDisplay();
});

function showSetupScreen() {
  resetGame();
  setupContent.hidden = false;
  messageTitle.hidden = true;
  messageText.hidden = true;
  resumeButton.hidden = true;
  restartButton.hidden = true;
  gameMessage.hidden = false;
  gameButton.disabled = true;
  statusLabel.textContent = "START GAME";
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
  isMilestonePause = false;
  setupContent.hidden = true;
  if (won) {
    winSound.currentTime = 0;
    winSound.play().catch((error) => {
      console.error("Could not play the win sound:", error);
    });
  }
  gameButton.disabled = false;
  statusLabel.textContent = "PLAY AGAIN?";
  messageTitle.hidden = false;
  messageTitle.textContent = won ? "You did It!" : "Game Over!";
  messageText.hidden = false;
  messageText.textContent = won
    ? "You collected enough safe water!"
    : "You ran out of lives!";
  restartButton.hidden = false;
  gameMessage.hidden = false;
  updateControlButtons();
}

// Show or hide the pause message and pause both keyboard and touchscreen play.
function setPaused(paused) {
  if (isMilestonePause) return;
  if (paused) stopPlayerMovement();

  isPaused = paused;
  statusLabel.textContent = isPaused ? "GAME PAUSED" : "GAME IN PROGRESS";

  if (isPaused) {
    setupContent.hidden = true;
    messageTitle.textContent = "Paused";
    messageTitle.hidden = false;
    messageText.textContent = window.matchMedia("(max-width: 540px)").matches
      ? "Tap Resume to continue."
      : "Press SPACE to resume.";
    messageText.hidden = false;
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
  const mobileSpeedScale = isMobileDevice ? Math.min(mazeBoard.clientWidth / 860, 1) : 1;
  const distanceX = movement.x * 0.75 * mobileSpeedScale;
  const distanceY = movement.y * 0.75 * mobileSpeedScale;
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
  let reachedMilestone = null;

  for (const drop of allDrops) {
    if (drop.hidden) continue;

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
      collectSound.currentTime = 0;
      collectSound.play().catch((error) => {
        console.error("Could not play the collection sound:", error);
      });

      const collectedDrops = allDrops.length - dropsRemaining;
      const milestone = waterMilestones.find((percent) => {
        const milestoneDropCount = Math.ceil(allDrops.length * percent / 100);
        return collectedDrops >= milestoneDropCount && !reachedWaterMilestones.has(percent);
      });

      if (milestone !== undefined) {
        reachedMilestone = milestone;
        reachedWaterMilestones.add(milestone);
        break;
      }
    }
  }

  if (dropsRemaining === 0) {
    updateGameDisplay();
    endGame(true);
    return;
  }

  if (reachedMilestone !== null) {
    updateGameDisplay();
    showWaterMilestone(reachedMilestone);
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

function showWaterMilestone(percent) {
  const collectedDrops = allDrops.length - dropsRemaining;
  stopPlayerMovement();
  isPaused = true;
  isMilestonePause = true;
  setupContent.hidden = true;
  messageTitle.textContent = `${percent}% complete!`;
  messageTitle.hidden = false;
  messageText.textContent = window.matchMedia("(max-width: 540px)").matches
    ? `${collectedDrops} of ${allDrops.length} water droplets collected. Tap Resume to continue.`
    : `${collectedDrops} of ${allDrops.length} water droplets collected. Press SPACE to continue.`;
  messageText.hidden = false;
  resumeButton.hidden = true;
  restartButton.hidden = true;
  gameMessage.hidden = false;
  statusLabel.textContent = "MILESTONE REACHED";
  updateControlButtons();
}

function continueFromMilestone() {
  if (!isMilestonePause) return;

  isMilestonePause = false;
  isPaused = false;
  gameMessage.hidden = true;
  statusLabel.textContent = "GAME IN PROGRESS";
  updateControlButtons();
}

gameButton.addEventListener("click", showSetupScreen);
setupStartButton.addEventListener("click", startGame);
restartButton.addEventListener("click", () => {
  resetGame();
});
resetButton.addEventListener("click", resetGame);
pauseButton.addEventListener("click", () => {
  if (!isGameRunning) return;

  if (isMilestonePause) {
    continueFromMilestone();
  } else {
    setPaused(!isPaused);
  }
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
    if (isMilestonePause) {
      continueFromMilestone();
      return;
    }

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
resetGame();
