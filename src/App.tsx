import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { PredictionTab } from './components/PredictionTab';
import { TeamStatsTab } from './components/TeamStatsTab';
import { PlayerStatsTab } from './components/PlayerStatsTab';
import { LeadersTab } from './components/LeadersTab';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('prediction');

  return (
    <div className="min-h-screen bg-[#080E1E] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'prediction' && <PredictionTab />}
        {activeTab === 'teamStats' && <TeamStatsTab />}
        {activeTab === 'playerStats' && <PlayerStatsTab />}
        {activeTab === 'leaders' && <LeadersTab />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#0B132B] py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            MLB Sabermetric Prediction Engine &copy; 2026 • Powered by C++20 OOP Simulation & MLB Stats API
          </div>
          <div className="text-cyan-400 font-bold">
            10,000 Monte Carlo Iterations / Match
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
