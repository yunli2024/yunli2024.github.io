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
  candidateLabels: ["A", "B", "C", "D", "E", "F"],
  criteria: [
    {
      id: "removal_completeness",
      number: "01",
      nameEn: "Removal Completeness",
      nameZh: "移除完整性",
      promptZh: "哪两个结果最完整地移除了红色线条所指示的目标物体及其相关视觉效果（如存在的阴影或倒影），且可见残留最少？",
      promptEn: "Which two results most completely remove the target object indicated by the red lines and its associated visual effects (e.g., shadows or reflections, if present), leaving the fewest visible remnants?"
    },
    {
      id: "background_plausibility",
      number: "02",
      nameEn: "Background Plausibility",
      nameZh: "背景补全合理性",
      promptZh: "哪两个结果在原目标物体所在区域补全的背景最符合周围场景，且看起来最真实、自然？",
      promptEn: "Which two results restore the background in the removed region most consistently with the surrounding scene and make it look most realistic and natural?"
    },
    {
      id: "edge_seamlessness",
      number: "03",
      nameEn: "Edge Seamlessness",
      nameZh: "边界无缝性",
      promptZh: "哪两个结果中，移除区域的边界与周围环境融合得最自然，且可见接缝或伪影最少？",
      promptEn: "Which two results blend the boundary of the removed region most naturally with its surroundings, with the fewest visible seams or artifacts?"
    },
    {
      id: "non_target_preservation",
      number: "04",
      nameEn: "Non-Target Preservation",
      nameZh: "非目标内容保持性",
      promptZh: "哪两个结果最好地保留了非目标物体、场景内容和细节，且非预期移除或无关改动最少？",
      promptEn: "Which two results best preserve non-target objects, scene content, and details, with the fewest unintended removals or unrelated changes?"
    },
    {
      id: "overall_performance",
      number: "05",
      nameEn: "Overall Performance",
      nameZh: "综合表现",
      promptZh: "综合而言，哪两个结果最成功地完成了物体移除任务，并最适合作为最终输出？",
      promptEn: "Overall, which two results most successfully accomplish the object-removal task and are most suitable as the final outputs?"
    }
  ],
  tasks: Array.from({ length: 10 }, (_value, index) => makePlaceholderTask(index + 1))
};
