import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/features/authentication/hooks/use-auth";
import FloatingCard from "./floating-card";

export default function Hero() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    navigate({ to: isAuthenticated ? "/dashboard" : "/login" });
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 flex items-center">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#064e3b_0%,#020617_80%)] -z-10 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full">
        {/* Floating Cockpit Feature Previews */}
        <FloatingCard
          badge="3D MAPS"
          title="Mapbox HUD Engine"
          subtitle="Real-time 3D hybrid overlays, traffic radar, and terrain contours."
          className="bg-slate-900/50 border border-emerald-500/20 backdrop-blur-2xl hover:border-emerald-500/50 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] text-slate-200 w-[280px] left-10 top-24 hidden 2xl:block"
        />

        <FloatingCard
          badge="DIAGNOSTICS"
          title="OBD-II Real-time"
          subtitle="Tachometer gauges, battery pack stats, tire pressure monitors."
          className="bg-slate-900/50 border border-emerald-500/20 backdrop-blur-2xl hover:border-emerald-500/50 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] text-slate-200 w-[280px] right-10 top-24 hidden 2xl:block"
        />

        <FloatingCard
          badge="AI ASSISTANT"
          title="Co-pilot Chatbot"
          subtitle="Interactive routing planning, rest stops, and weather alerts."
          className="bg-slate-900/50 border border-emerald-500/20 backdrop-blur-2xl hover:border-emerald-500/50 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] text-slate-200 w-[300px] left-16 bottom-16 hidden 2xl:block"
        />

        <FloatingCard
          badge="OFFLINE HUD"
          title="IndexedDB Cache"
          subtitle="Download region packages to navigate without signal."
          className="bg-slate-900/50 border border-emerald-500/20 backdrop-blur-2xl hover:border-emerald-500/50 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] text-slate-200 w-[300px] right-16 bottom-12 hidden 2xl:block"
        />

        <div className="flex flex-col items-center justify-center px-6 max-w-5xl mx-auto text-center relative z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            ⚡ Autonomous Vehicle Intelligence
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-8xl font-black tracking-tight leading-none max-w-4xl"
          >
            The Intelligent
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Navigation HUD
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-lg md:text-xl text-slate-400 max-w-3xl leading-relaxed"
          >
            SmartRoute transforms your cockpit display with high-fidelity 3D layouts, dynamic multi-routing eco optimization, telemetry diagnostics, and an AI co-pilot that guards your journey.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={handleGetStarted}
              className="mt-10 rounded-full px-12 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 text-md tracking-wider uppercase"
            >
              Enter Dashboard Cockpit →
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
