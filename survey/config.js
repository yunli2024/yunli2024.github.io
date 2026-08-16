/*
 * Public survey configuration.
 *
 * Formal media paths must stay opaque (for example, assets/t01/input.png and
 * assets/t01/c01.png). Never place method names, checkpoint names, or a public
 * candidate-to-method mapping in this repository. The private analysis
 * manifest resolves each opaque candidate token to its method identity.
 */

function makePlaceholderTask(taskNumber) {
  const number = String(taskNumber).padStart(2, "0");
  return {
    id: `study_item_${number}`,
    labelZh: `任务 ${taskNumber}`,
    labelEn: `Task ${taskNumber}`,
    contextZh: `评测样本 ${number}`,
    contextEn: `Evaluation sample ${number}`,
    instructionZh: "删除标记的目标物体，自然补全被移除区域，并尽量保持场景中的其他内容不变。",
    instructionEn: "Remove the marked target object, reconstruct the removed region naturally, and preserve the rest of the scene as much as possible.",
    referenceSrc: "",
    candidates: Array.from({ length: 6 }, (_value, index) => ({
      token: `t${number}-c${index + 1}`,
      src: ""
    }))
  };
}

window.VISUAL_SURVEY_CONFIG = {
  schemaVersion: 4,
  responseSchemaVersion: 1,
  studyId: "visual-removal-preference-v1",
  assignmentManifestId: "six-candidate-last-frame-v1",
  mode: "STUDY",
  questionnaireUrl: "https://wj.qq.com/s2/27600498/05wz/",
  questionnaireLabel: "打开腾讯问卷 / Open Tencent Survey",
  practice: {
    id: "top2_practice",
    titleZh: "作答示例",
    titleEn: "Practice Example",
    instructionZh: "请先完成下面的示例，以确认你理解 Top-2 选择规则。此题仅用于熟悉作答方式，不计入正式研究结果。",
    instructionEn: "Complete the example below to confirm that you understand the Top-2 selection rule. This practice response is not included in the formal study results.",
    questionZh: "请从三张示例图中选择你认为整体表现最好的两个结果。",
    questionEn: "Select the two results that you think have the best overall quality from the three example images.",
    confirmationZh: "我已经确认：我理解正式题中每项必须选择且只能选择 2 个结果。",
    confirmationEn: "I confirm that I understand I must select exactly two results for each criterion in the main study.",
    candidates: [
      { key: "A", labelZh: "示例 A", labelEn: "Example A", src: "" },
      { key: "B", labelZh: "示例 B", labelEn: "Example B", src: "" },
      { key: "C", labelZh: "示例 C", labelEn: "Example C", src: "" }
    ]
  },
  candidateLabels: ["Result A", "Result B", "Result C", "Result D", "Result E", "Result F"],
  criteria: [
    {
      id: "removal_completeness",
      number: "01",
      nameEn: "Removal Completeness",
      nameZh: "移除完整性",
      promptZh: "哪两个选项相对完整地移除了红色标注的目标物体，以及它的附加效果（阴影、倒影等），残留的程度更少？",
      promptEn: "Which two results most completely remove the target object indicated by the red annotation and its associated visual effects (e.g., shadows or reflections, if present), leaving the fewest visible remnants?"
    },
    {
      id: "background_plausibility",
      number: "02",
      nameEn: "Background Plausibility",
      nameZh: "背景补全合理性",
      promptZh: "哪两个选项在移除物体区域的背景补全上，更符合周围场景，看起来更加真实自然？",
      promptEn: "Which two results fill in the background within the removed-object region in a way that is most consistent with the surrounding scene and looks most realistic and natural?"
    },
    {
      id: "edge_seamlessness",
      number: "03",
      nameEn: "Edge Seamlessness",
      nameZh: "边界无缝性",
      promptZh: "哪两个结果在移除物体区域与周围边界处，衔接和融合更为自然，相对没有明显差别和伪影？",
      promptEn: "Which two results blend the removed-object region most naturally into its surroundings at the boundary, with the fewest visible mismatches or artifacts?"
    },
    {
      id: "non_target_preservation",
      number: "04",
      nameEn: "Non-Target Preservation",
      nameZh: "非目标内容保持性",
      promptZh: "哪两个结果最好地保留了目标之外的物体、场景和细节，且误删或无关改动最少？",
      promptEn: "Which two results best preserve non-target objects, scene content, and details, with the fewest unintended removals or unrelated changes?"
    },
    {
      id: "overall_performance",
      number: "05",
      nameEn: "Overall Performance",
      nameZh: "综合考虑",
      promptZh: "综合考虑，你认为哪两个结果最好地完成了移除物体的任务，相对更适合作为这个任务的最终输出？",
      promptEn: "Overall, which two results best accomplish the object-removal task and are most suitable as the final outputs?"
    }
  ],
  tasks: Array.from({ length: 10 }, (_value, index) => makePlaceholderTask(index + 1))
};
