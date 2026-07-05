import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/features/authentication/hooks/use-auth";

export default function DashboardNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDashboardMenu, setShowDashboardMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const displayName = user?.fullName || user?.username || "Learner";

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="px-5 py-3 bg-white shadow-lg rounded-2xl hover:scale-105 transition"
          >
            ← Dashboard
          </button>
          <button
            onClick={() => navigate({ to: "/" })}
            className="text-3xl font-black text-[#171C4A] hover:opacity-80"
          >
            LearnFlow.
          </button>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-gray-600 font-medium">
          <div className="relative">
            <button
              onClick={() => setShowDashboardMenu(!showDashboardMenu)}
              className="hover:text-[#171C4A] flex items-center gap-1"
            >
              Dashboard
              <span className={`transition-transform ${showDashboardMenu ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>

            {showDashboardMenu && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-w-[220px]">
                <button
                  onClick={() => {
                    navigate({ to: "/skill-gap" });
                    setShowDashboardMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-[#F8F6E8] text-gray-700 font-medium transition"
                >
                  Skill Gap Dashboard
                </button>
              </div>
            )}
          </div>

          <button onClick={() => navigate({ to: "/resume" })} className="hover:text-[#171C4A]">
            Resume
          </button>

          <button onClick={() => navigate({ to: "/github" })} className="hover:text-[#171C4A]">
            GitHub
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 bg-[#F8F6E8] px-4 py-2 rounded-full hover:opacity-90"
            >
              <img
                src={
                  avatarError || !user?.avatarUrl
                    ? "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    : user.avatarUrl
                }
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
                onError={() => setAvatarError(true)}
              />
              <div className="text-left hidden sm:block">
                <p className="font-bold text-[#171C4A]">{displayName}</p>
                <p className="text-xs text-gray-500">@{user?.username}</p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-w-[180px]">
                <button
                  onClick={() => {
                    navigate({ to: "/dashboard" });
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-[#F8F6E8] text-gray-700"
                >
                  My Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-medium"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
