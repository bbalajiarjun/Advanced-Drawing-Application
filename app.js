let canvas;
let context;
let savedImageData;
let painting = false;
let strokeColor = "black";
let fillColor = "black";
let line_Width = 2;
let polygonSides = 6;
let currentTool = "brush";
let canvasHeight = 600;
let canvasWidth = 600;

let usingBrush = false;
let brushXPoints = new Array();
let brushYPoints = new Array();
let brushDownPos = new Array();

class ShapeBoundingBox {
  consturctor(left, top, width, height) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
  }
}

class MouseDownPos {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Location {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class PolygonPoint {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

let shapeBoundingBox = new ShapeBoundingBox(0, 0, 0, 0);
let mousedown = new MouseDownPos(0, 0);
let loc = new Location(0, 0);

document.addEventListener("DOMContentLoaded", setupCanvas);

function setupCanvas() {
  canvas = document.getElementById("canvas");
  context = canvas.getContext("2d");
  context.strokeStyle = strokeColor;
  context.lineWidth = line_Width;
  canvas.addEventListener("mousedown", ReactToMouseDown);
  canvas.addEventListener("mousemove", ReactToMouseMove);
  canvas.addEventListener("mouseup", ReactToMouseUp);
}

function ChangeTool(toolClicked) {
  document.getElementById("open").className = "";
  document.getElementById("save").className = "";
  document.getElementById("brush").className = "";
  document.getElementById("line").className = "";
  document.getElementById("rectangle").className = "";
  document.getElementById("circle").className = "";
  document.getElementById("ellipse").className = "";
  document.getElementById("polygon").className = "";
  document.getElementById(toolClicked).classname = "selected";
  currentTool = toolClicked;
}

// Get Mouse Position
function GetMousePosition(x, y) {
  let canvasSizeData = canvas.getBoundingClientRect();
  return {
    x: (x - canvasSizeData.left) * (canvas.width / canvasSizeData.width),
    y: (y - canvasSizeData.top) * (canvas.height / canvasSizeData.height),
  };
}

// Save Canvas Image
function SaveCanvasImage() {
  savedImageData = context.getImageData(0, 0, canvas.width, canvas.height);
}

// Redraw Canvas Image
function RedrawCanvasImage() {
  context.putImageData(savedImageData, 0, 0);
}

// Update Rubber Band Size Data
function UpdateRubberbandSizeData(loc) {
  shapeBoundingBox.width = Math.abs(loc.x - mousedown.x);
  shapeBoundingBox.height = Math.abs(loc.y - mousedown.y);

  if (loc.x > mousedown.x) {
    shapeBoundingBox.left = mousedown.x;
  } else {
    shapeBoundingBox.left = loc.x;
  }

  if (loc.y > mousedown.y) {
    shapeBoundingBox.top = mousedown.y;
  } else {
    shapeBoundingBox.top = loc.y;
  }
}

// Get Angle Using X & Y
// x = Adjacent
// y = Opposite
// Tan(angle) = Opposite / Adjacent
// Angle = Arctan(Opposite / Adjacent)
function getAngleUsingXAndY(mouselocX, mouselocY) {
  let adjacent = mousedown.x - mouselocX;
  let opposite = mousedown.y - mouselocY;
  return radiansToDegrees(Math.atan2(opposite, adjacent));
}

// Radians to Degrees
function radiansToDegrees(rad) {
  if (rad < 0) {
    return (360.0 + rad * (180 / Math.PI)).toFixed(2);
  } else {
    return (rad * (180 / Math.PI)).toFixed(2);
  }
}

// Degrees to Radians
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function getPolygonPoints() {
  let angle = degreesToRadians(getAngleUsingXAndY(loc.x, loc.y));
  let radiusX = shapeBoundingBox.width;
  let radiusY = shapeBoundingBox.height;
  let polygonPoints = [];

  for (let i = 0; i < polygonSides; i++) {
    polygonPoints.push(
      new PolygonPoint(
        loc.x + radiusX * Math.sin(angle),
        loc.y - radiusY * Math.cos(angle)
      )
    );

    angle += (2 * Math.PI) / polygonSides;
  }
  return polygonPoints;
}

function getPolygon() {
  let polygonPoints = getPolygonPoints();
  context.beginPath();
  context.moveTo(polygonPoints[0].x, polygonPoints[0].y);
  for (let i = 1; i < polygonSides; i++) {
    context.lineTo(polygonPoints[i].x, polygonPoints[i].y);
  }
  context.closePath();
}

// Draw Rubber Band Shape
function drawRubberbandShape(loc) {
  context.strokeStyle = strokeColor;
  context.fillStyle = fillColor;
  switch (currentTool) {
    case "brush":
      DrawBrush();
      break;
    case "line":
      context.beginPath();
      context.moveTo(mousedown.x, mousedown.y);
      context.lineTo(loc.x, loc.y);
      context.stroke();
      break;
    case "rectangle":
      context.strokeRect(
        shapeBoundingBox.left,
        shapeBoundingBox.top,
        shapeBoundingBox.width,
        shapeBoundingBox.height
      );
      break;
    case "circle":
      let radius = shapeBoundingBox.width;
      context.beginPath();
      context.arc(mousedown.x, mousedown.y, radius, 0, Math.PI * 2);
      context.stroke();
      break;
    case "ellipse":
      let radiusX = shapeBoundingBox.width / 2;
      let radiusY = shapeBoundingBox.height / 2;
      context.beginPath();
      context.ellipse(
        mousedown.x,
        mousedown.y,
        radiusX,
        radiusY,
        Math.PI / 4,
        0,
        Math.PI * 2
      );
      context.stroke();
      break;
    case "polygon":
      getPolygon();
      context.stroke();
      break;
  }
}

// Update Rubber Band on Movement
function UpdateRubberbandOnMove(loc) {
  UpdateRubberbandSizeData(loc);
  drawRubberbandShape(loc);
}

function AddBrushPoints(x, y, mouseDown) {
  brushXPoints.push(x);
  brushYPoints.push(y);
  brushDownPos.push(mouseDown);
}

function DrawBrush() {
  for (let i = 1; i < brushXPoints.length; i++) {
    context.beginPath();
    if (brushDownPos[i]) {
      context.moveTo(brushXPoints[i - 1], brushYPoints[i - 1]);
    } else {
      context.moveTo(brushXPoints[i] - 1, brushYPoints[i]);
    }
    context.lineTo(brushXPoints[i], brushYPoints[i]);
    context.closePath();
    context.stroke();
  }
}

// ReactToMouseDown
function ReactToMouseDown(e) {
  canvas.style.cursor = "crosshair";
  loc = GetMousePosition(e.clientX, e.clientY);
  SaveCanvasImage();
  mousedown.x = loc.x;
  mousedown.y = loc.y;
  painting = true;

  if (currentTool === "brush") {
    usingBrush = true;
    AddBrushPoints(loc.x, loc.y);
  }
}

//ReactToMouseMove
function ReactToMouseMove(e) {
  canvas.style.cursor = "crosshair";
  loc = GetMousePosition(e.clientX, e.clientY);
  if (currentTool === "brush" && painting && usingBrush) {
    if (loc.x > 0 && loc.x < canvasWidth && loc.y > 0 && loc.y < canvasHeight) {
      AddBrushPoints(loc.x, loc.y, true);
    }
    RedrawCanvasImage();
    DrawBrush();
  } else {
    if (painting) {
      RedrawCanvasImage();
      UpdateRubberbandOnMove(loc);
    }
  }
  // TODO HANDLE BRUSH
}

//ReactToMouseUp
function ReactToMouseUp(e) {
  canvas.style.cursor = "default";
  loc = GetMousePosition(e.clientX, e.clientY);
  RedrawCanvasImage();
  UpdateRubberbandOnMove(loc);
  painting = false;
  usingBrush = false;
  // TODO HANDLE BRUSH
}

// SaveImage
function SaveImage() {
  var imageFile = document.getElementById("img-file");
  imageFile.setAttribute("download", "image.png");
  imageFile.setAttribute("href", canvas.toDataURL());
}

// OpenImage
function OpenImage() {
  let img = new Image();
  img.onload = function () {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0);
  };
  img.src = "image.png";
}
