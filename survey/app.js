(function () {
  "use strict";

  const config = window.VISUAL_SURVEY_CONFIG;
  if (!config) {
    document.body.innerHTML = "<p class='fatal-error'>问卷配置加载失败。 / Survey configuration could not be loaded.</p>";
    return;
  }

  const formId = config.formId ?? null;
  if (formId !== null && formId !== 1 && formId !== 2) {
    document.body.innerHTML = "<p class='fatal-error'>问卷分卷配置无效。 / Invalid survey form configuration.</p>";
    return;
  }
  const formStorageScope = formId === null ? "" : `:form:${formId}`;
  const storageKey = `survey-state:${config.studyId}${formStorageScope}:v${config.schemaVersion}`;
  const practiceContainer = document.getElementById("practice-container");
  const tasksContainer = document.getElementById("tasks-container");
  const answeredCount = document.getElementById("answered-count");
  const questionCount = document.getElementById("question-count");
  const completionPercent = document.getElementById("completion-percent");
  const copyButton = document.getElementById("copy-response");
  const responseCode = document.getElementById("response-code");
  const externalLink = document.getElementById("external-survey-link");
  const submissionReadiness = document.getElementById("submission-readiness");
  const resetButton = document.getElementById("reset-responses");
  const toast = document.getElementById("toast");
  let toastTimer = null;
  let questionnaireUrl = "";

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
    const nextState = {
      schemaVersion: config.schemaVersion,
      studyId: config.studyId,
      assignmentManifestId: config.assignmentManifestId,
      mode: config.mode,
      sessionId,
      startedAt: new Date().toISOString(),
      completedAt: null,
      assignments: createAssignments(sessionId),
      practiceSelections: [],
      instructionsConfirmed: false,
      responses: {}
    };
    if (formId !== null) nextState.formId = formId;
    return nextState;
  }

  function readState() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return freshState();
      const parsed = JSON.parse(raw);
      if (parsed.schemaVersion !== config.schemaVersion ||
          parsed.studyId !== config.studyId ||
          parsed.assignmentManifestId !== config.assignmentManifestId ||
          (parsed.formId ?? null) !== formId ||
          typeof parsed.responses !== "object") {
        return freshState();
      }
      if (!parsed.assignments || typeof parsed.assignments !== "object") {
        parsed.assignments = createAssignments(parsed.sessionId);
      }
      const practiceKeys = new Set(config.practice.candidates.map((candidate) => candidate.key));
      const savedPractice = Array.isArray(parsed.practiceSelections) ? parsed.practiceSelections : [];
      parsed.practiceSelections = [...new Set(savedPractice.filter((key) => practiceKeys.has(key)))]
        .slice(0, 2)
        .sort();
      parsed.instructionsConfirmed = practiceSelectionIsCorrect(parsed.practiceSelections) &&
        parsed.instructionsConfirmed === true;
      return parsed;
    } catch (_error) {
      return freshState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (_error) {
      showToast("当前浏览器无法保存进度。 / This browser cannot save your progress.", "warning");
    }
  }

  function responseKey(taskId, criterionId) {
    return `${taskId}:${criterionId}`;
  }

  function practiceSelectionIsCorrect(selections) {
    const selected = Array.isArray(selections) ? [...new Set(selections)].sort() : [];
    const correct = Array.isArray(config.practice.correctAnswers)
      ? [...new Set(config.practice.correctAnswers)].sort()
      : [];
    return correct.length === 2 && selected.length === correct.length &&
      correct.every((key, index) => key === selected[index]);
  }

  function imagePlaceholderMarkup(label, kind = "candidate") {
    const placeholderTitle = kind === "reference"
      ? "输入图像与标注 / Input image & annotation"
      : kind === "practice"
        ? "示例图像 / Example image"
        : "候选结果 / Candidate result";
    return `
      <div class="image-placeholder ${escapeHtml(kind)}-placeholder" role="img"
           aria-label="${escapeHtml(label)}">
        <span class="placeholder-icon" aria-hidden="true"></span>
        <span class="placeholder-copy">
          <strong>${escapeHtml(placeholderTitle)}</strong>
          <small>${escapeHtml(label)}</small>
        </span>
      </div>
    `;
  }

  function referenceMarkup(task) {
    if (task.referenceSrc) {
      return `<img src="${escapeHtml(task.referenceSrc)}" alt="输入图像及红色线条标注 / Input image annotated with red lines" loading="lazy" data-reference-image>`;
    }
    return imagePlaceholderMarkup("输入图像及红色线条标注 / Input image annotated with red lines", "reference");
  }

  function assignedCandidates(task) {
    const tokens = state.assignments[task.id] || shuffledTokens(task, state.sessionId);
    return tokens.map((token) => task.candidates.find((candidate) => candidate.token === token)).filter(Boolean);
  }

  function candidateMarkup(task, candidate, index) {
    const displayKey = String.fromCharCode(65 + index);
    const label = config.candidateLabels[index] || displayKey;
    const media = candidate.src
      ? `<img src="${escapeHtml(candidate.src)}" alt="${escapeHtml(label)} 匿名候选结果 / anonymous candidate result" loading="lazy" data-candidate-image>`
      : imagePlaceholderMarkup(label);
    return `
      <article class="candidate-card" data-candidate="${escapeHtml(displayKey)}">
        <div class="candidate-media">${media}</div>
        <div class="anonymous-label">${escapeHtml(label)}</div>
      </article>
    `;
  }

  function practiceCandidateMarkup(candidate) {
    const label = `${candidate.labelZh} / ${candidate.labelEn}`;
    const media = candidate.src
      ? `<img src="${escapeHtml(candidate.src)}" alt="${escapeHtml(label)}" loading="lazy" data-practice-image>`
      : imagePlaceholderMarkup(label, "practice");
    return `
      <article class="practice-candidate-card" data-practice-candidate="${escapeHtml(candidate.key)}">
        <div class="practice-candidate-media">${media}</div>
        <div class="anonymous-label">${escapeHtml(label)}</div>
      </article>
    `;
  }

  function practiceReferenceMarkup(practice) {
    const alt = `${practice.referenceAltZh} / ${practice.referenceAltEn}`;
    const media = practice.referenceSrc
      ? `<img src="${escapeHtml(practice.referenceSrc)}" alt="${escapeHtml(alt)}" loading="lazy" data-practice-reference-image>`
      : imagePlaceholderMarkup(alt, "reference");
    return `
      <section class="practice-reference-section" aria-labelledby="practice-reference-heading">
        <div class="practice-section-heading">
          <h3 id="practice-reference-heading">${escapeHtml(practice.referenceHeadingZh)} <span>/ ${escapeHtml(practice.referenceHeadingEn)}</span></h3>
          <p>${escapeHtml(practice.referenceNoteZh)}<br><span lang="en">${escapeHtml(practice.referenceNoteEn)}</span></p>
        </div>
        <article class="practice-reference-card">
          <div class="practice-reference-media">${media}</div>
        </article>
      </section>
    `;
  }

  function practiceMarkup() {
    const practice = config.practice;
    const saved = state.practiceSelections;
    const options = practice.candidates.map((candidate) => {
      const checked = saved.includes(candidate.key) ? " checked" : "";
      return `
        <label class="candidate-option practice-option">
          <input type="checkbox" value="${escapeHtml(candidate.key)}"${checked}>
          <span>${escapeHtml(candidate.labelZh)} / ${escapeHtml(candidate.labelEn)}</span>
        </label>
      `;
    }).join("");
    const candidates = practice.candidates.map(practiceCandidateMarkup).join("");
    const canConfirm = practiceSelectionIsCorrect(saved);
    const incorrect = saved.length === 2 && !canConfirm;
    const confirmed = canConfirm && state.instructionsConfirmed;

    return `
      <header class="practice-header">
        <div>
          <span class="practice-kicker">开始前请先完成 / Complete before starting</span>
          <h2 id="practice-title">${escapeHtml(practice.titleZh)} <span>/ ${escapeHtml(practice.titleEn)}</span></h2>
        </div>
        <span class="practice-badge">任务示例 / Worked example</span>
      </header>

      <div class="practice-intro">
        <p>${escapeHtml(practice.instructionZh)}</p>
        <p lang="en">${escapeHtml(practice.instructionEn)}</p>
      </div>

      ${practiceReferenceMarkup(practice)}

      <section class="practice-results-section" aria-labelledby="practice-results-heading">
        <div class="practice-section-heading compact">
          <h3 id="practice-results-heading">${escapeHtml(practice.resultsHeadingZh)} <span>/ ${escapeHtml(practice.resultsHeadingEn)}</span></h3>
        </div>
        <div class="practice-grid">${candidates}</div>
      </section>

      <fieldset class="practice-question${canConfirm ? " is-complete" : ""}${incorrect ? " is-incorrect" : ""}" data-practice-question>
        <legend>
          <span class="question-copy">
            <strong>示例题 / Practice Question</strong>
            <small>${escapeHtml(practice.questionZh)}</small>
            <small class="question-en" lang="en">${escapeHtml(practice.questionEn)}</small>
          </span>
          <span class="selection-count">已选 / Selected <b>${saved.length}</b>/2</span>
        </legend>
        <div class="candidate-options practice-options">${options}</div>
      </fieldset>

      <div id="practice-guidance" class="practice-guidance" aria-live="polite"></div>
      <label id="practice-confirmation-panel" class="practice-confirmation${canConfirm ? " is-enabled" : ""}${confirmed ? " is-confirmed" : ""}">
        <input id="practice-confirmation" type="checkbox"${canConfirm ? "" : " disabled"}${confirmed ? " checked" : ""}>
        <span>
          <strong>${escapeHtml(practice.confirmationZh)}</strong>
          <small lang="en">${escapeHtml(practice.confirmationEn)}</small>
        </span>
      </label>
    `;
  }

  function renderPractice() {
    practiceContainer.innerHTML = practiceMarkup();
    const question = practiceContainer.querySelector("[data-practice-question]");
    const confirmation = practiceContainer.querySelector("#practice-confirmation");

    question.addEventListener("change", (event) => {
      const checkbox = event.target.closest('input[type="checkbox"]');
      if (!checkbox) return;
      const selected = Array.from(question.querySelectorAll('input[type="checkbox"]:checked'));
      if (selected.length > 2) {
        checkbox.checked = false;
        showToast("示例题必须且只能选择两个结果。 / Select exactly two results in the practice question.", "warning");
      }
      state.practiceSelections = Array.from(question.querySelectorAll('input[type="checkbox"]:checked'))
        .map((input) => input.value)
        .sort();
      if (!practiceSelectionIsCorrect(state.practiceSelections)) {
        state.instructionsConfirmed = false;
      }
      saveState();
      updatePracticeUi();
      updateProgress();
    });

    confirmation.addEventListener("change", () => {
      if (!practiceSelectionIsCorrect(state.practiceSelections)) {
        confirmation.checked = false;
        return;
      }
      state.instructionsConfirmed = confirmation.checked;
      saveState();
      updatePracticeUi();
      updateProgress();
    });

    updatePracticeUi();
  }

  function updatePracticeUi() {
    const count = state.practiceSelections.length;
    const question = practiceContainer.querySelector("[data-practice-question]");
    const counter = question.querySelector(".selection-count b");
    const confirmation = practiceContainer.querySelector("#practice-confirmation");
    const panel = practiceContainer.querySelector("#practice-confirmation-panel");
    const guidance = practiceContainer.querySelector("#practice-guidance");
    const canConfirm = practiceSelectionIsCorrect(state.practiceSelections);
    const incorrect = count === 2 && !canConfirm;
    const confirmed = canConfirm && state.instructionsConfirmed;

    question.classList.toggle("is-complete", canConfirm);
    question.classList.toggle("is-incorrect", incorrect);
    counter.textContent = String(count);
    confirmation.disabled = !canConfirm;
    confirmation.checked = confirmed;
    panel.classList.toggle("is-enabled", canConfirm);
    panel.classList.toggle("is-confirmed", confirmed);
    guidance.classList.toggle("is-correct", canConfirm);
    guidance.classList.toggle("is-incorrect", incorrect);

    if (count < 2) {
      guidance.innerHTML = "<span>请先比较输入图像与三个结果，并选择两个答案。</span><span lang=\"en\">Compare the input image with the three results, then select two answers.</span>";
    } else if (incorrect) {
      guidance.innerHTML = `<strong>再看一下：为什么不能选择 C？ / Try again: why should C not be selected?</strong><span>${escapeHtml(config.practice.incorrectExplanationZh)}</span><span lang="en">${escapeHtml(config.practice.incorrectExplanationEn)}</span>`;
    } else {
      guidance.innerHTML = `<strong>为什么选择 A 和 B，而不是 C？ / Why A and B rather than C?</strong><span>${escapeHtml(config.practice.correctExplanationZh)}</span><span lang="en">${escapeHtml(config.practice.correctExplanationEn)}</span><span class="practice-transition"><b>${escapeHtml(config.practice.transitionZh)}</b><b lang="en">${escapeHtml(config.practice.transitionEn)}</b></span>`;
    }
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
          <span>${escapeHtml(label)}</span>
        </label>
      `;
    }).join("");

    return `
      <fieldset class="criterion-question${saved.length === 2 ? " is-complete" : ""}"
                data-response-key="${escapeHtml(key)}">
        <legend>
          <span class="question-copy">
            <strong><span class="question-number">${escapeHtml(criterion.number)}</span>${escapeHtml(criterion.nameEn)} <em>（${escapeHtml(criterion.nameZh)}）</em></strong>
            <small>${escapeHtml(criterion.promptZh)}</small>
            <small class="question-en" lang="en">${escapeHtml(criterion.promptEn)}</small>
          </span>
          <span class="selection-count">已选 / Selected <b>${saved.length}</b>/2</span>
        </legend>
        <div class="candidate-options">${options}</div>
      </fieldset>
    `;
  }

  function taskMarkup(task, taskIndex) {
    const candidates = assignedCandidates(task).map((candidate, index) => candidateMarkup(task, candidate, index)).join("");
    const questions = config.criteria.map((criterion) => criterionQuestionMarkup(task, criterion)).join("");
    return `
      <article class="task-card" id="task-${escapeHtml(task.id)}" data-task-id="${escapeHtml(task.id)}">
        <header class="task-header">
          <h2>${escapeHtml(task.labelZh)} <span>/ ${escapeHtml(task.labelEn)}</span></h2>
          <span class="task-sequence">${taskIndex + 1} / ${config.tasks.length}</span>
        </header>

        <div class="prompt-box">
          <p><span class="prompt-label">任务说明：</span>${escapeHtml(task.instructionZh)}</p>
          <p lang="en"><span class="prompt-label">Instructions:</span>${escapeHtml(task.instructionEn)}</p>
          <span class="task-context">${escapeHtml(task.contextZh)} / ${escapeHtml(task.contextEn)}</span>
        </div>

        <section class="reference-section" aria-label="输入图像与标注 / Input image and annotation">
          <div class="media-section-heading">
            <h3>输入图像与标注 <span>/ Input image &amp; annotation</span></h3>
          </div>
          <div class="reference-card">
            <div class="reference-media">${referenceMarkup(task)}</div>
          </div>
        </section>

        <section class="candidate-section" aria-label="候选结果 / Candidate results">
          <div class="media-section-heading">
            <h3>候选结果 <span>/ Candidate results</span></h3>
            <p>六个匿名结果 / Six anonymous results</p>
          </div>
          <div class="candidate-grid">${candidates}</div>
        </section>

        <div class="question-section-heading">
          <h3>请分别完成以下五项评价 <span>/ Rate all five criteria</span></h3>
          <p>每项选择两个候选，所选结果不排序 / Select two per criterion; no ranking</p>
        </div>
        <div class="question-list">${questions}</div>
      </article>
    `;
  }

  function renderTasks() {
    tasksContainer.innerHTML = config.tasks.map(taskMarkup).join("");
    tasksContainer.querySelectorAll(".criterion-question").forEach(bindQuestionRow);
  }

  function bindQuestionRow(row) {
    row.addEventListener("change", (event) => {
      const checkbox = event.target.closest('input[type="checkbox"]');
      if (!checkbox) return;
      const selected = Array.from(row.querySelectorAll('input[type="checkbox"]:checked'));
      if (selected.length > 2) {
        checkbox.checked = false;
        showToast("每项最多选择两个候选。 / Select no more than two candidates per criterion.", "warning");
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
    const candidateOrders = config.tasks.map((task) => {
      const tokens = state.assignments[task.id] || [];
      const permutation = tokens.map((token) => {
        const candidateIndex = task.candidates.findIndex((candidate) => candidate.token === token);
        if (candidateIndex < 0 || candidateIndex >= config.candidateLabels.length) {
          throw new Error(`Invalid candidate assignment for ${task.id}`);
        }
        return String(candidateIndex + 1);
      }).join("");
      if (permutation.length !== config.candidateLabels.length ||
          new Set(permutation).size !== config.candidateLabels.length) {
        throw new Error(`Invalid candidate permutation for ${task.id}`);
      }
      return permutation;
    });

    const answers = config.tasks.map((task) => config.criteria.map((criterion) => {
      const key = responseKey(task.id, criterion.id);
      const selected = Array.isArray(state.responses[key]) ? state.responses[key] : [];
      return selected.join("");
    }));

    const payload = {
      v: config.responseSchemaVersion,
      s: config.studyId,
      m: config.assignmentManifestId,
      id: state.sessionId,
      t: [state.startedAt, state.completedAt].map((value) => Math.floor(new Date(value).getTime() / 1000)),
      o: candidateOrders,
      a: answers
    };
    if (formId !== null) payload.form_id = formId;
    return payload;
  }

  function practiceIsReady() {
    return practiceSelectionIsCorrect(state.practiceSelections) && state.instructionsConfirmed === true;
  }

  function updateExternalLink(ready) {
    if (!questionnaireUrl) return;
    externalLink.classList.toggle("is-locked", !ready);
    if (ready) {
      externalLink.href = questionnaireUrl;
      externalLink.target = "_blank";
      externalLink.rel = "noopener noreferrer";
      externalLink.removeAttribute("aria-disabled");
      externalLink.removeAttribute("tabindex");
    } else {
      externalLink.removeAttribute("href");
      externalLink.removeAttribute("target");
      externalLink.removeAttribute("rel");
      externalLink.setAttribute("aria-disabled", "true");
      externalLink.setAttribute("tabindex", "-1");
    }
  }

  function updateSubmissionReadiness(completeRows, ready) {
    submissionReadiness.dataset.state = ready ? "ready" : "locked";
    if (!practiceIsReady()) {
      submissionReadiness.innerHTML = "请先完成作答示例并勾选“我已经确认”。<br><span lang=\"en\">Complete the practice example and select “I confirm” before submission.</span>";
    } else if (completeRows !== totalRows) {
      submissionReadiness.innerHTML = `请完成全部 ${totalRows} 项正式评价。<br><span lang="en">Complete all ${totalRows} formal rating rows before submission.</span>`;
    } else {
      submissionReadiness.innerHTML = "全部必填内容已完成，可以复制回答代码并前往腾讯问卷。<br><span lang=\"en\">All required items are complete. You may copy the response code and continue to Tencent Survey.</span>";
    }
  }

  function updateProgress() {
    const completeRows = orderedResponses().filter((response) => response.selected.length === 2).length;
    const percent = totalRows ? Math.round((completeRows / totalRows) * 100) : 0;
    const ready = completeRows === totalRows && practiceIsReady();
    if (ready && !state.completedAt) {
      state.completedAt = new Date().toISOString();
      saveState();
    } else if (!ready && state.completedAt) {
      state.completedAt = null;
      saveState();
    }
    answeredCount.textContent = String(completeRows);
    questionCount.textContent = String(totalRows);
    completionPercent.textContent = `${percent}%`;
    document.documentElement.style.setProperty("--completion", `${percent * 3.6}deg`);
    copyButton.disabled = !ready;
    updateExternalLink(ready);
    updateSubmissionReadiness(completeRows, ready);

    if (ready) {
      responseCode.value = JSON.stringify(buildResponsePayload());
    } else {
      responseCode.value = "";
    }
  }

  function configureExternalLink() {
    const url = String(config.questionnaireUrl || "").trim();
    const configured = /^https:\/\//i.test(url);
    if (configured) {
      questionnaireUrl = url;
      externalLink.hidden = false;
      externalLink.classList.remove("is-unconfigured");
      externalLink.innerHTML = `${escapeHtml(config.questionnaireLabel)} <span aria-hidden="true">↗</span>`;
    } else {
      questionnaireUrl = "";
      externalLink.hidden = true;
      externalLink.removeAttribute("href");
      externalLink.setAttribute("tabindex", "-1");
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
      showToast("回答代码已复制。 / Response code copied.", "success");
    } catch (_error) {
      document.execCommand("copy");
      showToast("请手动复制文本框中的回答代码。 / Please copy the response code manually.", "warning");
    }
  }

  function resetResponses() {
    const confirmed = window.confirm("确定清空全部选择吗？ / Clear all selections?");
    if (!confirmed) return;
    state = freshState();
    saveState();
    renderPractice();
    renderTasks();
    updateProgress();
    showToast("选择已清空。 / Selections cleared.", "success");
  }

  function showToast(message, tone = "default") {
    if (toastTimer) window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3800);
  }

  renderPractice();
  renderTasks();
  configureExternalLink();
  updateProgress();

  copyButton.addEventListener("click", copyResponse);
  externalLink.addEventListener("click", (event) => {
    if (externalLink.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
    }
  });
  resetButton.addEventListener("click", resetResponses);
})();
