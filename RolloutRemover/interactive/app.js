(function () {
  "use strict";

  const examples = {
    "red-bucket": {
      input: "assets/red-bucket-input.png",
      rollout: "assets/red-bucket-rollout.mp4",
      result: "assets/red-bucket-result.png"
    },
    "green-object": {
      input: "assets/green-object-input.png",
      rollout: "assets/green-object-rollout.mp4",
      result: "assets/green-object-result.png"
    },
    "traffic-cone": {
      input: "assets/traffic-cone-input.png",
      rollout: "assets/traffic-cone-rollout.mp4",
      result: "assets/traffic-cone-result.png"
    },
    bonsai: {
      input: "assets/bonsai-input.png",
      rollout: "assets/bonsai-rollout.mp4",
      result: "assets/bonsai-result.png"
    },
    plate: {
      input: "assets/plate-input.png",
      rollout: "assets/plate-rollout.mp4",
      result: "assets/plate-result.png"
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
  const inferenceProgress = document.getElementById("inferenceProgress");
  const inferenceFill = document.getElementById("inferenceFill");
  const outputVideo = document.getElementById("outputVideo");
  const userMaskPreview = document.getElementById("userMaskPreview");
  const userMaskContext = userMaskPreview.getContext("2d", { alpha: false });
  const resultImage = document.getElementById("resultImage");
  const cacheMessage = document.getElementById("cacheMessage");
  const replayButton = document.getElementById("replayButton");
  const exampleButtons = Array.from(document.querySelectorAll(".example-button"));

  let currentExample = "red-bucket";
  let uploadedImageUrl = null;
  let strokes = [];
  let activeStroke = null;
  let drawing = false;
  let inferenceFrameRequest = null;
  let maskPreviewTimer = null;
  let maskPreviewResolve = null;
  let playbackGeneration = 0;
  const brushSizes = [12, 20, 30];
  const rolloutSourceFrameRate = 4;
  const rolloutSourceMaskFrameCount = 2;
  const rolloutPlaybackRate = 0.75;
  const rolloutReplacementStartTime = rolloutSourceMaskFrameCount / rolloutSourceFrameRate;
  const maskPreviewDurationMs = 1000 / (rolloutSourceFrameRate * rolloutPlaybackRate);
  const rolloutMaskSkipPlaybackRate = rolloutReplacementStartTime / (maskPreviewDurationMs / 1000);
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

  function drawStrokeOn(targetContext, targetCanvas, stroke, strokeStyle) {
    if (!stroke || stroke.points.length === 0) return;

    const width = targetCanvas.clientWidth;
    const height = targetCanvas.clientHeight;
    targetContext.beginPath();
    targetContext.lineCap = "round";
    targetContext.lineJoin = "round";
    targetContext.strokeStyle = strokeStyle;
    targetContext.lineWidth = stroke.width;

    const first = stroke.points[0];
    targetContext.moveTo(first.x * width, first.y * height);

    if (stroke.points.length === 1) {
      targetContext.lineTo(first.x * width + 0.01, first.y * height + 0.01);
    } else {
      for (let index = 1; index < stroke.points.length; index += 1) {
        const point = stroke.points[index];
        targetContext.lineTo(point.x * width, point.y * height);
      }
    }

    targetContext.stroke();
  }

  function redrawStrokes() {
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    strokes.forEach((stroke) => drawStrokeOn(context, canvas, stroke, "rgba(255, 63, 85, 0.90)"));
    if (activeStroke) drawStrokeOn(context, canvas, activeStroke, "rgba(255, 63, 85, 0.90)");
  }

  function redrawUserMaskPreview() {
    const bounds = userMaskPreview.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    userMaskPreview.width = Math.max(1, Math.round(bounds.width * ratio));
    userMaskPreview.height = Math.max(1, Math.round(bounds.height * ratio));
    userMaskContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    userMaskContext.fillStyle = "#000";
    userMaskContext.fillRect(0, 0, bounds.width, bounds.height);
    strokes.forEach((stroke) => drawStrokeOn(userMaskContext, userMaskPreview, stroke, "#fff"));
  }

  function stopMaskPreviewTimer() {
    if (maskPreviewTimer !== null) window.clearTimeout(maskPreviewTimer);
    maskPreviewTimer = null;
    if (maskPreviewResolve) maskPreviewResolve(false);
    maskPreviewResolve = null;
  }

  function hideUserMaskPreview() {
    stopMaskPreviewTimer();
    userMaskPreview.hidden = true;
  }

  function showUserMaskPreview() {
    stopMaskPreviewTimer();
    userMaskPreview.hidden = false;
    redrawUserMaskPreview();
  }

  function waitForMaskPreview(generation) {
    stopMaskPreviewTimer();
    return new Promise((resolve) => {
      maskPreviewResolve = resolve;
      maskPreviewTimer = window.setTimeout(() => {
        maskPreviewTimer = null;
        maskPreviewResolve = null;
        resolve(generation === playbackGeneration);
      }, maskPreviewDurationMs);
    });
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

  function invalidateOutput() {
    if (outputSurface.dataset.state !== "empty") resetOutput();
  }

  function beginStroke(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const point = canvasPoint(event);
    if (!isInsideImage(point)) return;

    event.preventDefault();
    invalidateOutput();
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

  function resetInferenceProgress() {
    if (inferenceFrameRequest !== null) window.cancelAnimationFrame(inferenceFrameRequest);
    inferenceFrameRequest = null;
    inferenceFill.style.transform = "scaleX(0)";
    inferenceProgress.setAttribute("aria-valuenow", "0");
    delete inferenceProgress.dataset.durationMs;
  }

  function waitForVideoReady(generation) {
    if (generation !== playbackGeneration) return Promise.resolve(false);
    if (outputVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return Promise.resolve(true);

    return new Promise((resolve) => {
      let settled = false;
      const timeout = window.setTimeout(() => finish(false), 5000);

      const cleanup = () => {
        window.clearTimeout(timeout);
        outputVideo.removeEventListener("canplay", onReady);
        outputVideo.removeEventListener("error", onUnavailable);
        outputVideo.removeEventListener("emptied", onUnavailable);
      };

      const finish = (ready) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(ready && generation === playbackGeneration);
      };

      const onReady = () => finish(true);
      const onUnavailable = () => finish(false);
      outputVideo.addEventListener("canplay", onReady);
      outputVideo.addEventListener("error", onUnavailable);
      outputVideo.addEventListener("emptied", onUnavailable);
    });
  }

  function waitForVideoTime(time, generation) {
    return new Promise((resolve) => {
      const deadline = performance.now() + 3000;
      const checkTime = (now) => {
        if (generation !== playbackGeneration) {
          resolve(false);
          return;
        }
        if (outputVideo.currentTime >= time) {
          resolve(true);
          return;
        }
        if (now >= deadline) {
          resolve(false);
          return;
        }
        window.requestAnimationFrame(checkTime);
      };
      window.requestAnimationFrame(checkTime);
    });
  }

  async function startVideoPlayback(generation) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (generation !== playbackGeneration) return false;
      try {
        await outputVideo.play();
        return true;
      } catch (error) {
        if (generation !== playbackGeneration) return false;
        if (attempt === 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 120));
          continue;
        }
      }
    }
    return false;
  }

  function finishInference() {
    inferenceFrameRequest = null;
    runButton.disabled = false;
    runLabel.textContent = "Run RolloutRemover";

    if (!currentExample) {
      processingMark.hidden = true;
      cacheMessage.hidden = false;
      outputSurface.dataset.state = "missing";
      return;
    }

    void playRollout();
  }

  function startInferenceProgress() {
    const duration = 2000 + Math.random() * 1500;
    const startedAt = performance.now();
    inferenceProgress.dataset.durationMs = String(Math.round(duration));

    const updateProgress = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const percent = Math.round(progress * 100);
      inferenceFill.style.transform = `scaleX(${progress.toFixed(4)})`;
      inferenceProgress.setAttribute("aria-valuenow", String(percent));

      if (progress < 1) {
        inferenceFrameRequest = window.requestAnimationFrame(updateProgress);
        return;
      }

      finishInference();
    };

    inferenceFrameRequest = window.requestAnimationFrame(updateProgress);
  }

  function resetOutput() {
    playbackGeneration += 1;
    resetInferenceProgress();
    hideUserMaskPreview();
    outputVideo.pause();
    outputVideo.removeAttribute("src");
    outputVideo.load();
    outputVideo.hidden = true;
    resultImage.hidden = true;
    cacheMessage.hidden = true;
    processingMark.hidden = true;
    outputPlaceholder.hidden = false;
    replayButton.hidden = true;
    runButton.disabled = false;
    runLabel.textContent = "Run RolloutRemover";
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

    hideUserMaskPreview();
    outputVideo.hidden = true;
    resultImage.src = example.result;
    resultImage.hidden = false;
    processingMark.hidden = true;
    outputPlaceholder.hidden = true;
    outputSurface.dataset.state = "result";
    outputSurface.classList.add("is-revealing");
    replayButton.hidden = false;
  }

  async function playRollout() {
    const example = examples[currentExample];
    if (!example) return;

    const generation = playbackGeneration + 1;
    playbackGeneration = generation;
    const isReady = await waitForVideoReady(generation);
    if (generation !== playbackGeneration) return;
    if (!isReady) {
      revealResult();
      return;
    }

    outputVideo.pause();
    outputVideo.currentTime = 0;
    outputVideo.defaultPlaybackRate = rolloutPlaybackRate;
    outputVideo.playbackRate = rolloutMaskSkipPlaybackRate;

    processingMark.hidden = true;
    outputPlaceholder.hidden = true;
    resultImage.hidden = true;
    cacheMessage.hidden = true;
    outputVideo.hidden = false;
    outputSurface.dataset.state = "playing";
    outputSurface.classList.add("is-revealing");
    replayButton.hidden = true;

    showUserMaskPreview();
    const didStartMaskSkip = await startVideoPlayback(generation);
    if (!didStartMaskSkip || generation !== playbackGeneration) {
      hideUserMaskPreview();
      if (generation === playbackGeneration) revealResult();
      return;
    }

    const [shouldPlay, reachedImageRollout] = await Promise.all([
      waitForMaskPreview(generation),
      waitForVideoTime(rolloutReplacementStartTime, generation)
    ]);
    if (!shouldPlay || generation !== playbackGeneration) return;
    outputVideo.pause();
    if (!reachedImageRollout) {
      hideUserMaskPreview();
      revealResult();
      return;
    }
    outputVideo.defaultPlaybackRate = rolloutPlaybackRate;
    outputVideo.playbackRate = rolloutPlaybackRate;
    hideUserMaskPreview();

    const didStart = await startVideoPlayback(generation);
    if (!didStart && generation === playbackGeneration) revealResult();
  }

  function runDemo() {
    if (strokes.length === 0) {
      showInputPrompt();
      return;
    }

    resetOutput();
    if (currentExample) {
      const example = examples[currentExample];
      outputVideo.src = example.rollout;
      outputVideo.defaultPlaybackRate = rolloutPlaybackRate;
      outputVideo.playbackRate = rolloutPlaybackRate;
      outputVideo.load();
    }
    runButton.disabled = true;
    outputPlaceholder.hidden = true;
    processingMark.hidden = false;
    outputSurface.dataset.state = "processing";
    startInferenceProgress();
  }

  canvas.addEventListener("pointerdown", beginStroke);
  canvas.addEventListener("pointermove", continueStroke);
  canvas.addEventListener("pointerup", endStroke);
  canvas.addEventListener("pointercancel", endStroke);

  undoButton.addEventListener("click", () => {
    invalidateOutput();
    strokes.pop();
    redrawStrokes();
    updateScribbleControls();
  });

  clearButton.addEventListener("click", () => {
    invalidateOutput();
    clearStrokes();
  });

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
  replayButton.addEventListener("click", () => {
    void playRollout();
  });

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
