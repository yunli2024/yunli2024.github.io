(function () {
  "use strict";

  const examples = {
    "street-chair": {
      input: "assets/street-chair-input.png",
      rollout: "assets/street-chair-rollout.mp4",
      result: "assets/street-chair-result.png"
    },
    teaware: {
      input: "assets/teaware-input.png",
      rollout: "assets/teaware-rollout.mp4",
      result: "assets/teaware-result.png"
    },
    mascot: {
      input: "assets/mascot-input.png",
      rollout: "assets/mascot-rollout.mp4",
      result: "assets/mascot-result.png"
    }
  };

  const inputSurface = document.getElementById("inputSurface");
  const inputImage = document.getElementById("inputImage");
  const canvas = document.getElementById("scribbleCanvas");
  const context = canvas.getContext("2d", { alpha: true });
  const fileInput = document.getElementById("fileInput");
  const undoButton = document.getElementById("undoButton");
  const clearButton = document.getElementById("clearButton");
  const brushControl = document.getElementById("brushControl");
  const brushDecrease = document.getElementById("brushDecrease");
  const brushIncrease = document.getElementById("brushIncrease");
  const brushDot = document.querySelector(".brush-dot");
  const runButton = document.getElementById("runButton");
  const runLabel = runButton.querySelector(".run-label");
  const outputSurface = document.getElementById("outputSurface");
  const outputPlaceholder = document.getElementById("outputPlaceholder");
  const processingMark = document.getElementById("processingMark");
  const outputVideo = document.getElementById("outputVideo");
  const resultImage = document.getElementById("resultImage");
  const cacheMessage = document.getElementById("cacheMessage");
  const replayButton = document.getElementById("replayButton");
  const exampleButtons = Array.from(document.querySelectorAll(".example-button"));

  let currentExample = "teaware";
  let uploadedImageUrl = null;
  let strokes = [];
  let activeStroke = null;
  let drawing = false;
  let outputTimer = null;
  const brushSizes = [12, 20, 30];
  let brushIndex = 1;

  function updateBrushControl() {
    const currentSize = brushSizes[brushIndex];
    const previewScales = [0.72, 1, 1.42];
    brushDot.style.setProperty("--brush-scale", previewScales[brushIndex]);
    brushControl.dataset.size = String(currentSize);
    brushControl.setAttribute("aria-label", `Brush size ${currentSize} pixels`);
    brushDecrease.disabled = brushIndex === 0;
    brushIncrease.disabled = brushIndex === brushSizes.length - 1;
  }

  function changeBrushSize(direction) {
    brushIndex = Math.max(0, Math.min(brushSizes.length - 1, brushIndex + direction));
    updateBrushControl();
  }

  function canvasPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height
    };
  }

  function isInsideImage(point) {
    return point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    redrawStrokes();
  }

  function drawStroke(stroke) {
    if (!stroke || stroke.points.length === 0) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    context.beginPath();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "rgba(255, 63, 85, 0.90)";
    context.lineWidth = stroke.width;

    const first = stroke.points[0];
    context.moveTo(first.x * width, first.y * height);

    if (stroke.points.length === 1) {
      context.lineTo(first.x * width + 0.01, first.y * height + 0.01);
    } else {
      for (let index = 1; index < stroke.points.length; index += 1) {
        const point = stroke.points[index];
        context.lineTo(point.x * width, point.y * height);
      }
    }

    context.stroke();
  }

  function redrawStrokes() {
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    strokes.forEach(drawStroke);
    if (activeStroke) drawStroke(activeStroke);
  }

  function updateScribbleControls() {
    const hasStrokes = strokes.length > 0 || Boolean(activeStroke);
    undoButton.disabled = !hasStrokes;
    clearButton.disabled = !hasStrokes;
  }

  function clearStrokes() {
    drawing = false;
    activeStroke = null;
    strokes = [];
    redrawStrokes();
    updateScribbleControls();
  }

  function beginStroke(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const point = canvasPoint(event);
    if (!isInsideImage(point)) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    drawing = true;
    activeStroke = {
      width: brushSizes[brushIndex],
      points: [point]
    };
    updateScribbleControls();
    redrawStrokes();
  }

  function continueStroke(event) {
    if (!drawing || !activeStroke) return;
    const point = canvasPoint(event);
    if (!isInsideImage(point)) return;

    event.preventDefault();
    const previous = activeStroke.points[activeStroke.points.length - 1];
    const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
    if (distance < 0.0025) return;
    activeStroke.points.push(point);
    redrawStrokes();
  }

  function endStroke(event) {
    if (!drawing || !activeStroke) return;
    event.preventDefault();
    drawing = false;
    strokes.push(activeStroke);
    activeStroke = null;
    updateScribbleControls();
    redrawStrokes();
  }

  function resetOutput() {
    window.clearTimeout(outputTimer);
    outputTimer = null;
    outputVideo.pause();
    outputVideo.removeAttribute("src");
    outputVideo.load();
    outputVideo.hidden = true;
    resultImage.hidden = true;
    cacheMessage.hidden = true;
    processingMark.hidden = true;
    outputPlaceholder.hidden = false;
    replayButton.hidden = true;
    outputSurface.dataset.state = "empty";
    outputSurface.classList.remove("is-revealing");
  }

  function selectExample(key) {
    const example = examples[key];
    if (!example) return;

    currentExample = key;
    if (uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl);
      uploadedImageUrl = null;
    }
    inputImage.src = example.input;
    inputImage.alt = `${key.replace(/-/g, " ")} object-removal input`;
    clearStrokes();
    resetOutput();

    exampleButtons.forEach((button) => {
      const isActive = button.dataset.example === key;
      button.classList.toggle("is-active", isActive);
      if (isActive) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  }

  function showInputPrompt() {
    inputSurface.classList.remove("needs-input");
    void inputSurface.offsetWidth;
    inputSurface.classList.add("needs-input");
    runLabel.textContent = "Draw a scribble first";
    window.setTimeout(() => {
      runLabel.textContent = "Run RolloutRemover";
      inputSurface.classList.remove("needs-input");
    }, 1200);
  }

  function revealResult() {
    const example = examples[currentExample];
    if (!example) return;

    outputVideo.hidden = true;
    resultImage.src = example.result;
    resultImage.hidden = false;
    processingMark.hidden = true;
    outputPlaceholder.hidden = true;
    outputSurface.dataset.state = "result";
    outputSurface.classList.add("is-revealing");
    replayButton.hidden = false;
  }

  function playRollout() {
    const example = examples[currentExample];
    if (!example) return;

    processingMark.hidden = true;
    outputPlaceholder.hidden = true;
    resultImage.hidden = true;
    cacheMessage.hidden = true;
    outputVideo.hidden = false;
    outputSurface.dataset.state = "playing";
    outputSurface.classList.add("is-revealing");
    replayButton.hidden = true;

    outputVideo.currentTime = 0;
    const playPromise = outputVideo.play();
    if (playPromise) playPromise.catch(revealResult);
  }

  function runDemo() {
    if (strokes.length === 0) {
      showInputPrompt();
      return;
    }

    resetOutput();
    runButton.disabled = true;
    runLabel.textContent = "Preparing rollout";
    outputPlaceholder.hidden = true;
    processingMark.hidden = false;
    outputSurface.dataset.state = "processing";

    outputTimer = window.setTimeout(() => {
      runButton.disabled = false;
      runLabel.textContent = "Run RolloutRemover";

      if (!currentExample) {
        processingMark.hidden = true;
        cacheMessage.hidden = false;
        outputSurface.dataset.state = "missing";
        return;
      }

      const example = examples[currentExample];
      outputVideo.src = example.rollout;
      outputVideo.load();
      playRollout();
    }, 620);
  }

  canvas.addEventListener("pointerdown", beginStroke);
  canvas.addEventListener("pointermove", continueStroke);
  canvas.addEventListener("pointerup", endStroke);
  canvas.addEventListener("pointercancel", endStroke);

  undoButton.addEventListener("click", () => {
    strokes.pop();
    redrawStrokes();
    updateScribbleControls();
  });

  clearButton.addEventListener("click", clearStrokes);

  brushDecrease.addEventListener("click", () => changeBrushSize(-1));
  brushIncrease.addEventListener("click", () => changeBrushSize(1));

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    uploadedImageUrl = URL.createObjectURL(file);
    currentExample = null;
    inputImage.src = uploadedImageUrl;
    inputImage.alt = "Uploaded object-removal input";
    clearStrokes();
    resetOutput();
    exampleButtons.forEach((button) => {
      button.classList.remove("is-active");
      button.removeAttribute("aria-current");
    });
    fileInput.value = "";
  });

  inputImage.addEventListener("load", resizeCanvas);
  runButton.addEventListener("click", runDemo);
  replayButton.addEventListener("click", playRollout);

  outputVideo.addEventListener("ended", revealResult);
  outputVideo.addEventListener("error", revealResult);

  exampleButtons.forEach((button) => {
    button.addEventListener("click", () => selectExample(button.dataset.example));
  });

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(inputSurface);
  window.addEventListener("beforeunload", () => {
    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
  });

  updateBrushControl();
  resizeCanvas();
})();
