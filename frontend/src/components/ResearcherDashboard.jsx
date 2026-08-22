import React, { useState, useEffect } from 'react';
import { Database, Download, AlertCircle, Sparkles } from 'lucide-react';

export default function ResearcherDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/research/reports');
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
      } else {
        setError('Failed to load reports');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExtract = async () => {
    setIsExtracting(true);
    try {
      const res = await fetch('http://localhost:3000/api/research/extract', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (data.processed > 0) {
          await fetchReports();
          alert(`Successfully extracted ${data.processed} new trends from recent chats!`);
        } else {
          alert("No pending chats found to extract.");
        }
      }
    } catch (err) {
      alert("Extraction failed. Make sure the backend is running.");
    } finally {
      setIsExtracting(false);
    }
  };

  const [expandedId, setExpandedId] = useState(null);
  const [globalSummary, setGlobalSummary] = useState(null);
  const [isGeneratingGlobal, setIsGeneratingGlobal] = useState(false);

  const handleDownload = () => {
    const jsonStr = JSON.stringify(reports, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safespeak_synthetic_trends_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleGenerateGlobal = async () => {
    setIsGeneratingGlobal(true);
    try {
      const res = await fetch('http://localhost:3000/api/research/global-summary', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setGlobalSummary(data.summary);
      } else {
        alert("Failed to generate global summary.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsGeneratingGlobal(false);
    }
  };

  return (
    <div className="flex w-full flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#f6f2e9] pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-playfair text-3xl font-bold text-[#f6f2e9]">Data Altruism Hub</h2>
          <p className="text-[#A3C4AC] text-sm mt-1">Synthetic, zero-PII aggregated trends</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleGenerateGlobal}
            disabled={isGeneratingGlobal || reports.length === 0}
            className="flex items-center gap-2 rounded-xl border border-[#A3C4AC]/40 bg-[#A3C4AC]/10 px-4 py-2 font-bold text-[#A3C4AC] shadow-lg transition hover:bg-[#A3C4AC]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={16} className={isGeneratingGlobal ? 'animate-spin' : ''} />
            {isGeneratingGlobal ? 'Analyzing...' : 'Generate Global Summary'}
          </button>
          <button 
            onClick={handleExtract}
            disabled={isExtracting}
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 font-bold text-[#f6f2e9] shadow-lg transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={16} className={isExtracting ? 'animate-spin' : ''} />
            {isExtracting ? 'Extracting...' : 'Run AI Extraction'}
          </button>
          <button 
            onClick={handleDownload}
            disabled={reports.length === 0}
            className="flex items-center gap-2 rounded-xl bg-[#e8795d] px-4 py-2 font-bold text-[#101a1a] shadow-lg transition hover:bg-[#f28e73] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} /> Download Dataset
          </button>
        </div>
      </div>

      {globalSummary && (
        <div className="mb-8 p-6 rounded-2xl border border-[#A3C4AC]/30 bg-gradient-to-br from-[#A3C4AC]/10 to-transparent shadow-lg animate-in fade-in slide-in-from-top-4">
          <h3 className="flex items-center gap-2 font-playfair text-xl font-bold text-[#A3C4AC] mb-3">
            <Sparkles size={20} /> Chief Data Scientist Report
          </h3>
          <p className="text-sm text-white/80 leading-relaxed font-mono whitespace-pre-wrap">
            {globalSummary}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-10"><span className="h-6 w-6 animate-pulse rounded-full bg-[#A3C4AC]" /></div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20"><AlertCircle size={18} /> {error}</div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-white/20 rounded-3xl bg-white/5">
          <Database size={32} className="text-[#A3C4AC] mb-4 opacity-50" />
          <p className="text-white/50">No synthetic records generated yet.</p>
          <p className="text-xs text-white/30 mt-2">Chats are safely pending. Click "Run AI Extraction" to begin.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 font-mono text-[10px] uppercase tracking-wider text-[#A3C4AC]">
              <tr>
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Primary Trigger</th>
                <th className="p-4 font-semibold">Root Cause Theme</th>
                <th className="p-4 font-semibold">Resolution State</th>
                <th className="p-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {reports.map((r) => (
                <React.Fragment key={r.id}>
                  <tr className={`transition-colors hover:bg-white/5 ${expandedId === r.id ? 'bg-white/5' : ''}`}>
                    <td className="p-4 text-white/50 font-mono text-xs">{r.id}</td>
                    <td className="p-4 font-medium text-[#f6f2e9]">{r.report?.primary_trigger || "Unknown"}</td>
                    <td className="p-4 text-[#A3C4AC]">{r.report?.root_cause_theme || "Unknown"}</td>
                    <td className="p-4 text-[#F28C69]">{r.report?.resolution_state || "Unknown"}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => toggleExpand(r.id)}
                        className="text-xs border border-white/20 px-3 py-1 rounded-full hover:bg-white/10 transition"
                      >
                        {expandedId === r.id ? 'Hide' : 'Expand'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === r.id && (
                    <tr className="bg-white/5">
                      <td colSpan="5" className="p-6 border-t border-white/5">
                        <div className="grid grid-cols-2 gap-8">
                          {/* AI Detailed Report */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xs font-mono text-[#A3C4AC] uppercase tracking-widest mb-2">AI Clinical Summary</h4>
                              <p className="text-sm text-white/80 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                                {r.report?.detailed_summary || "No detailed summary available."}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/40">
                              <span>Generated At: {new Date(r.created_at).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Raw Transcript */}
                          <div>
                            <h4 className="text-xs font-mono text-[#A3C4AC] uppercase tracking-widest mb-2 flex items-center justify-between">
                              <span>Masked Transcript</span>
                              <span className="text-[10px] bg-[#A3C4AC]/20 text-[#A3C4AC] px-2 py-1 rounded-full">ZERO-PII</span>
                            </h4>
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 h-64 overflow-y-auto space-y-3 font-mono text-xs">
                              {r.transcript && r.transcript.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'User' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.role === 'User' ? 'bg-[#A3C4AC]/20 text-[#A3C4AC]' : 'bg-white/10 text-white/80'}`}>
                                    <div className="text-[9px] opacity-50 mb-1">{msg.role}</div>
                                    <div>{msg.text}</div>
                                  </div>
                                </div>
                              ))}
                              {(!r.transcript || r.transcript.length === 0) && (
                                <div className="text-white/30 text-center py-4">Transcript data unavailable</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-8 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[.1em] text-[#A3C4AC]/70">
        <Sparkles size={12} /> Powered by Gemini AI
      </div>
    </div>
  );
}
