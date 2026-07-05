import { useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/features/authentication/hooks/use-auth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6E8] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">⏳</div>
          <p className="text-gray-500 font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    localStorage.setItem("redirect_after_login", location.pathname);
    navigate({ to: "/login", replace: true });
    return null;
  }

  return <>{children}</>;
}
