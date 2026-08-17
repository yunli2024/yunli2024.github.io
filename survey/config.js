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
  questionnaireLabelZh: "打开腾讯问卷",
  questionnaireLabelEn: "Open Tencent Survey",
  practice: {
    id: "worked_removal_practice_v2",
    titleZh: "物体移除作答示例",
    titleEn: "Worked Object-Removal Example",
    instructionZh: "请先观察带有红色线条的输入图像，确定需要移除的目标，再比较三张候选结果并选出最好的两张。页面会根据你的选择说明判断依据。本示例仅用于理解任务，不计入正式研究结果。",
    instructionEn: "First inspect the input image with red lines to identify the target to remove. Then compare the three candidate results and select the best two. The page will explain the reasoning behind the answer. This example is for instruction only and is not included in the formal study results.",
    referenceHeadingZh: "示例输入",
    referenceHeadingEn: "Practice Input",
    referenceNoteZh: "红色线条标出的整把椅子是需要移除的目标。",
    referenceNoteEn: "The entire chair indicated by the red lines is the target to remove.",
    referenceAltZh: "带有红色线条标注的椅子输入图像",
    referenceAltEn: "Input image with red lines marking a chair",
    referenceSrc: "",
    resultsHeadingZh: "示例候选结果",
    resultsHeadingEn: "Practice Candidate Results",
    questionZh: "哪两个结果最好地移除了红色线条标出的椅子，同时保持场景自然？",
    questionEn: "Which two results best remove the chair indicated by the red lines while keeping the scene natural?",
    correctAnswers: ["A", "B"],
    correctExplanationZh: "本示例应选择 A 和 B。两者都移除了红线标出的椅子，并对椅子原来所在的区域进行了较为合理的背景补全。C 虽然画面本身清晰，但椅子仍然完整存在，没有完成指定的移除任务，因此不应选择 C。",
    correctExplanationEn: "In this example, select A and B. Both results remove the chair indicated by the red lines and fill the area it occupied reasonably well. Although C is visually clear, the chair remains intact, so it does not complete the requested removal task and should not be selected.",
    incorrectExplanationZh: "这个选择还不正确。C 中红线标出的椅子仍然完整存在，没有完成指定的移除任务。请重新选择两张真正移除了椅子、且场景较自然的结果。",
    incorrectExplanationEn: "This selection is not correct yet. In C, the chair marked by the red lines remains intact, so the requested removal has not been completed. Select the two results that actually remove the chair while keeping the scene reasonably natural.",
    transitionZh: "接下来的 10 个正式题目任务都与本示例相同：先根据红线确定需要移除的目标，再按照每项评价标准选出最好的 2 个结果。",
    transitionEn: "The next 10 formal tasks follow the same procedure: identify the target to remove from the red lines, then select the two best results under each evaluation criterion.",
    confirmationZh: "我已经确认：我理解应先判断红线指示的移除目标，再在正式题的每项标准下选择且只能选择 2 个最好的结果。",
    confirmationEn: "I confirm that I understand how to identify the removal target from the red lines and select exactly two best results for each criterion in the formal tasks.",
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
