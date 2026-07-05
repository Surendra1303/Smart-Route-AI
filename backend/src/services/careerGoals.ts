export const CAREER_GOALS = [
  "AI / Machine Learning Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full-Stack Developer",
  "Cloud Engineer (AWS / Azure / GCP)",
  "DevOps / Platform Engineer",
  "Data Analyst / Data Engineer",
  "Cybersecurity Specialist",
  "Software Engineer (Product-Based Companies)",
] as const;

export type CareerGoal = (typeof CAREER_GOALS)[number];

export interface CareerGoalProfile {
  label: CareerGoal;
  coreSkills: string[];
  tools: string[];
  softSkills: string[];
  certifications: string[];
  typicalTimeline: string;
}

export const CAREER_GOAL_PROFILES: Record<CareerGoal, CareerGoalProfile> = {
  "AI / Machine Learning Engineer": {
    label: "AI / Machine Learning Engineer",
    coreSkills: [
      "Python",
      "Machine Learning",
      "Deep Learning",
      "Statistics",
      "Linear Algebra",
      "Data Preprocessing",
      "Model Evaluation",
    ],
    tools: ["TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "Jupyter", "MLflow", "CUDA"],
    softSkills: ["Research mindset", "Problem decomposition", "Experimentation", "Technical writing"],
    certifications: ["AWS ML Specialty", "Google Professional ML Engineer", "TensorFlow Developer Certificate"],
    typicalTimeline: "6-12 months",
  },
  "Frontend Engineer": {
    label: "Frontend Engineer",
    coreSkills: [
      "JavaScript",
      "TypeScript",
      "HTML",
      "CSS",
      "React",
      "Responsive Design",
      "Web Performance",
      "Accessibility",
    ],
    tools: ["React", "Next.js", "Tailwind CSS", "Vite", "Git", "Figma", "Jest", "Webpack"],
    softSkills: ["Attention to detail", "Design sense", "Collaboration", "Code review"],
    certifications: ["Meta Front-End Developer", "Google UX Design"],
    typicalTimeline: "3-6 months",
  },
  "Backend Engineer": {
    label: "Backend Engineer",
    coreSkills: [
      "Node.js",
      "REST APIs",
      "SQL",
      "System Design",
      "Authentication",
      "Database Design",
      "Performance Optimization",
    ],
    tools: ["Express", "PostgreSQL", "MongoDB", "Redis", "Docker", "Git", "Prisma", "Postman"],
    softSkills: ["Problem-solving", "Documentation", "Collaboration", "Code review"],
    certifications: ["AWS Developer Associate", "MongoDB Associate Developer"],
    typicalTimeline: "4-8 months",
  },
  "Full-Stack Developer": {
    label: "Full-Stack Developer",
    coreSkills: [
      "JavaScript",
      "TypeScript",
      "HTML",
      "CSS",
      "React",
      "Node.js",
      "REST APIs",
      "SQL",
      "System Design Basics",
    ],
    tools: ["Git", "Docker", "PostgreSQL", "MongoDB", "Express", "Next.js", "Redis"],
    softSkills: ["Collaboration", "Debugging", "Code review", "Agile delivery"],
    certifications: ["Meta Front-End Developer", "AWS Cloud Practitioner"],
    typicalTimeline: "4-8 months",
  },
  "Cloud Engineer (AWS / Azure / GCP)": {
    label: "Cloud Engineer (AWS / Azure / GCP)",
    coreSkills: [
      "Cloud Architecture",
      "Networking",
      "Linux",
      "Infrastructure as Code",
      "Security Best Practices",
      "Cost Optimization",
      "High Availability",
    ],
    tools: ["AWS", "Azure", "GCP", "Terraform", "CloudFormation", "IAM", "VPC", "Kubernetes"],
    softSkills: ["Incident response", "Documentation", "Stakeholder communication"],
    certifications: ["AWS Solutions Architect", "Azure Administrator", "Google Cloud Associate Engineer"],
    typicalTimeline: "5-9 months",
  },
  "DevOps / Platform Engineer": {
    label: "DevOps / Platform Engineer",
    coreSkills: [
      "CI/CD",
      "Linux",
      "Scripting",
      "Containerization",
      "Monitoring",
      "Infrastructure Automation",
      "Reliability Engineering",
    ],
    tools: ["Docker", "Kubernetes", "Jenkins", "GitHub Actions", "Terraform", "Prometheus", "Grafana", "Ansible"],
    softSkills: ["Automation mindset", "On-call readiness", "Cross-team collaboration"],
    certifications: ["CKA", "AWS DevOps Engineer", "HashiCorp Terraform Associate"],
    typicalTimeline: "4-8 months",
  },
  "Data Analyst / Data Engineer": {
    label: "Data Analyst / Data Engineer",
    coreSkills: [
      "SQL",
      "Data Modeling",
      "ETL/ELT",
      "Statistics",
      "Data Visualization",
      "Python",
      "Data Warehousing",
    ],
    tools: ["PostgreSQL", "Spark", "Airflow", "dbt", "Tableau", "Power BI", "Snowflake", "BigQuery"],
    softSkills: ["Business acumen", "Storytelling with data", "Attention to detail"],
    certifications: ["Google Data Analytics", "Databricks Data Engineer Associate"],
    typicalTimeline: "4-7 months",
  },
  "Cybersecurity Specialist": {
    label: "Cybersecurity Specialist",
    coreSkills: [
      "Network Security",
      "Threat Analysis",
      "Vulnerability Assessment",
      "Incident Response",
      "Cryptography Basics",
      "Security Policies",
      "Risk Management",
    ],
    tools: ["Wireshark", "Nmap", "SIEM", "Burp Suite", "Metasploit", "Splunk", "Kali Linux"],
    softSkills: ["Ethical judgment", "Attention to detail", "Clear reporting"],
    certifications: ["CompTIA Security+", "CEH", "CISSP (long-term)"],
    typicalTimeline: "6-10 months",
  },
  "Software Engineer (Product-Based Companies)": {
    label: "Software Engineer (Product-Based Companies)",
    coreSkills: [
      "Data Structures",
      "Algorithms",
      "System Design",
      "Object-Oriented Programming",
      "Testing",
      "API Design",
      "Performance Optimization",
    ],
    tools: ["Java", "Python", "C++", "Git", "Docker", "PostgreSQL", "Redis", "Kafka"],
    softSkills: ["Ownership", "Product thinking", "Communication", "Mentorship"],
    certifications: ["Not required — focus on DSA + system design + portfolio"],
    typicalTimeline: "6-12 months",
  },
};

function normalizeSkill(skill: string): string {
  return skill.toLowerCase().replace(/[^a-z0-9+#.]/g, "");
}

function skillMatches(userSkills: string[], target: string): boolean {
  const normalizedTarget = normalizeSkill(target);
  return userSkills.some((skill) => {
    const normalized = normalizeSkill(skill);
    return (
      normalized === normalizedTarget ||
      normalized.includes(normalizedTarget) ||
      normalizedTarget.includes(normalized)
    );
  });
}

export function getCareerProfile(careerGoal: string): CareerGoalProfile {
  const match = CAREER_GOALS.find((g) => g === careerGoal);
  if (match) return CAREER_GOAL_PROFILES[match];
  return CAREER_GOAL_PROFILES["Full-Stack Developer"];
}

export function categorizeSkillsForGoal(userSkills: string[], careerGoal: string) {
  const profile = getCareerProfile(careerGoal);
  const allRequired = [...profile.coreSkills, ...profile.tools];

  const strong: string[] = [];
  const improving: string[] = [];
  const weak: string[] = [];

  for (const skill of allRequired) {
    if (skillMatches(userSkills, skill)) {
      strong.push(skill);
    } else {
      weak.push(skill);
    }
  }

  const matchedSoft = profile.softSkills.filter((s) =>
    userSkills.some((us) => normalizeSkill(us).includes(normalizeSkill(s.split(" ")[0])))
  );

  return {
    profile,
    strong,
    improving: improving.length
      ? improving
      : userSkills
          .filter((s) => !strong.some((st) => skillMatches([s], st)))
          .slice(0, 4),
    weak,
    skillCategories: {
      core: {
        matched: profile.coreSkills.filter((s) => skillMatches(userSkills, s)),
        missing: profile.coreSkills.filter((s) => !skillMatches(userSkills, s)),
      },
      tools: {
        matched: profile.tools.filter((s) => skillMatches(userSkills, s)),
        missing: profile.tools.filter((s) => !skillMatches(userSkills, s)),
      },
      soft: {
        matched: matchedSoft,
        missing: profile.softSkills.filter((s) => !matchedSoft.includes(s)),
      },
    },
  };
}

export function computeMatchScore(userSkills: string[], careerGoal: string) {
  const profile = getCareerProfile(careerGoal);
  const matchedCore = profile.coreSkills.filter((s) => skillMatches(userSkills, s));
  const matchedTools = profile.tools.filter((s) => skillMatches(userSkills, s));

  const allRequired = [...profile.coreSkills, ...profile.tools];
  const strong = allRequired.filter((s) => skillMatches(userSkills, s));
  const weak = allRequired.filter((s) => !skillMatches(userSkills, s));

  const matchScore = Math.max(
    25,
    Math.min(95, Math.round((strong.length / (strong.length + weak.length + 1)) * 100))
  );

  return {
    matchScore,
    breakdown: {
      matchedCore,
      matchedTools,
    },
  };
}
