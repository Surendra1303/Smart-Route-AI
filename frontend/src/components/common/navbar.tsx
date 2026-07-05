import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/features/authentication/hooks/use-auth";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <header className="flex justify-between items-center px-12 py-5 bg-slate-950/80 border-b border-slate-900 backdrop-blur-md sticky top-0 z-50">
      <Link to="/" className="font-black text-2xl text-emerald-400 tracking-wider flex items-center gap-2">
        <span>⚡</span> SMARTROUTE
      </Link>

      <nav className="hidden md:flex gap-12 text-slate-400 font-semibold text-sm">
        <span className="hover:text-emerald-400 cursor-pointer transition-colors">3D HUD Maps</span>
        <span className="hover:text-emerald-400 cursor-pointer transition-colors">OBD-II Diagnostics</span>
        <span className="hover:text-emerald-400 cursor-pointer transition-colors">AI Co-pilot</span>
        <span className="hover:text-emerald-400 cursor-pointer transition-colors">SOS Assured</span>
      </nav>

      <button
        onClick={() => navigate({ to: isAuthenticated ? "/dashboard" : "/login" })}
        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-full font-bold transition shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 text-sm"
      >
        {isAuthenticated ? "Enter Cockpit" : "Driver Login"}
      </button>
    </header>
  );
}
