import { motion } from "framer-motion";

interface FloatingCardProps {
  title: string;
  subtitle: string;
  badge: string;
  className?: string;
}

export default function FloatingCard({
  title,
  subtitle,
  badge,
  className,
}: FloatingCardProps) {
  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`absolute rounded-3xl p-6 border border-slate-800 bg-slate-900/70 backdrop-blur-md shadow-2xl ${className}`}
    >
      <span className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">
        {badge}
      </span>

      <h3 className="text-xl font-bold text-slate-100 mt-4">{title}</h3>

      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{subtitle}</p>
    </motion.div>
  );
}
