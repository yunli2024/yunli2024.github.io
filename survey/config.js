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
      id: "interaction_rationality",
      number: "01",
      nameEn: "Interaction Rationality",
      nameZh: "交互合理性",
      promptZh: "哪两个结果最合理地遵循了目标移除指令，并正确处理了目标与周围区域的关系？",
      promptEn: "Which two results follow the removal instruction most appropriately and handle the relationship between the target and its surroundings most reasonably?"
    },
    {
      id: "transfer_quality",
      number: "02",
      nameEn: "Transfer Quality",
      nameZh: "转换质量",
      promptZh: "哪两个结果最完整地移除了目标，并最自然地补全了被移除区域？",
      promptEn: "Which two results remove the target most completely and reconstruct the removed region most naturally?"
    },
    {
      id: "physical_authenticity",
      number: "03",
      nameEn: "Physical Authenticity",
      nameZh: "物理真实性",
      promptZh: "哪两个结果在结构、光照、纹理和空间关系上看起来最真实可信？",
      promptEn: "Which two results look most physically plausible in terms of structure, lighting, texture, and spatial relationships?"
    },
    {
      id: "temporal_consistency",
      number: "04",
      nameEn: "Temporal Consistency",
      nameZh: "时间一致性",
      promptZh: "哪两个结果在整个移除过程中最连贯稳定，且最少出现闪烁或突变？",
      promptEn: "Which two results remain most coherent and stable throughout the removal process, with the least flicker or abrupt change?"
    },
    {
      id: "semantic_similarity",
      number: "05",
      nameEn: "Semantic Similarity",
      nameZh: "语义一致性",
      promptZh: "完成目标移除后，哪两个结果最完整地保留了未编辑区域的物体、布局与语义内容？",
      promptEn: "After removing the target, which two results best preserve the objects, layout, and semantic content of the unedited regions?"
    }
  ],
  tasks: Array.from({ length: 10 }, (_value, index) => makePlaceholderTask(index + 1))
};
