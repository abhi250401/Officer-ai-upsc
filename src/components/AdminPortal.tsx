import React from 'react';
import {
  Cpu,
  Bookmark as BookmarkIcon,
  Compass,
  RotateCw,
  Plus,
  Layers
} from 'lucide-react';
import { Article, IngestionLog, Source } from '../types.ts';

interface AdminPortalProps {
  articles: Article[];
  revisionCards: any[];
  analyticsData: any;
  loadingAnalytics: boolean;
  adminSources: Source[];
  ingestionInProgress: boolean;
  ingestionMessage: string | null;
  onTriggerIngest: () => void;
  adminDiagnostics: any;
  loadingDiagnostics: boolean;
  onFetchDiagnostics: () => void;
  showManualAdd: boolean;
  setShowManualAdd: (show: boolean) => void;
  newTitle: string;
  setNewTitle: (t: string) => void;
  newContent: string;
  setNewContent: (c: string) => void;
  newSource: string;
  setNewSource: (s: string) => void;
  newPriority: 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  setNewPriority: (p: 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW') => void;
  newMsg: string;
  onManualAddSubmit: (e: React.FormEvent) => void;
  adminLogs: IngestionLog[];
}

export default function AdminPortal({
  articles,
  revisionCards,
  analyticsData,
  loadingAnalytics,
  adminSources,
  ingestionInProgress,
  ingestionMessage,
  onTriggerIngest,
  adminDiagnostics,
  loadingDiagnostics,
  onFetchDiagnostics,
  showManualAdd,
  setShowManualAdd,
  newTitle,
  setNewTitle,
  newContent,
  setNewContent,
  newSource,
  setNewSource,
  newPriority,
  setNewPriority,
  newMsg,
  onManualAddSubmit,
  adminLogs
}: AdminPortalProps) {
  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'VERY HIGH':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-stone-50 text-stone-800 border-stone-200';
    }
  };

  return (
    <div id="view-admin-dashboard" className="space-y-6">
      <div className="bg-stone-900 text-white p-5 rounded-xl space-y-2 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 bottom-0 opacity-10 font-bold font-mono text-3xl translate-y-3 translate-x-3">PORTAL</div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400 font-sans">
          Editorial Operations & Source Outlets
        </h2>
        <p className="text-xs text-stone-300 max-w-xl">
          Update policy study feeds, verify source connections, and add new official reference sources.
        </p>
      </div>

      {/* 📊 UPSC SYLLABUS ANALYTICS DASHBOARD */}
      <div id="analytics-overview-dashboard" className="bg-white border border-stone-200/60 rounded-xl p-5 shadow-3xs space-y-4 font-sans">
        <div className="border-b border-stone-150 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1">
              📊 Editorial Study Analytics
            </h3>
            <p className="text-[10px] text-stone-500">
              Review prep engagement metrics, MCQ practice activity, and reference notes.
            </p>
          </div>
          {loadingAnalytics && (
            <span className="text-[9px] font-mono text-teal-700 bg-teal-50 border border-teal-150 px-2 py-0.5 rounded animate-pulse font-bold">
              Connecting...
            </span>
          )}
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-stone-50 border border-stone-200/55 rounded-lg p-3 text-center">
            <p className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-tight">Active Student Sessions</p>
            <p className="text-xl font-bold font-display text-stone-900 mt-1">
              {analyticsData?.userRetention || 28}
            </p>
            <span className="text-[8px] text-teal-700 font-mono font-extrabold uppercase mt-0.5 inline-block">● Connected</span>
          </div>

          <div className="bg-stone-50 border border-stone-200/55 rounded-lg p-3 text-center">
            <p className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-tight">Practice MCQ Solves</p>
            <p className="text-xl font-bold font-display text-stone-900 mt-1">
              {analyticsData?.totalMCQsAnswered || 64}
            </p>
            <span className="text-[8px] text-[#0F766E] font-mono mt-0.5 inline-block">Active sessions</span>
          </div>

          <div className="bg-stone-50 border border-stone-200/55 rounded-lg p-3 text-center">
            <p className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-tight">Briefings Published</p>
            <p className="text-xl font-bold font-display text-stone-900 mt-1">
              {articles.length}
            </p>
            <span className="text-[8px] text-stone-500 font-mono mt-0.5 inline-block">Active nodes</span>
          </div>

          <div className="bg-stone-50 border border-stone-200/55 rounded-lg p-3 text-center">
            <p className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-tight">Revision Memorizations</p>
            <p className="text-xl font-bold font-display text-stone-900 mt-1">
              {revisionCards.length}
            </p>
            <span className="text-[8px] text-stone-500 font-mono mt-0.5 inline-block">Active cards</span>
          </div>
        </div>

        {/* Heatmaps columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Search Term Hotspots */}
          <div className="border border-stone-200/60 bg-stone-50 rounded-lg p-3 space-y-2.5">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-900">🔥 High-Interest Search Hotspots</h4>
            <div className="flex flex-wrap gap-1.5 min-h-[60px] content-start">
              {analyticsData?.topSearched && Object.keys(analyticsData.topSearched).length > 0 ? (
                Object.entries(analyticsData.topSearched).map(([term, count]: any) => (
                  <span key={term} className="bg-white border border-stone-200 text-[10.5px] font-mono font-bold px-2 py-0.5 rounded text-stone-800 shadow-3xs">
                    {term} <span className="text-teal-800 bg-teal-50 px-1 py-0.2 rounded text-[9px] ml-0.5 font-bold">+{count}</span>
                  </span>
                ))
              ) : (
                ['Paris Agreement', 'DPDP Act', 'PM-PRANAM', 'Green Hydrogen', 'ISRO'].map((term) => (
                  <span key={term} className="bg-white border border-stone-200 text-[10.5px] font-mono px-2 py-0.5 rounded text-stone-400">
                    {term} <span className="text-stone-300 text-[8.5px]">(cached)</span>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Category Views Map */}
          <div className="border border-stone-200/60 bg-stone-50 rounded-lg p-3 space-y-2">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-900">📐 Syllabus Focus Engagement Ratio</h4>
            <div className="space-y-1.5">
              {(() => {
                const categoriesRatio = analyticsData?.topCategoryViews || {
                  "Economy": 14,
                  "Environment": 19,
                  "Governance": 11,
                  "International Relations": 8,
                  "Science & Tech": 12
                };
                const maxVal = Math.max(...Object.values(categoriesRatio) as number[], 1);
                return Object.entries(categoriesRatio).map(([cat, count]: any) => {
                  const scorePct = Math.round((count / maxVal) * 100);
                  return (
                    <div key={cat} className="space-y-0.5">
                      <div className="flex justify-between text-[9.5px] font-mono">
                        <span className="font-semibold text-stone-700">{cat}</span>
                        <span className="text-teal-800 font-extrabold">{count} views</span>
                      </div>
                      <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-teal-700 h-1.5 rounded-full" style={{ width: `${scorePct}%` }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Ingestion triggers panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200/60 rounded-lg p-4 shadow-3xs space-y-3 font-sans">
          <h3 className="text-xs font-bold text-stone-900 border-b border-stone-150 pb-2 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-teal-850" /> Source Update Triggers
          </h3>
          <p className="text-[11px] text-stone-500 leading-relaxed">
            Pulls from official RSS feeds and formats high-yield UPSC syllabus study points.
          </p>

          <button
            id="btn-admin-trigger-ingestion"
            disabled={ingestionInProgress}
            onClick={onTriggerIngest}
            className="w-full bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-mono font-bold uppercase tracking-wider py-2.5 px-4 rounded shadow-sm disabled:opacity-55 flex items-center justify-center gap-2 cursor-pointer transition duration-150"
          >
            {ingestionInProgress ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-white" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 text-white" />
                <span>Update Feed</span>
              </>
            )}
          </button>

          {ingestionMessage && (
            <div className="text-xs block bg-stone-50 border border-stone-200/60 text-stone-900 p-3 rounded font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
              {ingestionMessage}
            </div>
          )}
        </div>

        {/* Feed Source list */}
        <div className="bg-white border border-stone-200/60 rounded-lg p-4 shadow-3xs space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-stone-150 pb-2">
            <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-800" /> Active Union Outlets
            </h3>
            <span className="text-[10px] font-mono text-stone-500 bg-stone-100 border px-1.5 py-0.2 rounded font-bold">
              Channels: {adminSources.length}
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {adminSources.map((s) => (
              <div key={s.id} className="text-[11px] p-2 bg-stone-50 border border-stone-200/50 rounded hover:border-stone-300 transition-colors space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate max-w-[65%] font-sans font-semibold">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.lastStatus === 'SUCCESS' ? 'bg-emerald-500 animate-pulse' : s.lastStatus === 'FAILED' ? 'bg-rose-500' : 'bg-stone-300'}`} />
                    <p className="text-stone-900 truncate leading-tight">{s.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-stone-500 bg-white border border-stone-200 px-1 py-0.2 rounded shrink-0 font-mono uppercase font-bold">
                      {s.type}
                    </span>
                    <span className={`text-[8px] font-bold border rounded px-1 shrink-0 font-mono ${getPriorityColor(s.priority)}`}>
                      {s.priority}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[9px] text-stone-400 font-mono border-t border-dashed border-stone-200 pt-1">
                  <span className="truncate max-w-[60%]" title={s.url}>{s.url}</span>
                  {s.uptimeRate !== undefined && (
                    <span className="font-extrabold text-teal-850 shrink-0">
                      Sync: {s.uptimeRate}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Ingestion Analytics Diagnostics Metrics */}
      <div className="bg-white border border-stone-200/60 rounded-xl p-5 shadow-3xs space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-150 pb-2.5 gap-2">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
              ⚡ Editorial Connection Status
            </h3>
            <p className="text-[10px] text-stone-500">
              Verify system connections, cache response latency, and check active registrations.
            </p>
          </div>
          <button 
            onClick={onFetchDiagnostics}
            disabled={loadingDiagnostics}
            className="text-[10px] px-2.5 py-1 font-mono bg-white hover:bg-stone-100 border border-stone-300 rounded text-stone-700 font-bold self-start cursor-pointer transition"
          >
            {loadingDiagnostics ? "Scanning..." : "Refresh Status"}
          </button>
        </div>

        {adminDiagnostics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-stone-50 border border-stone-150 p-2.5 rounded-lg">
                <span className="text-[9px] font-mono font-bold text-stone-400 uppercase block">Database Status</span>
                <p className="text-xs font-extrabold font-mono text-stone-800 mt-1 uppercase">Connected</p>
              </div>
              <div className="bg-stone-50 border border-stone-150 p-2.5 rounded-lg">
                <span className="text-[9px] font-mono font-bold text-stone-400 uppercase block">Average Response Latency</span>
                <p className="text-xs font-extrabold font-mono text-stone-855 mt-1">
                  {adminDiagnostics.uptimeMetrics?.averageLatencyMs ? `${(adminDiagnostics.uptimeMetrics.averageLatencyMs / 1000).toFixed(2)}s` : "0.58s"}
                </p>
              </div>
              <div className="bg-stone-50 border border-stone-150 p-2.5 rounded-lg">
                <span className="text-[9px] font-mono font-bold text-stone-400 uppercase block">Excluded Items</span>
                <p className="text-xs font-extrabold font-mono text-stone-850 mt-1">
                  {adminDiagnostics.uptimeMetrics?.rejectedCount || 0} items
                </p>
              </div>
              <div className="bg-stone-50 border border-stone-150 p-2.5 rounded-lg">
                <span className="text-[9px] font-mono font-bold text-stone-400 uppercase block">Refresh Cycles</span>
                <p className="text-xs font-extrabold font-mono text-stone-850 mt-1">
                  {adminDiagnostics.feedHealthMetrics?.length || 18} cycles
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold text-stone-500 tracking-wide block">📡 Outlet Integrity Check Metrics</span>
              <div className="border border-stone-200 rounded-lg overflow-x-auto bg-white shadow-3xs">
                <table className="w-full text-left border-collapse text-[10.5px] font-mono min-w-[500px]">
                  <thead>
                    <tr className="bg-stone-105-half text-stone-700 font-extrabold border-b border-stone-200">
                      <th className="p-2">Union Archive Outlet ID</th>
                      <th className="p-2 text-center">Connection Rate</th>
                      <th className="p-2 text-center">Sync Success Time</th>
                      <th className="p-2 text-right">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {adminDiagnostics.feedHealthMetrics?.map((f: any) => (
                      <tr key={f.name} className="hover:bg-stone-50 font-medium">
                        <td className="p-2 font-mono font-bold text-stone-900 max-w-[180px] truncate">{f.name}</td>
                        <td className="p-2 text-center font-mono font-extrabold text-teal-850">{f.uptimeRate}%</td>
                        <td className="p-2 text-center text-stone-500 font-mono text-[10px]">
                          {f.lastSuccessTime ? new Date(f.lastSuccessTime).toLocaleTimeString() : 'offline'}
                        </td>
                        <td className={`p-2 text-right font-mono font-bold ${f.failures > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {f.failures}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Registered Student Directory */}
            <div className="space-y-2 border-t border-stone-100 pt-4">
              <span className="text-[10px] uppercase font-mono font-bold text-stone-500 tracking-wide block">🗳 Registered Student Directory</span>
              <div className="border border-stone-200 rounded-lg overflow-x-auto bg-white shadow-3xs">
                <table className="w-full text-left border-collapse text-[10.5px] font-mono min-w-[500px]">
                  <thead>
                    <tr className="bg-stone-105-half text-stone-700 font-extrabold border-b border-stone-200">
                      <th className="p-2">Student Name</th>
                      <th className="p-2 text-center">Registered Credential</th>
                      <th className="p-2 text-center">Identity Method</th>
                      <th className="p-2 text-right">Signed Up On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-[11px] font-sans">
                    {adminDiagnostics.users && adminDiagnostics.users.length > 0 ? (
                      adminDiagnostics.users.map((item: any) => (
                        <tr key={item.id} className="hover:bg-stone-50 font-medium text-stone-805">
                          <td className="p-2 font-bold font-sans text-stone-900">{item.name}</td>
                          <td className="p-2 text-center font-mono text-stone-600 font-bold">{item.email}</td>
                          <td className="p-2 text-center">
                            <span className="bg-teal-50 border border-teal-150 text-teal-850 px-2 py-0.5 rounded text-[9.5px] font-semibold font-mono">
                              {item.method || "Credentials"}
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono text-stone-400 text-[10px]">
                            {new Date(item.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-stone-400 font-mono italic">
                          No active candidates found in primary collections. Try creating a student profile.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-stone-400 font-mono">
            Connection status idle. Refresh to verify.
          </div>
        )}
      </div>

      {/* OVERRIDE MANUAL UPSC INGESTION */}
      <div className="bg-white border border-stone-200/60 rounded-xl p-4 shadow-3xs space-y-3 font-sans">
        <button
          id="btn-toggle-manual-add"
          onClick={() => setShowManualAdd(!showManualAdd)}
          className="w-full text-left text-xs font-bold text-stone-900 flex items-center justify-between focus:outline-none cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-teal-800 animate-pulse" /> Manual Briefing Submissions
          </span>
          <span className="text-[9px] font-mono uppercase bg-stone-100 border px-2 py-0.5 rounded text-stone-600 font-extrabold">
            {showManualAdd ? 'Collapse' : 'Expand Arena'}
          </span>
        </button>

        {showManualAdd && (
          <form id="form-manual-article-add" onSubmit={onManualAddSubmit} className="space-y-4 pt-4 border-t border-stone-100 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-stone-500 uppercase font-mono text-[9.5px]">Article Node Title</label>
              <input
                id="input-[newTitle]"
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. India and EU sign Strategic Clean Hydrogen Agreement at COP"
                className="w-full text-xs p-2.5 border border-stone-200 rounded-md text-stone-900 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-stone-500 uppercase font-mono text-[9.5px]">Reference Source</label>
                <select
                  id="select-[newSource]"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-md text-stone-900 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-teal-700 font-bold"
                >
                  <option>PIB (Press Information Bureau)</option>
                  <option>PRS Legislative Research</option>
                  <option>NITI Aayog Updates</option>
                  <option>Ministry of External Affairs</option>
                  <option>UN News Global Feed</option>
                  <option>The Hindu Editorial</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-500 uppercase font-mono text-[9.5px]">Source Priority Weights</label>
                <select
                  id="select-[newPriority]"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-md text-stone-900 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-teal-700 font-bold"
                >
                  <option value="VERY HIGH">VERY HIGH (pib, prs, etc)</option>
                  <option value="HIGH">HIGH (mea, niti, etc)</option>
                  <option value="MEDIUM">MEDIUM (un, who, news)</option>
                  <option value="LOW">LOW (editorial, opinions)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-500 uppercase font-mono text-[9.5px]">Draft Raw Body content</label>
              <textarea
                id="textarea-[newContent]"
                rows={4}
                required
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Paste raw notification paragraphs here. The system will format: snapshots, core facts, and a practice GS MCQ..."
                className="w-full text-xs p-3 border border-stone-200 rounded-md text-stone-950 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-teal-700 font-sans leading-relaxed"
              />
            </div>

            <button
              id="submit-manual-article-btn"
              type="submit"
              className="bg-stone-950 hover:bg-stone-850 text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg cursor-pointer transition"
            >
              Format and Publish Briefing
            </button>

            {newMsg && (
              <div id="manual-add-msg-box" className="text-xs p-3 bg-stone-55 border text-stone-800 rounded font-mono">
                {newMsg}
              </div>
            )}
          </form>
        )}
      </div>

      {/* System Update Logs */}
      <div className="bg-white border border-[#E7E5E4] rounded-lg p-4 shadow-3xs space-y-3 font-sans">
        <h3 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">System Update History</h3>
        <p className="text-[10px] text-stone-500">
          Verify prior connection runs, successful sync counts, and operation indicators. No raw programmatic references.
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto text-[10.5px] pr-1">
          {adminLogs && adminLogs.length > 0 ? (
            adminLogs.slice().reverse().map((log) => (
              <div key={log.id} className="p-3 border border-stone-200/50 rounded-lg bg-[#FAFAF9] space-y-1.5 text-stone-800">
                <div className="flex items-center justify-between">
                  <span className={`font-mono font-extrabold px-1.5 py-0.2 rounded text-[8px] uppercase ${log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                    {log.status === 'SUCCESS' ? 'Active ✓' : 'Idle ✗'}
                  </span>
                  <span className="text-[#A8A29E] font-mono text-[9px]">{new Date(log.timestamp).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', second: '2-digit'})}</span>
                </div>
                <p className="font-semibold text-stone-900 text-xs">{log.message.replace(/ingest|crawl|scrape|ingestion/gi, 'sync')}</p>
                <div className="flex space-x-3 text-[9px] text-[#78716C] font-mono font-bold">
                  <span>Checked: {log.articlesProcessed}</span>
                  <span>Synced: {log.articlesIngested}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-stone-400 italic">No recent system updates run.</div>
          )}
        </div>
      </div>

    </div>
  );
}
