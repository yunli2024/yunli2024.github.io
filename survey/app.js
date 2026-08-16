(function () {
  "use strict";

  const config = window.VISUAL_SURVEY_CONFIG;
  if (!config) {
    document.body.innerHTML = "<p class='fatal-error'>Survey configuration could not be loaded.</p>";
    return;
  }

  const storageKey = `survey-state:${config.studyId}`;
  const criteriaGrid = document.getElementById("criteria-grid");
  const tasksContainer = document.getElementById("tasks-container");
  const answeredCount = document.getElementById("answered-count");
  const questionCount = document.getElementById("question-count");
  const completionPercent = document.getElementById("completion-percent");
  const copyButton = document.getElementById("copy-response");
  const responseCode = document.getElementById("response-code");
  const externalLink = document.getElementById("external-survey-link");
  const resetButton = document.getElementById("reset-responses");
  const toast = document.getElementById("toast");
  const readingProgress = document.getElementById("reading-progress-fill");
  let toastTimer = null;

  const totalRows = config.tasks.length * config.criteria.length;
  let state = readState();

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function createSessionId() {
    const bytes = new Uint8Array(6);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }
    return `SV-${Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
  }

  function seededRandom(seedText) {
    let seed = 2166136261;
    for (let index = 0; index < seedText.length; index += 1) {
      seed ^= seedText.charCodeAt(index);
      seed = Math.imul(seed, 16777619);
    }
    return function random() {
      seed += 0x6D2B79F5;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffledTokens(task, sessionId) {
    const random = seededRandom(`${config.studyId}|${sessionId}|${task.id}`);
    const tokens = task.candidates.map((candidate) => candidate.token);
    for (let index = tokens.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [tokens[index], tokens[target]] = [tokens[target], tokens[index]];
    }
    return tokens;
  }

  function createAssignments(sessionId) {
    return Object.fromEntries(config.tasks.map((task) => [task.id, shuffledTokens(task, sessionId)]));
  }

  function freshState() {
    const sessionId = createSessionId();
    return {
      schemaVersion: config.schemaVersion,
      studyId: config.studyId,
      assignmentManifestId: config.assignmentManifestId,
      mode: config.mode,
      sessionId,
      startedAt: new Date().toISOString(),
      completedAt: null,
      assignments: createAssignments(sessionId),
      responses: {}
    };
  }

  function readState() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return freshState();
      const parsed = JSON.parse(raw);
      if (parsed.studyId !== config.studyId ||
          parsed.assignmentManifestId !== config.assignmentManifestId ||
          typeof parsed.responses !== "object") {
        return freshState();
      }
      if (!parsed.assignments || typeof parsed.assignments !== "object") {
        parsed.assignments = createAssignments(parsed.sessionId);
      }
      return parsed;
    } catch (_error) {
      return freshState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (_error) {
      showToast("当前浏览器无法保存进度，但你仍可继续完成本页。", "warning");
    }
  }

  function responseKey(taskId, criterionId) {
    return `${taskId}:${criterionId}`;
  }

  function renderCriteria() {
    criteriaGrid.innerHTML = config.criteria.map((criterion) => `
      <article class="criterion-card">
        <div class="criterion-number">${escapeHtml(criterion.number)}</div>
        <div>
          <h3>${escapeHtml(criterion.nameEn)}</h3>
          <p class="criterion-zh">${escapeHtml(criterion.nameZh)}</p>
          <p>${escapeHtml(criterion.prompt)}</p>
        </div>
      </article>
    `).join("");
  }

  function demoSceneMarkup(scene, variant, source = false) {
    return `
      <div class="demo-stage scene-${escapeHtml(scene)} variant-${escapeHtml(variant)}${source ? " is-source" : ""}"
           data-demo-stage role="img" aria-label="${source ? "演示输入图像和红色 scribble" : "演示候选视频占位画面"}">
        <div class="demo-sky"></div>
        <div class="demo-horizon"></div>
        <div class="demo-structure structure-one"></div>
        <div class="demo-structure structure-two"></div>
        <div class="demo-shadow"></div>
        <div class="demo-object"><span></span></div>
        <div class="demo-repair"></div>
        <div class="demo-artifact artifact-one"></div>
        <div class="demo-artifact artifact-two"></div>
        ${source ? "<div class='demo-scribble'><i></i><i></i><i></i></div>" : ""}
        <div class="demo-playhead"></div>
        <span class="demo-label">DEMO / PLACEHOLDER</span>
      </div>
    `;
  }

  function assignedCandidates(task) {
    const tokens = state.assignments[task.id] || shuffledTokens(task, state.sessionId);
    return tokens.map((token) => task.candidates.find((candidate) => candidate.token === token)).filter(Boolean);
  }

  function candidateMarkup(task, candidate, index) {
    const displayKey = String.fromCharCode(65 + index);
    const label = config.candidateLabels[index] || `Video ${displayKey}`;
    const media = candidate.src
      ? `<video src="${escapeHtml(candidate.src)}" controls muted playsinline preload="metadata" data-candidate-video></video>`
      : demoSceneMarkup(task.scene, candidate.variant, false);
    return `
      <article class="candidate-card" data-candidate="${escapeHtml(displayKey)}">
        <div class="candidate-media">${media}</div>
        <div class="candidate-footer">
          <span>${escapeHtml(label)}</span>
          <small>anonymous candidate</small>
        </div>
      </article>
    `;
  }

  function criterionQuestionMarkup(task, criterion) {
    const key = responseKey(task.id, criterion.id);
    const saved = Array.isArray(state.responses[key]) ? state.responses[key] : [];
    const options = config.candidateLabels.map((label, index) => {
      const candidateKey = String.fromCharCode(65 + index);
      const checked = saved.includes(candidateKey) ? " checked" : "";
      return `
        <label class="candidate-option">
          <input type="checkbox" value="${escapeHtml(candidateKey)}"${checked}>
          <span class="option-key">${escapeHtml(candidateKey)}</span>
          <span>${escapeHtml(label)}</span>
        </label>
      `;
    }).join("");

    return `
      <fieldset class="criterion-question${saved.length === 2 ? " is-complete" : ""}"
                data-response-key="${escapeHtml(key)}">
        <legend>
          <span class="question-number">${escapeHtml(criterion.number)}</span>
          <span class="question-copy">
            <strong>${escapeHtml(criterion.nameEn)} <em>${escapeHtml(criterion.nameZh)}</em></strong>
            <small>${escapeHtml(criterion.prompt)}</small>
          </span>
          <span class="selection-count"><b>${saved.length}</b>/2 selected</span>
        </legend>
        <div class="candidate-options">${options}</div>
      </fieldset>
    `;
  }

  function taskMarkup(task, taskIndex) {
    const candidates = assignedCandidates(task).map((candidate, index) => candidateMarkup(task, candidate, index)).join("");
    const questions = config.criteria.map((criterion) => criterionQuestionMarkup(task, criterion)).join("");
    return `
      <article class="task-card reveal-item" id="task-${escapeHtml(task.id)}" data-task-id="${escapeHtml(task.id)}">
        <header class="task-header">
          <div>
            <span class="task-sequence">${String(taskIndex + 1).padStart(2, "0")} / ${String(config.tasks.length).padStart(2, "0")}</span>
            <h3>${escapeHtml(task.label)}</h3>
          </div>
          <span class="task-context">${escapeHtml(task.context)}</span>
        </header>

        <div class="intent-panel">
          <div class="source-preview">${demoSceneMarkup(task.scene, "input", true)}</div>
          <div class="intent-copy">
            <span>Source &amp; editing intent</span>
            <h4>${escapeHtml(task.instructionZh)}</h4>
            <p>${escapeHtml(task.instruction)}</p>
            <ul>
              <li>确认目标是否被移除</li>
              <li>检查附近结构与背景</li>
              <li>观察整个变化过程</li>
            </ul>
          </div>
        </div>

        <div class="media-toolbar" aria-label="候选视频控制">
          <div>
            <span class="toolbar-label">Synchronized controls</span>
            <span class="playback-status" aria-live="polite">Ready</span>
          </div>
          <div class="toolbar-actions">
            <button type="button" data-action="play"><span aria-hidden="true">▶</span> 同时播放</button>
            <button type="button" data-action="pause"><span aria-hidden="true">Ⅱ</span> 同时暂停</button>
            <button type="button" data-action="reset"><span aria-hidden="true">↺</span> 重置</button>
          </div>
        </div>

        <div class="candidate-grid">${candidates}</div>

        <div class="questions-header">
          <div><span>Preference form</span><h4>每项选择两个候选</h4></div>
          <p>Top–2 · no ranking within the selected pair</p>
        </div>
        <div class="question-list">${questions}</div>
      </article>
    `;
  }

  function renderTasks() {
    tasksContainer.innerHTML = config.tasks.map(taskMarkup).join("");
    tasksContainer.querySelectorAll(".criterion-question").forEach(bindQuestionRow);
    tasksContainer.querySelectorAll(".task-card").forEach(bindTaskControls);
  }

  function bindQuestionRow(row) {
    row.addEventListener("change", (event) => {
      const checkbox = event.target.closest('input[type="checkbox"]');
      if (!checkbox) return;
      const selected = Array.from(row.querySelectorAll('input[type="checkbox"]:checked'));
      if (selected.length > 2) {
        checkbox.checked = false;
        showToast("每项最多选择两个候选。", "warning");
      }
      const finalSelection = Array.from(row.querySelectorAll('input[type="checkbox"]:checked'))
        .map((input) => input.value)
        .sort();
      state.responses[row.dataset.responseKey] = finalSelection;
      saveState();
      updateQuestionRow(row, finalSelection.length);
      updateProgress();
    });
  }

  function updateQuestionRow(row, count) {
    row.classList.toggle("is-complete", count === 2);
    const counter = row.querySelector(".selection-count b");
    if (counter) counter.textContent = String(count);
  }

  function bindTaskControls(taskCard) {
    taskCard.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => controlTask(taskCard, button.dataset.action));
    });
  }

  async function controlTask(taskCard, action) {
    const videos = Array.from(taskCard.querySelectorAll("[data-candidate-video]"));
    const demos = Array.from(taskCard.querySelectorAll(".candidate-card [data-demo-stage]"));
    const status = taskCard.querySelector(".playback-status");

    if (action === "play") {
      videos.forEach((video) => { video.currentTime = 0; });
      demos.forEach((demo) => {
        demo.classList.remove("is-playing", "is-paused");
        void demo.offsetWidth;
        demo.classList.add("is-playing");
      });
      await Promise.allSettled(videos.map((video) => video.play()));
      status.textContent = "Playing together";
      taskCard.classList.add("is-playing");
      return;
    }

    if (action === "pause") {
      videos.forEach((video) => video.pause());
      demos.forEach((demo) => demo.classList.add("is-paused"));
      status.textContent = "Paused";
      taskCard.classList.remove("is-playing");
      return;
    }

    videos.forEach((video) => {
      video.pause();
      video.currentTime = 0;
    });
    demos.forEach((demo) => demo.classList.remove("is-playing", "is-paused"));
    status.textContent = "Ready";
    taskCard.classList.remove("is-playing");
  }

  function orderedResponses() {
    return config.tasks.flatMap((task) => config.criteria.map((criterion) => {
      const key = responseKey(task.id, criterion.id);
      const selected = Array.isArray(state.responses[key]) ? state.responses[key] : [];
      return {
        task_id: task.id,
        criterion: criterion.id,
        selected
      };
    }));
  }

  function buildResponsePayload() {
    return {
      schema_version: config.schemaVersion,
      study_id: config.studyId,
      mode: config.mode,
      assignment_manifest_id: config.assignmentManifestId,
      session_id: state.sessionId,
      started_at: state.startedAt,
      completed_at: state.completedAt,
      generated_at: new Date().toISOString(),
      assignments: Object.fromEntries(config.tasks.map((task) => {
        const tokens = state.assignments[task.id] || [];
        return [task.id, Object.fromEntries(tokens.map((token, index) => [String.fromCharCode(65 + index), token]))];
      })),
      responses: orderedResponses()
    };
  }

  function updateProgress() {
    const completeRows = orderedResponses().filter((response) => response.selected.length === 2).length;
    const percent = totalRows ? Math.round((completeRows / totalRows) * 100) : 0;
    if (completeRows === totalRows && !state.completedAt) {
      state.completedAt = new Date().toISOString();
      saveState();
    } else if (completeRows !== totalRows && state.completedAt) {
      state.completedAt = null;
      saveState();
    }
    answeredCount.textContent = String(completeRows);
    questionCount.textContent = String(totalRows);
    completionPercent.textContent = `${percent}%`;
    document.documentElement.style.setProperty("--completion", `${percent * 3.6}deg`);
    copyButton.disabled = completeRows !== totalRows;

    if (completeRows === totalRows) {
      responseCode.value = JSON.stringify(buildResponsePayload());
    } else {
      responseCode.value = "";
    }
  }

  function configureExternalLink() {
    const url = String(config.questionnaireUrl || "").trim();
    const configured = /^https:\/\//i.test(url);
    if (configured) {
      externalLink.href = url;
      externalLink.target = "_blank";
      externalLink.rel = "noopener noreferrer";
      externalLink.classList.remove("is-unconfigured");
      externalLink.removeAttribute("aria-disabled");
      externalLink.innerHTML = `${escapeHtml(config.questionnaireLabel)} <span aria-hidden="true">↗</span>`;
    } else {
      externalLink.addEventListener("click", (event) => {
        event.preventDefault();
        showToast("真实腾讯问卷链接尚未配置。请在 config.js 中填写 questionnaireUrl。", "warning");
      });
    }
  }

  async function copyResponse() {
    if (copyButton.disabled) return;
    const text = JSON.stringify(buildResponsePayload());
    responseCode.value = text;
    responseCode.focus();
    responseCode.select();
    try {
      await navigator.clipboard.writeText(text);
      showToast("回答代码已复制，可以前往腾讯问卷粘贴。", "success");
    } catch (_error) {
      document.execCommand("copy");
      showToast("回答代码已生成；如未自动复制，请手动复制文本框内容。", "warning");
    }
  }

  function resetResponses() {
    const confirmed = window.confirm("确定清空当前浏览器中的全部演示选择吗？");
    if (!confirmed) return;
    state = freshState();
    saveState();
    tasksContainer.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
    tasksContainer.querySelectorAll(".criterion-question").forEach((row) => updateQuestionRow(row, 0));
    updateProgress();
    showToast("演示选择已清空。", "success");
  }

  function showToast(message, tone = "default") {
    if (toastTimer) window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3800);
  }

  function updateReadingProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
    readingProgress.style.transform = `scaleX(${progress})`;
  }

  function setupReveal() {
    const items = Array.from(document.querySelectorAll(".reveal-item"));
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((item) => item.classList.add("is-revealed"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px" });
    items.forEach((item) => observer.observe(item));
  }

  renderCriteria();
  renderTasks();
  configureExternalLink();
  updateProgress();
  setupReveal();
  updateReadingProgress();

  copyButton.addEventListener("click", copyResponse);
  resetButton.addEventListener("click", resetResponses);
  window.addEventListener("scroll", updateReadingProgress, { passive: true });
})();
