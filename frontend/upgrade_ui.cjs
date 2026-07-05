const fs = require('fs');
const heroFile = 'e:/ccccc/frontend/src/components/common/hero.tsx';
let hero = fs.readFileSync(heroFile, 'utf8');
hero = hero.replace(/bg-slate-900 border border-slate-800/g, 'bg-slate-900/50 border border-emerald-500/20 backdrop-blur-2xl hover:border-emerald-500/50 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]');
hero = hero.replace(/bg-\[radial-gradient\([\s\S]*?animate-pulse" style={{ animationDuration: '8s' }} \/>/, 'bg-[radial-gradient(circle_at_center,#064e3b_0%,#020617_80%)] -z-10 animate-pulse" style={{ animationDuration: \'4s\' }} />');
fs.writeFileSync(heroFile, hero);
console.log('Hero upgraded.');

const dashFile = 'e:/ccccc/frontend/src/features/dashboard/components/dashboard.tsx';
let dash = fs.readFileSync(dashFile, 'utf8');

// Upgrade left panel
dash = dash.replace(/bg-slate-900\/85 border border-slate-800\/85 rounded-3xl z-10 flex flex-col backdrop-blur-xl shadow-2xl/, 'bg-slate-950/60 border border-emerald-500/30 rounded-3xl z-10 flex flex-col backdrop-blur-3xl shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:border-emerald-500/50 transition-all duration-500');

// Upgrade top bar
dash = dash.replace(/h-14 bg-slate-900\/90 border-b border-slate-800\/80 px-6 flex items-center justify-between z-10 backdrop-blur-md/, 'h-14 bg-slate-950/60 border-b border-emerald-500/30 px-6 flex items-center justify-between z-10 backdrop-blur-3xl shadow-[0_4px_30px_rgba(16,185,129,0.1)]');

// Upgrade bottom bar
dash = dash.replace(/h-20 bg-slate-900\/95 border-t border-slate-800 px-8 flex items-center justify-between z-10 relative/, 'h-20 bg-slate-950/80 border-t border-emerald-500/40 px-8 flex items-center justify-between z-10 relative backdrop-blur-3xl shadow-[0_-10px_40px_rgba(16,185,129,0.2)]');

// Upgrade chat widget
dash = dash.replace(/w-80 h-96 bg-slate-900\/90 border border-slate-800 rounded-3xl flex flex-col backdrop-blur-xl shadow-2xl/, 'w-80 h-96 bg-slate-950/70 border border-emerald-500/30 rounded-3xl flex flex-col backdrop-blur-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)]');

// Upgrade layer controls
dash = dash.replace(/absolute top-4 left-1\/2 -translate-x-1\/2 flex items-center gap-2 bg-slate-900\/90 border border-slate-800\/80 p-1.5 rounded-full z-10 backdrop-blur-md shadow-2xl/, 'absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-950/70 border border-emerald-500/40 p-1.5 rounded-full z-10 backdrop-blur-2xl shadow-[0_10px_40px_rgba(16,185,129,0.25)]');

// Upgrade recenter button
dash = dash.replace(/bg-slate-900\/95 border border-cyan-500\/50 text-cyan-400 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl backdrop-blur-md hover:bg-slate-800 transition-colors/, 'bg-slate-950/80 border border-cyan-500/60 text-cyan-400 px-4 py-2.5 rounded-xl text-xs font-bold shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-2xl hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.4)] transition-all duration-300');

fs.writeFileSync(dashFile, dash);
console.log('Dashboard upgraded.');
