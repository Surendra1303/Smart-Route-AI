import {
  CAREER_GOALS,
  categorizeSkillsForGoal,
  getCareerProfile,
} from "./careerGoals";

export interface ResumeAnalysisResult {
  skills: string[];
  softSkills: string[];
  experience: { role: string; company: string; duration: string }[];
  education: { degree: string; school: string; year: string }[];
  summary: string;
  resumeScore: number;
  strengths: string[];
  improvements: string[];
  atsTips: string[];
  careerFit: { score: number; summary: string };
}

export interface SkillGapAnalysisResult {
  matchScore: number;
  strong: string[];
  improving: string[];
  weak: string[];
  priorityGaps: { skill: string; importance: "high" | "medium" | "low"; reason: string }[];
  skillCategories: {
    core: { matched: string[]; missing: string[] };
    tools: { matched: string[]; missing: string[] };
    soft: { matched: string[]; missing: string[] };
  };
  roadmap: { step: string; details: string; duration: string }[];
  coach: string;
  timeToGoal: string;
  recommendedCertifications: string[];
  projectIdeas: string[];
  assessment: { question: string; options: string[]; answer: string }[];
}

export function buildResumeAnalysisPrompt(careerGoal: string): string {
  const profile = getCareerProfile(careerGoal);
  return `You are an expert AI Resume Analyzer, ATS specialist, and technical recruiter with 10+ years of experience at top tech companies (Google, Meta, Amazon, etc.).

Analyze the uploaded resume for a candidate targeting: "${careerGoal}".

Key skills expected for this role:
- Core: ${profile.coreSkills.join(", ")}
- Tools/Platforms: ${profile.tools.join(", ")}

Perform a RIGOROUS analysis following industry standards:

**ATS & Keyword Analysis:**
- Check for exact keyword matches with job description
- Verify keyword density (should be 2-3% for key terms)
- Identify missing critical keywords
- Check for proper section headings (Experience, Education, Skills, Projects)
- Validate formatting (no tables, graphics, or complex layouts)

**Content Quality Assessment:**
- Look for quantifiable achievements (numbers, percentages, impact metrics)
- Check for action verbs and result-oriented language
- Verify experience depth (should show progression and responsibility)
- Assess education relevance and timing
- Evaluate technical skill specificity (not just "programming" but "React, Node.js")

**Scoring Criteria (STRICT):**
- resumeScore: 0-100 based on:
  * 30%: Keyword match with role requirements
  * 25%: Quantifiable achievements and impact
  * 20%: Experience relevance and progression
  * 15%: ATS formatting compliance
  * 10%: Education and certifications alignment
- careerFit.score: 0-100 based on skill overlap and experience match

**Strict Scoring Rules:**
- Below 50: Major gaps, unlikely to pass ATS
- 50-65: Basic qualification, needs significant improvement
- 66-75: Good candidate, needs refinement
- 76-85: Strong candidate, competitive
- 86-95: Excellent candidate, high interview potential
- 96-100: Exceptional, rare to achieve

Extract ALL technical skills, soft skills, experience, and education from the resume.
Evaluate resume quality, ATS compatibility, and fit for the target role.

Respond strictly with a JSON object in this format:
{
  "skills": ["Technical skill 1", ...],
  "softSkills": ["Communication", ...],
  "experience": [{"role": "Role Title", "company": "Company", "duration": "Jan 2023 - Present"}],
  "education": [{"degree": "Degree", "school": "School", "year": "2024"}],
  "summary": "2-3 sentence professional summary of the candidate",
  "resumeScore": 65,
  "strengths": ["Specific resume strength 1", ...],
  "improvements": ["Actionable resume improvement 1", ...],
  "atsTips": ["ATS optimization tip 1", ...],
  "careerFit": {
    "score": 58,
    "summary": "How well this resume aligns with ${careerGoal} and what stands out"
  }
}

Rules:
- resumeScore and careerFit.score must be integers 0-100
- Be STRICT in scoring - most resumes should score 50-75
- List at least 3 strengths, 3 improvements, and 3 atsTips
- Be specific to the actual resume content, not generic
- If resume lacks quantifiable achievements, score below 60
- If missing critical keywords, score below 55
- If poor formatting, score below 50
- Only score above 80 for exceptional resumes with strong metrics and perfect keyword match`;
}

export function buildSkillGapAnalysisPrompt(
  skills: string[],
  careerGoal: string,
  experience?: { role: string; company: string; duration: string }[],
  education?: { degree: string; school: string; year: string }[]
): string {
  const profile = getCareerProfile(careerGoal);
  const context = {
    skills,
    careerGoal,
    experience: experience || [],
    education: education || [],
    roleRequirements: {
      core: profile.coreSkills,
      tools: profile.tools,
      soft: profile.softSkills,
      certifications: profile.certifications,
    },
  };

  return `You are an expert AI Skill Gap Analyzer and Career Coach.

Compare the candidate profile below against the target role "${careerGoal}".

Candidate Profile:
${JSON.stringify(context, null, 2)}

Perform a rigorous skill gap analysis. Categorize skills as strong (proficient/matches role), improving (partial exposure), or weak (missing/critical gap).

Respond strictly with a JSON object:
{
  "matchScore": 75,
  "strong": ["Skill1", ...],
  "improving": ["Skill2", ...],
  "weak": ["Skill3", ...],
  "priorityGaps": [
    {"skill": "Kubernetes", "importance": "high", "reason": "Core requirement for DevOps roles"}
  ],
  "skillCategories": {
    "core": {"matched": ["..."], "missing": ["..."]},
    "tools": {"matched": ["..."], "missing": ["..."]},
    "soft": {"matched": ["..."], "missing": ["..."]}
  },
  "roadmap": [
    {"step": "Phase title", "details": "Specific courses, projects, and practice", "duration": "2-3 weeks"}
  ],
  "coach": "Personalized 3-4 sentence coaching paragraph referencing their background",
  "timeToGoal": "${profile.typicalTimeline}",
  "recommendedCertifications": ["Cert 1", ...],
  "projectIdeas": ["Build X to demonstrate Y", ...],
  "assessment": [
    {"question": "Role-specific question?", "options": ["A", "B", "C", "D"], "answer": "Correct option"}
  ]
}

Rules:
- matchScore: integer 0-100 based on role fit
- priorityGaps: 4-6 items ranked by importance (high/medium/low)
- roadmap: 4-6 phased steps, ordered from foundations to advanced
- assessment: exactly 5 multiple-choice questions specific to ${careerGoal}
- Be specific to the candidate's actual skills and experience`;
}

export function buildMockResumeAnalysis(careerGoal: string): ResumeAnalysisResult {
  const profile = getCareerProfile(careerGoal);
  const baseSkills = ["JavaScript", "Python", "Git", "SQL", "HTML", "CSS"];
  const matched = profile.coreSkills.filter((s) =>
    baseSkills.some((b) => b.toLowerCase().includes(s.toLowerCase().split(" ")[0]))
  );

  return {
    skills: [...new Set([...baseSkills, ...matched.slice(0, 3)])],
    softSkills: ["Communication", "Problem Solving", "Team Collaboration"],
    experience: [
      { role: "Software Development Intern", company: "TechCorp", duration: "6 Months" },
      { role: "Student Developer", company: "University Lab", duration: "1 Year" },
    ],
    education: [{ degree: "B.S. Computer Science", school: "State University", year: "2025" }],
    summary:
      "Motivated computer science graduate with hands-on project experience in web development and programming fundamentals, seeking to grow into a professional engineering role.",
    resumeScore: 72,
    strengths: [
      "Clear project and internship experience",
      "Solid foundation in programming fundamentals",
      "Demonstrates continuous learning through personal projects",
    ],
    improvements: [
      `Add quantifiable impact metrics (e.g., performance gains, users served)`,
      `Highlight ${profile.tools.slice(0, 2).join(" and ")} experience if applicable`,
      "Tailor summary to explicitly target " + careerGoal,
      "Include links to GitHub portfolio and live project demos",
    ],
    atsTips: [
      "Use standard section headings: Experience, Education, Skills, Projects",
      `Include role keywords: ${profile.coreSkills.slice(0, 4).join(", ")}`,
      "Avoid graphics/tables that ATS parsers cannot read",
      "List skills in a dedicated section matching job description terminology",
    ],
    careerFit: {
      score: Math.max(35, 55 + matched.length * 5),
      summary: `Your profile shows foundational engineering skills with room to grow into ${careerGoal}. Focus on ${profile.coreSkills.slice(0, 2).join(" and ")} to strengthen alignment.`,
    },
  };
}

export function buildMockSkillGap(
  skills: string[],
  careerGoal: string,
  experience?: { role: string; company: string; duration: string }[],
  education?: any[]
): SkillGapAnalysisResult {
  const { profile, strong, improving, weak, skillCategories } = categorizeSkillsForGoal(
    skills,
    careerGoal
  );

  const priorityGaps = weak.slice(0, 5).map((skill, i) => ({
    skill,
    importance: (i < 2 ? "high" : i < 4 ? "medium" : "low") as "high" | "medium" | "low",
    reason: `Required ${i < 2 ? "core" : "supporting"} skill for ${careerGoal}`,
  }));

  const matchScore = Math.max(
    25,
    Math.min(95, Math.round((strong.length / (strong.length + weak.length + 1)) * 100))
  );

  const expNote =
    experience && experience.length > 0
      ? ` Your ${experience[0].role} experience is a good foundation.`
      : "";

  const roadmapsByGoal: Record<string, { step: string; details: string; duration: string }[]> = {
    "AI / Machine Learning Engineer": [
      { step: "Math & Python Foundations", details: "Linear algebra, statistics, NumPy, Pandas", duration: "3 weeks" },
      { step: "ML Fundamentals", details: "Scikit-learn, supervised/unsupervised learning, model evaluation", duration: "4 weeks" },
      { step: "Deep Learning", details: "Neural networks with PyTorch or TensorFlow", duration: "4 weeks" },
      { step: "MLOps & Deployment", details: "Model serving, MLflow, cloud deployment", duration: "3 weeks" },
      { step: "Capstone Project", details: "End-to-end ML project with dataset, training, and deployment", duration: "4 weeks" },
    ],
    "Cloud Engineer (AWS / Azure / GCP)": [
      { step: "Cloud Fundamentals", details: "IAM, VPC, compute, storage across AWS/Azure/GCP", duration: "3 weeks" },
      { step: "Infrastructure as Code", details: "Terraform and CloudFormation templates", duration: "3 weeks" },
      { step: "Networking & Security", details: "Load balancers, DNS, security groups, encryption", duration: "3 weeks" },
      { step: "Containers on Cloud", details: "ECS/EKS, Azure AKS, GKE basics", duration: "3 weeks" },
      { step: "Certification Prep", details: "Practice exams and hands-on labs", duration: "4 weeks" },
    ],
    "Cybersecurity Specialist": [
      { step: "Security Foundations", details: "Networking, OS hardening, security policies", duration: "3 weeks" },
      { step: "Threat & Vulnerability", details: "Nmap, vulnerability scanning, risk assessment", duration: "3 weeks" },
      { step: "Defensive Operations", details: "SIEM, log analysis, incident response playbooks", duration: "4 weeks" },
      { step: "Offensive Basics (Ethical)", details: "Burp Suite, penetration testing methodology", duration: "3 weeks" },
      { step: "Certification & Labs", details: "Security+ study plan with TryHackMe/HTB labs", duration: "5 weeks" },
    ],
  };

  const defaultRoadmap = [
    { step: "Strengthen Core Skills", details: `Master ${profile.coreSkills.slice(0, 2).join(" and ")}`, duration: "2-3 weeks" },
    { step: "Learn Essential Tools", details: `Hands-on with ${profile.tools.slice(0, 3).join(", ")}`, duration: "3 weeks" },
    { step: "Build Portfolio Project", details: `Create a project demonstrating ${careerGoal} skills`, duration: "3-4 weeks" },
    { step: "Practice & Interview Prep", details: "Mock interviews, coding challenges, system design basics", duration: "3 weeks" },
    { step: "Apply & Iterate", details: "Target internships/junior roles, refine resume based on feedback", duration: "Ongoing" },
  ];

  return {
    matchScore,
    strong: strong.length ? strong : skills.slice(0, 4),
    improving: improving.length ? improving : [],
    weak: weak.length ? weak : profile.coreSkills.slice(0, 4),
    priorityGaps,
    skillCategories,
    roadmap: roadmapsByGoal[careerGoal] || defaultRoadmap,
    coach: `You're on a solid path toward ${careerGoal}.${expNote} Your strongest areas include ${(strong.length ? strong : skills).slice(0, 3).join(", ") || "foundational programming"}. Prioritize closing gaps in ${weak.slice(0, 3).join(", ") || "role-specific tools"} through focused projects and structured learning over the next ${profile.typicalTimeline}.`,
    timeToGoal: profile.typicalTimeline,
    recommendedCertifications: profile.certifications.slice(0, 3),
    projectIdeas: [
      `Build a portfolio project showcasing ${profile.tools[0]} and ${profile.coreSkills[0]}`,
      `Contribute to open-source projects in the ${careerGoal.split(" ")[0]} domain`,
      `Recreate a real-world workflow using ${profile.tools.slice(0, 2).join(" + ")}`,
    ],
    assessment: buildMockAssessment(careerGoal),
  };
}

function buildMockAssessment(careerGoal: string) {
  const assessments: Record<string, { question: string; options: string[]; answer: string }[]> = {
    "AI / Machine Learning Engineer": [
      { question: "Which metric is best for imbalanced classification?", options: ["Accuracy", "F1 Score", "MSE", "R²"], answer: "F1 Score" },
      { question: "What does gradient descent optimize?", options: ["Loss function", "Learning rate only", "Dataset size", "Batch count"], answer: "Loss function" },
      { question: "Which library is commonly used for deep learning?", options: ["Pandas", "PyTorch", "Express", "Terraform"], answer: "PyTorch" },
      { question: "What is overfitting?", options: ["Model performs well on training but poorly on new data", "Model is too simple", "Data is too large", "Learning rate is zero"], answer: "Model performs well on training but poorly on new data" },
      { question: "What is the purpose of cross-validation?", options: ["Reduce training time", "Estimate model generalization", "Increase dataset size", "Remove outliers"], answer: "Estimate model generalization" },
    ],
    "Cloud Engineer (AWS / Azure / GCP)": [
      { question: "What does IAM control in cloud platforms?", options: ["Identity and access permissions", "Network bandwidth", "CPU allocation", "Storage encryption keys only"], answer: "Identity and access permissions" },
      { question: "What is Infrastructure as Code?", options: ["Managing infra through declarative config files", "Writing app code in the cloud", "Manual server setup", "Cloud billing optimization"], answer: "Managing infra through declarative config files" },
      { question: "Which AWS service provides object storage?", options: ["EC2", "S3", "RDS", "Lambda"], answer: "S3" },
      { question: "What is a VPC?", options: ["Virtual Private Cloud network", "Visual Processing Core", "Verified Payment Channel", "Variable Performance Compute"], answer: "Virtual Private Cloud network" },
      { question: "Terraform is primarily used for?", options: ["Provisioning infrastructure", "Container orchestration", "Log monitoring", "Code compilation"], answer: "Provisioning infrastructure" },
    ],
    "Cybersecurity Specialist": [
      { question: "What does SIEM stand for?", options: ["Security Information and Event Management", "System Integration Error Monitor", "Secure Internet Exchange Module", "Software Integrity Evaluation Method"], answer: "Security Information and Event Management" },
      { question: "What is a common first step in incident response?", options: ["Identification", "Public disclosure", "System wipe", "Ignore alerts"], answer: "Identification" },
      { question: "Phishing attacks primarily target?", options: ["Human trust via deceptive messages", "Hardware failures", "Power outages", "DNS caching"], answer: "Human trust via deceptive messages" },
      { question: "What does HTTPS provide?", options: ["Encrypted communication", "Faster page loads only", "Unlimited bandwidth", "Automatic backups"], answer: "Encrypted communication" },
      { question: "A vulnerability scan is used to?", options: ["Discover security weaknesses", "Encrypt databases", "Deploy applications", "Monitor CPU usage"], answer: "Discover security weaknesses" },
    ],
  };

  return (
    assessments[careerGoal] || [
      { question: "What is the purpose of version control?", options: ["Track code changes collaboratively", "Compile code faster", "Design UI layouts", "Host websites"], answer: "Track code changes collaboratively" },
      { question: "Which HTTP method is idempotent?", options: ["GET", "POST", "PATCH", "CONNECT"], answer: "GET" },
      { question: "What does API stand for?", options: ["Application Programming Interface", "Automated Process Integration", "Applied Protocol Instance", "Application Performance Index"], answer: "Application Programming Interface" },
      { question: "Docker is primarily used for?", options: ["Containerization", "Spreadsheet analysis", "Network routing", "Image editing"], answer: "Containerization" },
      { question: "What is unit testing?", options: ["Testing individual components in isolation", "Testing entire production systems only", "Manual UI review", "Load testing at scale"], answer: "Testing individual components in isolation" },
    ]
  );
}

export { CAREER_GOALS };

export function applyResumeScores(result: any, careerGoal: string): ResumeAnalysisResult {
  const skills = Array.isArray(result?.skills) ? result.skills : [];
  const softSkills = Array.isArray(result?.softSkills) ? result.softSkills : [];
  const experience = Array.isArray(result?.experience) ? result.experience : [];
  const education = Array.isArray(result?.education) ? result.education : [];
  const summary = typeof result?.summary === "string" ? result.summary : "";
  
  const strengths = Array.isArray(result?.strengths) ? result.strengths : [];
  const improvements = Array.isArray(result?.improvements) ? result.improvements : [];
  const atsTips = Array.isArray(result?.atsTips) ? result.atsTips : [];
  
  const profile = getCareerProfile(careerGoal);
  const matchedCore = profile.coreSkills.filter((s) =>
    skills.some((us: string) => us.toLowerCase().includes(s.toLowerCase().split(" ")[0]))
  );
  
  const rawScore = typeof result?.resumeScore === "number" ? result.resumeScore : 70;
  const careerFitScore = result?.careerFit && typeof result.careerFit.score === "number" 
    ? result.careerFit.score 
    : Math.max(35, 55 + matchedCore.length * 5);
    
  const careerFitSummary = result?.careerFit && typeof result.careerFit.summary === "string"
    ? result.careerFit.summary
    : `Your profile has a fit score of ${careerFitScore} for ${careerGoal}.`;

  return {
    skills,
    softSkills,
    experience,
    education,
    summary,
    resumeScore: rawScore,
    strengths,
    improvements,
    atsTips,
    careerFit: {
      score: careerFitScore,
      summary: careerFitSummary
    }
  };
}

export function applySkillGapScores(
  result: any,
  skills: string[],
  careerGoal: string,
  experience?: any[],
  education?: any[]
): SkillGapAnalysisResult {
  const { profile, strong, improving, weak, skillCategories } = categorizeSkillsForGoal(
    skills,
    careerGoal
  );

  const finalStrong = Array.isArray(result?.strong) ? (result.strong as string[]) : (strong.length ? strong : skills.slice(0, 4));
  const finalImproving = Array.isArray(result?.improving) ? (result.improving as string[]) : (improving.length ? improving : []);
  const finalWeak = Array.isArray(result?.weak) ? (result.weak as string[]) : (weak.length ? weak : profile.coreSkills.slice(0, 4));

  const rawScore = typeof result?.matchScore === "number" ? result.matchScore : null;
  const calculatedScore = Math.max(
    25,
    Math.min(95, Math.round((strong.length / (strong.length + weak.length + 1)) * 100))
  );
  const matchScore = rawScore !== null ? rawScore : calculatedScore;

  const defaultPriorityGaps = finalWeak.slice(0, 5).map((skill: string, i: number) => ({
    skill,
    importance: (i < 2 ? "high" : i < 4 ? "medium" : "low") as "high" | "medium" | "low",
    reason: `Required ${i < 2 ? "core" : "supporting"} skill for ${careerGoal}`,
  }));
  const priorityGaps = Array.isArray(result?.priorityGaps) ? result.priorityGaps : defaultPriorityGaps;

  const finalSkillCategories = result?.skillCategories || skillCategories;

  const roadmapsByGoal: Record<string, { step: string; details: string; duration: string }[]> = {
    "AI / Machine Learning Engineer": [
      { step: "Math & Python Foundations", details: "Linear algebra, statistics, NumPy, Pandas", duration: "3 weeks" },
      { step: "ML Fundamentals", details: "Scikit-learn, supervised/unsupervised learning, model evaluation", duration: "4 weeks" },
      { step: "Deep Learning", details: "Neural networks with PyTorch or TensorFlow", duration: "4 weeks" },
      { step: "MLOps & Deployment", details: "Model serving, MLflow, cloud deployment", duration: "3 weeks" },
      { step: "Capstone Project", details: "End-to-end ML project with dataset, training, and deployment", duration: "4 weeks" },
    ],
    "Cloud Engineer (AWS / Azure / GCP)": [
      { step: "Cloud Fundamentals", details: "IAM, VPC, compute, storage across AWS/Azure/GCP", duration: "3 weeks" },
      { step: "Infrastructure as Code", details: "Terraform and CloudFormation templates", duration: "3 weeks" },
      { step: "Networking & Security", details: "Load balancers, DNS, security groups, encryption", duration: "3 weeks" },
      { step: "Containers on Cloud", details: "ECS/EKS, Azure AKS, GKE basics", duration: "3 weeks" },
      { step: "Certification Prep", details: "Practice exams and hands-on labs", duration: "4 weeks" },
    ],
    "Cybersecurity Specialist": [
      { step: "Security Foundations", details: "Networking, OS hardening, security policies", duration: "3 weeks" },
      { step: "Threat & Vulnerability", details: "Nmap, vulnerability scanning, risk assessment", duration: "3 weeks" },
      { step: "Defensive Operations", details: "SIEM, log analysis, incident response playbooks", duration: "4 weeks" },
      { step: "Offensive Basics (Ethical)", details: "Burp Suite, penetration testing methodology", duration: "3 weeks" },
      { step: "Certification & Labs", details: "Security+ study plan with TryHackMe/HTB labs", duration: "5 weeks" },
    ],
  };

  const defaultRoadmap = [
    { step: "Strengthen Core Skills", details: `Master ${profile.coreSkills.slice(0, 2).join(" and ")}`, duration: "2-3 weeks" },
    { step: "Learn Essential Tools", details: `Hands-on with ${profile.tools.slice(0, 3).join(", ")}`, duration: "3 weeks" },
    { step: "Build Portfolio Project", details: `Create a project demonstrating ${careerGoal} skills`, duration: "3-4 weeks" },
    { step: "Practice & Interview Prep", details: "Mock interviews, coding challenges, system design basics", duration: "3 weeks" },
    { step: "Apply & Iterate", details: "Target internships/junior roles, refine resume based on feedback", duration: "Ongoing" },
  ];

  const roadmap = Array.isArray(result?.roadmap) ? result.roadmap : (roadmapsByGoal[careerGoal] || defaultRoadmap);

  const expNote = experience && experience.length > 0 ? ` Your ${experience[0].role} experience is a good foundation.` : "";
  const coach = typeof result?.coach === "string" ? result.coach : `You're on a solid path toward ${careerGoal}.${expNote} Your strongest areas include ${finalStrong.slice(0, 3).join(", ") || "foundational programming"}. Prioritize closing gaps in ${finalWeak.slice(0, 3).join(", ") || "role-specific tools"} through focused projects and structured learning over the next ${profile.typicalTimeline}.`;

  const timeToGoal = typeof result?.timeToGoal === "string" ? result.timeToGoal : profile.typicalTimeline;
  const recommendedCertifications = Array.isArray(result?.recommendedCertifications) ? result.recommendedCertifications : profile.certifications.slice(0, 3);
  const projectIdeas = Array.isArray(result?.projectIdeas) ? result.projectIdeas : [
    `Build a portfolio project showcasing ${profile.tools[0]} and ${profile.coreSkills[0]}`,
    `Contribute to open-source projects in the ${careerGoal.split(" ")[0]} domain`,
    `Recreate a real-world workflow using ${profile.tools.slice(0, 2).join(" + ")}`,
  ];
  
  const assessment = Array.isArray(result?.assessment) ? result.assessment : buildMockAssessment(careerGoal);

  return {
    matchScore,
    strong: finalStrong,
    improving: finalImproving,
    weak: finalWeak,
    priorityGaps,
    skillCategories: finalSkillCategories,
    roadmap,
    coach,
    timeToGoal,
    recommendedCertifications,
    projectIdeas,
    assessment,
  };
}

