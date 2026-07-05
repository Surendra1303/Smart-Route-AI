import { useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  routePreference?: string;
  ecoPoints?: number;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = () => {
      const token = localStorage.getItem("auth_token");
      const savedUser = localStorage.getItem("user");
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = (token: string, nextUser: AuthUser) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return {
    user,
    isAuthenticated: !!user && !!localStorage.getItem("auth_token"),
    isLoading,
    login,
    logout,
    setUser,
  };
}
