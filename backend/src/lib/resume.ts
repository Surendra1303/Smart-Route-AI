const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export function validateResumePdf(
  file: string,
  mimeType?: string,
  fileName?: string
): string | null {
  const name = (fileName || "").toLowerCase();
  const mime = (mimeType || "").toLowerCase();

  if (!name.endsWith(".pdf")) {
    return "Only PDF resumes are accepted. Please upload a .pdf file.";
  }

  if (mime && mime !== "application/pdf") {
    return "Only PDF resumes are accepted.";
  }

  const base64Payload = file.includes(",") ? file.split(",")[1] : file;
  const approxBytes = Math.floor((base64Payload.length * 3) / 4);
  if (approxBytes > MAX_RESUME_BYTES) {
    return "Resume must be 10 MB or smaller.";
  }

  return null;
}

export function extractSkillGapDetails(result: Record<string, unknown>) {
  return {
    priorityGaps: result.priorityGaps || [],
    skillCategories: result.skillCategories || null,
    scoreBreakdown: result.scoreBreakdown || null,
    timeToGoal: result.timeToGoal || null,
    recommendedCertifications: result.recommendedCertifications || [],
    projectIdeas: result.projectIdeas || [],
  };
}
