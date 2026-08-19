(function () {
  "use strict";

  const config = window.VISUAL_SURVEY_CONFIG;
  if (!config) throw new Error("Survey configuration must load before form configuration.");
  const formId = 2;
  const assetRoot = "../assets/sraw-v5";
  const practiceAssetRoot = "../assets/sraw-practice-v2";

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
  config.schemaVersion = 9;
  config.responseSchemaVersion = 2;
  config.assignmentManifestId = "sraw300-two-form-20case-v5";
  config.practice.referenceSrc = `${practiceAssetRoot}/input.png`;
  config.practice.candidates.forEach((candidate, index) => {
    candidate.src = `${practiceAssetRoot}/p${String(index + 1).padStart(2, "0")}.png`;
  });
  config.tasks = Array.from({ length: 10 }, (_value, index) => makeTask(index + 1));
})();
