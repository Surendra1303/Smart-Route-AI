import { redirect } from "@tanstack/react-router";

export function requireAuth() {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    throw redirect({ to: "/login" });
  }
}
