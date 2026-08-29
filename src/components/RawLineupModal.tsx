import React, { useState } from 'react';
import { parseRawLineupText, ParsedMatchup } from '../utils/rawLineupParser';
import { X, FileText, CheckCircle2, ArrowRightLeft, Sparkles, AlertCircle, Copy } from 'lucide-react';

interface RawLineupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (parsed: ParsedMatchup) => void;
}

const SAMPLE_RAW_TEXT = `CIN
CIN
CHC
CHC
Reds (64-71)
Cubs (76-59)
Rhett Lowder R
5-8 5.13 ERA
Confirmed Lineup
CF Dane Myers R
SS E. De La Cruz S
1B Sal Stewart R
DH T. Stephenson R
3B E. Suarez R
LF JJ Bleday L
2B Matt McLain R
C Jose Trevino R
RF H. Rodriguez L
Home Run Odds
Starting Pitcher Intel
David Peterson L
7-7 5.17 ERA
Confirmed Lineup
CF P. Crow-Armstrong L
RF Seiya Suzuki R
1B M. Busch L
3B Alex Bregman R
LF Ian Happ S
SS Nico Hoerner R
2B P. Ramirez S
DH M. Conforto L
C Carson Kelly R
Home Run Odds
Starting Pitcher Intel`;

export const RawLineupModal: React.FC<RawLineupModalProps> = ({ isOpen, onClose, onImport }) => {
  const [rawText, setRawText] = useState('');
  const [parsedMatchup, setParsedMatchup] = useState<ParsedMatchup | null>(null);
  const [swapTeams, setSwapTeams] = useState(false);

  if (!isOpen) return null;

  const handleParse = () => {
    if (!rawText.trim()) return;
    const parsed = parseRawLineupText(rawText);
    setParsedMatchup(parsed);
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_RAW_TEXT);
    const parsed = parseRawLineupText(SAMPLE_RAW_TEXT);
    setParsedMatchup(parsed);
  };

  const handleConfirmImport = () => {
    if (!parsedMatchup) return;
    if (swapTeams) {
      onImport({
        team1: parsedMatchup.team2,
        team2: parsedMatchup.team1,
        formattedMarkdown: parsedMatchup.formattedMarkdown
      });
    } else {
      onImport(parsedMatchup);
    }
    onClose();
  };

  const awayTeam = swapTeams ? parsedMatchup?.team2 : parsedMatchup?.team1;
  const homeTeam = swapTeams ? parsedMatchup?.team1 : parsedMatchup?.team2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0B132B] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#111B33]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Paste & Parse Raw Lineup (Nhập Lineup dạng thô)</h3>
              <p className="text-xs text-slate-400">Dán trực tiếp văn bản từ Rotowire, MLB.com, hoặc Twitter để tự động trích xuất 20 players</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Textarea Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">Dán nội dung Lineup thô vào đây:</label>
              <button
                onClick={handleLoadSample}
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nạp dữ liệu mẫu (Sample CIN vs CHC)</span>
              </button>
            </div>
            <textarea
              rows={7}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Dán nội dung lineup dạng thô tại đây (ví dụ: CIN / CHC / Rhett Lowder R / CF Dane Myers R / ...)"
              className="w-full bg-[#111B33] text-slate-100 text-xs font-mono rounded-xl p-3.5 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-y transition-all"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleParse}
                disabled={!rawText.trim()}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
              >
                ⚡ Lọc Lineup (Parse)
              </button>
            </div>
          </div>

          {/* Parsed Results Review Window */}
          {parsedMatchup && awayTeam && homeTeam && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm text-white">Kết quả đã lọc (Review Parsed Output)</span>
                </div>
                <button
                  onClick={() => setSwapTeams(!swapTeams)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono transition-colors cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Đổi Home / Away ({awayTeam.teamAbbr} @ {homeTeam.teamAbbr})</span>
                </button>
              </div>

              {/* Formatted Markdown Box */}
              <div className="bg-[#111B33] p-4 rounded-xl border border-slate-700 text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {parsedMatchup.formattedMarkdown}
              </div>

              {/* Visual Matchup Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Away Team Card */}
                <div className="p-4 rounded-xl bg-[#111B33]/80 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      ✈️ Sân Khách (Away): {awayTeam.teamAbbr}
                    </span>
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                      {awayTeam.batters.length} Batters
                    </span>
                  </div>

                  <div className="text-xs font-mono space-y-1">
                    <div className="text-amber-300 font-semibold">
                      ⚾ Pitcher: {awayTeam.pitcher?.name || 'SP'} ({awayTeam.pitcher?.hand || 'R'}) {awayTeam.pitcher?.rawRecord ? `— ${awayTeam.pitcher.rawRecord}` : ''}
                    </div>
                    <div className="text-slate-400 text-[11px] pt-1">
                      {awayTeam.batters.map((b) => (
                        <div key={b.order} className="truncate">
                          {b.order}. {b.name} ({b.hand}) — <span className="text-slate-300">{b.position}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Home Team Card */}
                <div className="p-4 rounded-xl bg-[#111B33]/80 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      🏠 Sân Nhà (Home): {homeTeam.teamAbbr}
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                      {homeTeam.batters.length} Batters
                    </span>
                  </div>

                  <div className="text-xs font-mono space-y-1">
                    <div className="text-amber-300 font-semibold">
                      ⚾ Pitcher: {homeTeam.pitcher?.name || 'SP'} ({homeTeam.pitcher?.hand || 'R'}) {homeTeam.pitcher?.rawRecord ? `— ${homeTeam.pitcher.rawRecord}` : ''}
                    </div>
                    <div className="text-slate-400 text-[11px] pt-1">
                      {homeTeam.batters.map((b) => (
                        <div key={b.order} className="truncate">
                          {b.order}. {b.name} ({b.hand}) — <span className="text-slate-300">{b.position}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#111B33] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={!parsedMatchup}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>📥 Nạp vào Lineup (Import Lineup)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
