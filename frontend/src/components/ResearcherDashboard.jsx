import React, { useState, useEffect } from 'react';
import { Database, Download, AlertCircle, Sparkles } from 'lucide-react';

export default function ResearcherDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
    fetchReports();
  }, []);

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

  return (
    <div className="flex w-full flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 text-[#f6f2e9]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-playfair text-3xl font-bold text-[#f6f2e9]">Data Altruism Hub</h2>
          <p className="text-[#A3C4AC] text-sm mt-1">Synthetic, zero-PII aggregated trends</p>
        </div>
        <button 
          onClick={handleDownload}
          disabled={reports.length === 0}
          className="flex items-center gap-2 rounded-xl bg-[#e8795d] px-4 py-2 font-bold text-[#101a1a] shadow-lg transition hover:bg-[#f28e73] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} /> Download Dataset
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><span className="h-6 w-6 animate-pulse rounded-full bg-[#A3C4AC]" /></div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20"><AlertCircle size={18} /> {error}</div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-white/20 rounded-3xl bg-white/5">
          <Database size={32} className="text-[#A3C4AC] mb-4 opacity-50" />
          <p className="text-white/50">No synthetic records generated yet.</p>
          <p className="text-xs text-white/30 mt-2">Close a chat room to trigger the LLM extraction.</p>
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
                <th className="p-4 font-semibold">Generated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {reports.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-white/5">
                  <td className="p-4 text-white/50 font-mono text-xs">{r.id}</td>
                  <td className="p-4 font-medium text-[#f6f2e9]">{r.primary_trigger}</td>
                  <td className="p-4 text-[#A3C4AC]">{r.root_cause_theme}</td>
                  <td className="p-4 text-[#F28C69]">{r.resolution_state}</td>
                  <td className="p-4 text-white/40 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-6 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[.1em] text-[#A3C4AC]/70">
        <Sparkles size={12} /> Powered by Gemini AI
      </div>
    </div>
  );
}
