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
  nextLevel = 10;
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
var keyStates = {};
function handleKey(event, direction) {
  var key = String.fromCharCode(event.which);
  var lookingCell = manPosition.slice(0);
  switch (key) {
    case "W": lookingCell[1]--; break;
    case "A": lookingCell[0]--; break;
    case "S": lookingCell[1]++; break;
    case "D": lookingCell[0]++; break;
    default: return;
  }
  event.preventDefault();
  if (keyStates[key] === direction) return;
  keyStates[key] = direction;
  if (direction === "up") {
    if (pushingCell != null && pushingCell.toString() === lookingCell.toString()) {
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

  var gridSize = [
    canvas.height,
    canvas.height,
  ];
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
  for (cell[1] = renderStartCell[1]; cell[1] <= renderStopCell[1]; cell[1]++) {
    for (cell[0] = renderStartCell[0]; cell[0] <= renderStopCell[0]; cell[0]++) {
      var pixel = cellToPixel(cell);
      context.fillStyle = holes[cell] ? "#000" : getCellColor(cell);
      context.fillRect(pixel[0]+1, pixel[1]+1, cellSize-2, cellSize-2);
    }
  }

  context.fillStyle = "#fff";
  context.font = (cellSize-2) + "pt Calibri";
  var manPixel = cellToPixel(manPosition);
  context.fillText("\u263b", manPixel[0], manPixel[1] + cellSize);
}


document.onkeydown = keyDown;
function keyDown(event) {
  handleKey(event, "down");
}
document.onkeyup = keyUp;
function keyUp(event) {
  handleKey(event, "up");
}
