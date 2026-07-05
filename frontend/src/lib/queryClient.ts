import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  profile: ["user", "profile"] as const,
  dashboard: ["user", "dashboard"] as const,
  skillGap: ["skill-gap", "latest"] as const,
  githubAnalysis: ["github", "analysis"] as const,
};
