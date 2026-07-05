import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { loginGuest } from "@/services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");

    try {
      const data = await loginGuest(email, name);
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message || "Login failed. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* LEFT SIDE - Futuristic automotive screen preview */}
      <div
        className="hidden lg:flex w-1/2 bg-cover bg-center items-center justify-center relative border-r border-slate-800"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1600&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
        <div className="relative z-10 max-w-xl px-10 text-slate-100">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="text-4xl">⚡</span>
            <span className="text-3xl font-black tracking-wider bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              SMARTROUTE
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold leading-tight tracking-tight"
          >
            The Ultimate Automotive Intelligence Cockpit
          </motion.h1>
          <p className="mt-4 text-slate-400 text-lg">
            Experience next-generation road safety, live navigation overlays, OBD-II vehicle diagnostics, and an AI-powered travel co-pilot.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { icon: "🌐", title: "Mapbox 3D HUD", desc: "Interactive satellite, terrain, and weather overlays." },
              { icon: "📈", title: "Live Telemetry", desc: "OBD-II vehicle diagnostics and eco driving scores." },
              { icon: "🚨", title: "Smart Alerts", desc: "Crowdsourced road hazards, accidents, and speed checks." },
              { icon: "🤖", title: "AI Assistant", desc: "Natural-language route planning and travel memory." },
            ].map((card) => (
              <motion.div
                key={card.title}
                whileHover={{ y: -4 }}
                className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800"
              >
                <div className="text-3xl">{card.icon}</div>
                <h3 className="mt-2 font-bold text-slate-200">{card.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Sign In Control */}
      <div className="flex-1 flex items-center justify-center px-6 relative bg-slate-950">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-[32px] p-10 backdrop-blur-xl relative z-10"
        >
          <div className="text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-white">Pilot Sign In</h2>
            <p className="mt-2 text-slate-400 text-sm">Enter vehicle controls via guest token access</p>
          </div>

          <form onSubmit={handleGuestSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Driver Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="driver@smartroute.ai"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Driver Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Elon Rivian"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? "Initializing Systems..." : "Initialize Navigation HUD"}
            </button>
          </form>
          
          <div className="mt-6 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-6">
            <span>Systems Status: Nominal</span>
            <span>Firmware: v2.4.0</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
