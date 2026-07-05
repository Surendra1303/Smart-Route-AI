export const AUTH_TOKEN_KEY = "auth_token";
export const AUTH_USER_KEY = "auth_user";
export const CAREER_GOAL_KEY = "learnflow_career_goal";
export const RESUME_DATA_KEY = "learnflow_resume_data";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  careerGoal?: string | null;
  skills?: string[];
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuthStorage() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem("learnflow_skill_gap");
  localStorage.removeItem(RESUME_DATA_KEY);
  localStorage.removeItem("learnflow_assessment_result");
}
