(function () {
  "use strict";

  const config = window.VISUAL_SURVEY_CONFIG;
  if (!config) throw new Error("Survey configuration must load before form configuration.");
  const formId = 2;
  const assetRoot = "../assets/sraw-v1";

  function makeTask(taskNumber) {
    const number = String(taskNumber).padStart(2, "0");
    return {
      id: `study_item_${number}`,
      labelZh: `任务 ${taskNumber}`,
      labelEn: `Task ${taskNumber}`,
      contextZh: `评测样本 ${number}`,
      contextEn: `Evaluation sample ${number}`,
      instructionZh: "删除标记的目标物体，自然补全被移除区域，并尽量保持场景中的其他内容不变。",
      instructionEn: "Remove the marked target object, reconstruct the removed region naturally, and preserve the rest of the scene as much as possible.",
      referenceSrc: `${assetRoot}/f${formId}/t${number}/input.png`,
      candidates: Array.from({ length: 6 }, (_value, index) => ({
        token: `t${number}-c${index + 1}`,
        src: `${assetRoot}/f${formId}/t${number}/c${String(index + 1).padStart(2, "0")}.png`
      }))
    };
  }

  config.formId = formId;
  config.schemaVersion = 5;
  config.responseSchemaVersion = 2;
  config.assignmentManifestId = "sraw-two-form-20case-v1";
  config.practice.candidates.forEach((candidate, index) => {
    candidate.src = `${assetRoot}/practice/p${String(index + 1).padStart(2, "0")}.png`;
  });
  config.tasks = Array.from({ length: 10 }, (_value, index) => makeTask(index + 1));
})();
