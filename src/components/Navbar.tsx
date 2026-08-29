import React from 'react';
import { Activity, BarChart3, Users, Award, Zap, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'prediction', label: 'Match Prediction', icon: Zap, badge: 'C++ OOP' },
    { id: 'teamStats', label: 'Team Stats', icon: BarChart3 },
    { id: 'playerStats', label: 'Player Stats', icon: Users },
    { id: 'leaders', label: 'League Leaders', icon: Award },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B132B]/90 backdrop-blur-md border-b border-[#1C2541]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('prediction')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-wider">MLB<span className="text-cyan-400">PREDICT</span></span>
                <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-700/50 px-1.5 py-0.5 rounded">
                  OOP C++20
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Sabermetrics & Monte Carlo Simulator</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C2541]/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="hidden md:inline-block text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Engine Status */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>10,000 SIM ENGINE READY</span>
          </div>
        </div>
      </div>
    </header>
  );
};
