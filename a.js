var canvas = document.getElementById("game");
requestAnimationFrame(update);

var cellSize = 20;

var manPosition, holes, experience, experienceLevel, nextLevel;
reset();
function reset() {
  manPosition = [0,0];
  holes = {};
  holes[manPosition] = 1;
  experience = 0;
  experienceLevel = 1;
  nextLevel = 5;
}

function update() {
  physicsStep();
  render();
  requestAnimationFrame(update);
}
var lastPhysicsTime = new Date();
function physicsStep() {
  var now = new Date();
  var dt = now - lastPhysicsTime;
  lastPhysicsTime = now;

  if (pushingCell != null) {
    pushProgress += dt * experienceLevel / 1000;
    var cellStrength = getCellStrength(pushingCell);
    if (pushProgress >= getCellStrength(pushingCell)) {
      // broken
      holes[pushingCell] = 1;
      experience += cellStrength;
      manPosition = pushingCell;
      pushingCell = null;
      pushProgress = null;
      if (experience >= nextLevel) {
        // level up
        experience -= nextLevel;
        experienceLevel += 1;
        nextLevel *= 2;
      }
    }
  }
}
var pushingCell = null;
var pushProgress = null;
function cellIsPushingCell(cell) {
  return pushingCell != null && pushingCell.toString() === cell.toString();
}
var keyStates = {};
var UP = 38, LEFT = 37, DOWN = 40, RIGHT = 39;
function handleKey(event, direction) {
  var key = event.which;
  var lookingCell = manPosition.slice(0);
  switch (key) {
    case UP:    lookingCell[1]--; break;
    case LEFT:  lookingCell[0]--; break;
    case DOWN:  lookingCell[1]++; break;
    case RIGHT: lookingCell[0]++; break;
    default: return;
  }
  event.preventDefault();
  if (keyStates[key] === direction) return;
  keyStates[key] = direction;
  if (direction === "up") {
    if (cellIsPushingCell(lookingCell)) {
      // let go of that cell
      pushingCell = null;
      pushProgress = null;
    }
  } else {
    if (holes[lookingCell]) {
      // move
      manPosition = lookingCell;
    } else if (pushingCell === null) {
      // start pushing
      pushingCell = lookingCell;
      pushProgress = 0;
    }
  }
}

function getCellStrength(cell) {
  var distance = cell[0]*cell[0] + cell[1]*cell[1];
  return Math.min(4, distance.toString().length);
}
function getCellColor(cell) {
  var distance = cell[0]*cell[0] + cell[1]*cell[1];
  switch (distance.toString().length) {
    case 1: return "#fff";
    case 2: return "#aaa";
    case 3: return "#777";
    default: return "#333";
  }
}

function render() {
  var context = canvas.getContext("2d");
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);

  var statusLeft;

  (function drawGrid() {
    var gridSize = [
      canvas.height,
      canvas.height,
    ];
    statusLeft = gridSize[1];
    var screenOffset = gridSize.map(function(pixel) { return -pixel / 2; });
    var sizeInCells = gridSize.map(function(pixel) { return pixel / cellSize; });
    function cellToPixel(position) {
      return position.map(function(cell, i) {
        return (cell-manPosition[i]) * cellSize - screenOffset[i];
      });
    }
    function pixelToCell(position) {
      return position.map(function(pixel, i) {
        return Math.floor((pixel + screenOffset[i])/cellSize) + manPosition[i];
      });
    }

    var renderStartCell = pixelToCell([0,0]);
    var renderStopCell = pixelToCell(gridSize);

    var cell = [];
    for (cell[1] = renderStartCell[1]; cell[1] < renderStopCell[1]; cell[1]++) {
      for (cell[0] = renderStartCell[0]; cell[0] < renderStopCell[0]; cell[0]++) {
        var pixel = cellToPixel(cell);
        context.fillStyle = holes[cell] ? "#000" : getCellColor(cell);
        context.fillRect(pixel[0]+1, pixel[1]+1, cellSize-2, cellSize-2);

        if (cellIsPushingCell(cell)) {
          // draw a pie chart of progress
          var radius = cellSize / 3;
          var center = pixel.map(function(x) { return x + cellSize/2; });
          context.fillStyle = "#000";
          context.beginPath();
          context.moveTo(center[0], center[1]);
          var angle = pushProgress / getCellStrength(pushingCell) * 2 * Math.PI - Math.PI/2;
          context.arc(center[0], center[1], radius, -Math.PI/2, angle);
          context.lineTo(center[0], center[1]);
          context.fill();
        }
      }
    }

    context.fillStyle = "#fff";
    context.font = (cellSize-2) + "pt Calibri";
    var manPixel = cellToPixel(manPosition);
    context.fillText("\u263b", manPixel[0], manPixel[1] + cellSize);
  })();

  (function drawStatus() {
    var width = canvas.width - statusLeft;
    var fontSize = 15;
    var verticalCursor = 0;

    context.font = fontSize + "pt Calibri";
    verticalCursor += fontSize;
    context.fillText("Status", statusLeft, verticalCursor);

    verticalCursor += fontSize * 1.5;
    context.fillText("Level " + experienceLevel, statusLeft, verticalCursor);

    verticalCursor += fontSize * 2;
    context.fillText("Next Level:", statusLeft, verticalCursor);

    var experienceBarHeight = 10;
    verticalCursor += 0.5 * experienceBarHeight;
    context.fillRect(statusLeft, verticalCursor, width * experience / nextLevel, experienceBarHeight);
    verticalCursor += experienceBarHeight;
  })();
}


document.onkeydown = keyDown;
function keyDown(event) {
  handleKey(event, "down");
}
document.onkeyup = keyUp;
function keyUp(event) {
  handleKey(event, "up");
}
