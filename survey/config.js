/*
 * Survey prototype configuration.
 *
 * The five criteria below mirror the current paper draft and are placeholders
 * until the protocol is frozen. Change labels/prompts here; app.js and the page
 * layout do not need to be edited.
 *
 * IMPORTANT FOR THE FORMAL BUILD:
 * - use opaque asset paths such as assets/t01/a.mp4;
 * - never put method names or an A/B/C/D-to-method mapping in public files;
 * - replace the empty Tencent Survey URL before recruitment.
 */
window.VISUAL_SURVEY_CONFIG = {
  schemaVersion: 1,
  studyId: "visual-removal-preference-pilot-v0",
  assignmentManifestId: "demo-manifest-v0",
  mode: "DEMO_ONLY",
  questionnaireUrl: "",
  questionnaireLabel: "打开腾讯问卷",
  candidateLabels: ["Video A", "Video B", "Video C", "Video D"],
  criteria: [
    {
      id: "interaction_rationality",
      number: "01",
      nameEn: "Interaction Rationality",
      nameZh: "交互合理性",
      prompt: "哪个候选更合理地理解并执行了标注所表达的删除意图？"
    },
    {
      id: "transfer_quality",
      number: "02",
      nameEn: "Transfer Quality",
      nameZh: "转换质量",
      prompt: "哪个候选从输入场景到目标结果的转换更清晰、完整且自然？"
    },
    {
      id: "physical_authenticity",
      number: "03",
      nameEn: "Physical Authenticity",
      nameZh: "物理真实性",
      prompt: "哪个候选的结构、光照、纹理与物理关系看起来更可信？"
    },
    {
      id: "temporal_consistency",
      number: "04",
      nameEn: "Temporal Consistency",
      nameZh: "时间一致性",
      prompt: "哪个候选在整个变化过程中更连续，且更少出现闪烁或突变？"
    },
    {
      id: "semantic_similarity",
      number: "05",
      nameEn: "Semantic Similarity",
      nameZh: "语义一致性",
      prompt: "在完成删除任务后，哪个候选更好地保持了其余场景的语义内容？"
    }
  ],
  tasks: [
    {
      id: "demo_room_01",
      label: "Study item 01",
      context: "Interior scene · sparse scribble",
      instruction: "Remove the object indicated by the red scribble and restore a plausible background.",
      instructionZh: "删除红色笔画所指向的物体，并恢复可信的背景。",
      scene: "room",
      candidates: [
        { token: "d01-c1", src: "", variant: "v1" },
        { token: "d01-c2", src: "", variant: "v2" },
        { token: "d01-c3", src: "", variant: "v3" },
        { token: "d01-c4", src: "", variant: "v4" }
      ]
    },
    {
      id: "demo_street_02",
      label: "Study item 02",
      context: "Outdoor scene · imperfect scribble",
      instruction: "Remove the marked foreground object and its associated effects while preserving unrelated nearby structures.",
      instructionZh: "删除被标记的前景物体及其关联影响，同时保留无关的附近结构。",
      scene: "street",
      candidates: [
        { token: "d02-c1", src: "", variant: "v3" },
        { token: "d02-c2", src: "", variant: "v1" },
        { token: "d02-c3", src: "", variant: "v4" },
        { token: "d02-c4", src: "", variant: "v2" }
      ]
    }
  ]
};
