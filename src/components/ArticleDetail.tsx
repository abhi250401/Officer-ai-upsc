import React, { useState } from 'react';
import {
  Bookmark as BookmarkIcon,
  ExternalLink,
  Clock,
  ChevronRight,
  FileCheck,
  Lightbulb,
  X,
  BookOpen,
  Info
} from 'lucide-react';
import { Article, RevisionCard } from '../types.ts';

interface ArticleDetailProps {
  article: Article | null;
  loading: boolean;
  onClose: () => void;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  isBookmarked: boolean;
  userAnswers: Record<string, number>;
  onAnswerMCQ: (mcqId: string, optionIndex: number) => void;
  token: string | null;
  revisionCards: RevisionCard[];
  onSaveRevisionCard: (articleId: string, notes: string) => void;
  onSelectRelated: (articleId: string) => void;
}

export default function ArticleDetail({
  article,
  loading,
  onClose,
  onToggleBookmark,
  isBookmarked,
  userAnswers,
  onAnswerMCQ,
  token,
  revisionCards,
  onSaveRevisionCard,
  onSelectRelated
}: ArticleDetailProps) {
  const [localNotes, setLocalNotes] = useState('');
  const [hasSyncNotes, setHasSyncNotes] = useState(false);

  // Initialize notes once article is loaded
  React.useEffect(() => {
    if (article) {
      const existing = revisionCards.find(c => c.articleId === article.id);
      setLocalNotes(existing?.notes || '');
      setHasSyncNotes(false);
    }
  }, [article, revisionCards]);

  const shareToWhatsapp = () => {
    if (!article) return;
    const titleSlug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const shareUrl = `${window.location.origin}/article/${titleSlug}`;
    const text = encodeURIComponent(`📚 *UPSC Current Affairs Note*: \n*${article.title}*\n⭐ Relevance Score: ${article.relevanceScore}/10 | Syllabus focus: ${article.category}\n\nRead the full high-yield syllabus analysis here:\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareToTelegram = () => {
    if (!article) return;
    const titleSlug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const shareUrl = `${window.location.origin}/article/${titleSlug}`;
    const text = encodeURIComponent(`📚 UPSC Current Affairs Analysis: ${article.title}`);
    window.open(`https://t.me/share/url?url=${shareUrl}&text=${text}`, '_blank');
  };

  const copyLink = () => {
    if (!article) return;
    const titleSlug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const shareUrl = `${window.location.origin}/article/${titleSlug}`;
    navigator.clipboard.writeText(shareUrl);
    alert("🔗 UPSC syllabus-friendly article link copied to clipboard!");
  };

  if (!article) return null;

  // Formatting Fallbacks for high-density 5-section layout compatibility
  const detailedBrief = article.summary?.detailedBrief || article.summary?.whatHappened || "Detailed editorial brief loading...";
  const prelimsFacts = article.summary?.prelimsFacts || "Quick Prelims facts loading...";
  const whyMatters = article.summary?.whyMatters || article.summary?.whyImportant || "GS Syllabus importance references loading...";
  const oneLineRevision = article.summary?.oneLineRevision || "High-retention memory anchor loading...";
  
  const officialSourcesList = article.summary?.officialSources || (() => {
    if (article.source.toLowerCase().includes("pib")) {
      return "• Press Information Bureau (PIB India) Cabinet Releases\n• Government of India Gazette notifications";
    } else if (article.source.toLowerCase().includes("prs")) {
      return "• PRS Legislative Research Statutory Briefings\n• Parliament of India Standing Committee Reports";
    } else if (article.category === "Economy" || article.category === "Agriculture") {
      return "• Reserve Bank of India (RBI) Bulletins\n• Ministry of Finance Gazette Papers";
    } else {
      return `• Core ${article.category} Department Notifications\n• Official Gazette of India Publications`;
    }
  })();

  return (
    <div 
      id="article-detail-sheet-backdrop" 
      className="fixed inset-0 z-50 bg-[#1C1816]/40 backdrop-blur-xs flex justify-end animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="article-detail-drawer" 
        className="w-full max-w-2xl bg-[#FCFAF7] h-full shadow-2xl flex flex-col overflow-hidden animate-slide-in border-l border-stone-200/50"
      >
        {/* Sticky Header with breadcrumbs */}
        <div className="sticky top-0 bg-[#FCFAF7]/95 backdrop-blur-md border-b border-stone-200/40 px-6 py-4 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold tracking-wider text-rose-805 bg-rose-50 px-2.5 py-1 rounded uppercase">
              {article.source}
            </span>
            <span className="text-[10px] font-mono font-bold tracking-wider text-teal-850 bg-teal-50 px-2.5 py-1 rounded">
              {article.category}
            </span>
          </div>

          <button
            id="btn-close-article-details"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-900 p-1.5 rounded-full hover:bg-stone-100 transition cursor-pointer w-8 h-8 flex items-center justify-center border border-stone-200 bg-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin">
          {loading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
              <span className="animate-spin text-[#0F766E] font-mono text-xl">↺</span>
              <p className="text-xs text-stone-400 font-mono">Consolidating syllabus structures...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* PRIMARY ARTICLE HEADER CARD (Elegant Editorial Typography) */}
              <div className="space-y-3 border-b border-stone-200/40 pb-5">
                <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight leading-snug text-stone-900">
                  {article.title}
                </h2>
                
                {/* Visual Metadata Alignment */}
                <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-[#524C44] font-mono">
                  <span className="text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-bold">
                    ★ {article.relevanceScore}/10 Relevance Score
                  </span>
                  <span>•</span>
                  <span>{article.readingTime} min study time</span>
                  <span>•</span>
                  <span>Updated {new Date(article.ingestionTimestamp).toLocaleDateString()}</span>
                </div>

                {article.sourceLink && (
                  <div className="pt-2">
                    <a
                      href={article.sourceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-teal-900 hover:text-[#0F766E] font-semibold font-sans hover:underline group bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-lg transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                      <span>Verify Original Publication ↗</span>
                    </a>
                  </div>
                )}
              </div>

              {/* ACTION TOOLBAR & PIN ACTION */}
              <div id="social-share-row" className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F4] p-3 rounded-lg border border-stone-200/40">
                <span className="text-[10px] font-mono font-bold uppercase text-stone-605 tracking-wider">
                  Syllabus Workspace Actions
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button onClick={shareToWhatsapp} className="bg-white hover:bg-stone-50 text-stone-700 text-[10px] font-bold font-mono border border-stone-200 px-2.5 py-1 rounded cursor-pointer transition">
                    WhatsApp
                  </button>
                  <button onClick={shareToTelegram} className="bg-white hover:bg-stone-50 text-stone-700 text-[10px] font-bold font-mono border border-stone-200 px-2.5 py-1 rounded cursor-pointer transition">
                    Telegram
                  </button>
                  <button onClick={copyLink} className="bg-white hover:bg-stone-50 text-stone-700 text-[10px] font-bold font-mono border border-stone-200 px-2.5 py-1 rounded cursor-pointer transition">
                    Copy Link
                  </button>
                  <button 
                    onClick={(e) => onToggleBookmark(article.id, e)}
                    className={`text-[10px] font-bold font-mono px-3 py-1 rounded cursor-pointer border transition-all ${
                      isBookmarked ? 'bg-amber-50 border-amber-300 text-amber-850 font-bold' : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
                    }`}
                  >
                    {isBookmarked ? '★ Pinned' : 'Pin to Bench'}
                  </button>
                </div>
              </div>

              {/* ==========================================
                  THE HIGH-DENSITY UPSC INTELLIGENCE BRIEF
                  ========================================== */}
              <div className="space-y-6 pt-1">
                
                {/* 1. DETAILED INTELLIGENCE BRIEF */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold uppercase text-stone-500 tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#0F766E]" /> 01. Detailed Intelligence Brief
                  </h3>
                  <div className="text-stone-800 leading-relaxed font-sans text-sm p-4 bg-white border border-stone-200/50 rounded-xl shadow-3xs text-[13.5px] space-y-3">
                    <p className="whitespace-pre-wrap">{detailedBrief}</p>
                  </div>
                </div>

                {/* 2. WHY THIS MATTERS FOR UPSC */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold uppercase text-stone-500 tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#0F766E]" /> 02. Why This Matters for UPSC
                  </h3>
                  <div className="bg-stone-900 text-stone-100 font-sans p-3.5 rounded-xl border border-stone-850/60 shadow-xs flex items-start gap-2.5">
                    <div className="text-xs font-mono font-bold uppercase text-teal-400 border border-teal-800/80 px-1.5 py-0.5 rounded shrink-0">
                      Syllabus
                    </div>
                    <p className="text-[12px] leading-relaxed font-medium">
                      {whyMatters}
                    </p>
                  </div>
                </div>

                {/* 3. QUICK PRELIMS FACTS */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold uppercase text-stone-500 tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#0F766E]" /> 03. Quick Prelims Facts
                  </h3>
                  <div className="text-stone-750 font-serif leading-relaxed text-xs md:text-[13px] bg-white border border-stone-200/50 rounded-xl p-4 md:p-5 shadow-3xs whitespace-pre-wrap pl-6 space-y-1.5 border-l-4 border-l-[#0F766E]">
                    {prelimsFacts}
                  </div>
                </div>

                {/* 4. ONE-LINE REVISION CORE */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold uppercase text-stone-500 tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-100" /> 04. One-Line Revision Core
                  </h3>
                  <div className="bg-teal-50/50 border border-teal-200/85 text-teal-950 font-mono font-semibold p-4 rounded-xl leading-relaxed text-xs md:text-[13px]">
                    “ {oneLineRevision} ”
                  </div>
                </div>

                {/* 5. OFFICIAL SOURCES */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold uppercase text-stone-500 tracking-wider flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-stone-400" /> 05. Official Sources
                  </h3>
                  <div className="text-stone-600 bg-[#FCFAF7] border border-stone-200/60 rounded-xl p-4 font-mono text-xs whitespace-pre-wrap space-y-1">
                    {officialSourcesList}
                  </div>
                </div>

              </div>

              {/* ==========================================
                  PRELIMS MCQ MICRO-DRILL
                  ========================================== */}
              {article.mcq && (
                <div id="inline-mcq-box" className="p-5 bg-[#FAF8F5] border border-stone-200/50 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-200/30 pb-2">
                    <span className="text-[10px] font-mono font-bold text-stone-700 uppercase tracking-widest flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-[#0F766E]" /> Prelims MCQ Micro-Drill
                    </span>
                    <span className="text-[10px] font-mono font-bold text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded">
                      Syllabus Drill
                    </span>
                  </div>

                  <p className="text-[13px] md:text-sm font-semibold text-stone-900 leading-relaxed font-sans">
                    {article.mcq.question}
                  </p>

                  <div className="grid grid-cols-1 gap-2.5">
                    {article.mcq.options.map((opt, idx) => {
                      const hasAnswered = userAnswers[article.mcq!.id] !== undefined;
                      const isSelected = userAnswers[article.mcq!.id] === idx;
                      const isCorrect = article.mcq!.correctAnswer === idx;

                      let optClass = 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-300';
                      if (hasAnswered) {
                        if (isCorrect) {
                          optClass = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold';
                        } else if (isSelected) {
                          optClass = 'bg-rose-50 border-rose-300 text-rose-950';
                        } else {
                          optClass = 'bg-stone-100/40 text-stone-400 border-stone-150';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          id={`mcq-opt-${idx}`}
                          disabled={hasAnswered}
                          onClick={() => onAnswerMCQ(article.mcq!.id, idx)}
                          className={`w-full text-left text-[12.5px] p-3 rounded-lg border transition duration-150 flex items-start gap-2.5 cursor-pointer ${optClass}`}
                        >
                          <span className="font-mono bg-stone-100 text-stone-700 border border-stone-200/80 px-1.5 py-0.2 rounded text-[10px] uppercase font-bold text-center shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="font-sans leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {userAnswers[article.mcq.id] !== undefined && (
                    <div className="bg-white border border-stone-200/80 rounded-lg p-4 space-y-1.5 text-stone-900 animate-fade-in">
                      <p className="font-bold text-xs text-stone-900 flex items-center gap-1 font-mono uppercase">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-150 shrink-0" /> Detailed Explanation & Rational:
                      </p>
                      <p className="text-[12.5px] leading-relaxed text-stone-600 font-sans">
                        {article.mcq.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* PERSONAL STUDY MNEMONICS */}
              {token && (
                <div className="bg-[#FAF8F5] border border-stone-200/50 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono font-bold text-stone-550 uppercase tracking-wider block">
                    ✍ Memorize & Build Personal Syllabus Cards
                  </span>
                  <div className="flex gap-2.5">
                    <input
                      id="input-inline-card-notes"
                      type="text"
                      placeholder="e.g., 'Core alignment: GS-2 welfare schemes, Article 47 link, 81.35 Cr beneficiaries'"
                      value={localNotes}
                      onChange={(e) => {
                        setLocalNotes(e.target.value);
                        setHasSyncNotes(false);
                      }}
                      className="flex-1 text-xs px-3 py-2 border border-stone-200 rounded-lg bg-white text-[#1C1816] focus:outline-none focus:border-stone-405 font-sans"
                    />
                    <button
                      onClick={() => {
                        onSaveRevisionCard(article.id, localNotes);
                        setHasSyncNotes(true);
                      }}
                      className="bg-[#1C1816] hover:bg-stone-850 text-white text-[11.5px] font-mono font-bold py-2 px-4 rounded-lg cursor-pointer transition shrink-0"
                    >
                      {hasSyncNotes ? 'Saved ✓' : 'Add Card'}
                    </button>
                  </div>
                </div>
              )}

              {/* RELATED SYLLABUS CONNECTIONS */}
              {(article as any).relatedArticles && (article as any).relatedArticles.length > 0 && (
                <div className="space-y-3 border-t border-stone-200/30 pt-5">
                  <span className="text-[10px] font-mono font-bold text-stone-450 uppercase tracking-widest block">
                    Syllabus Connected Entities
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-6 animate-fade-in">
                    {(article as any).relatedArticles.map((rel: any) => (
                      <div
                        key={rel.id}
                        onClick={() => onSelectRelated(rel.id)}
                        className="p-3 bg-white border border-stone-200 hover:border-teal-700 rounded-xl cursor-pointer transition shadow-3xs hover:-translate-y-0.5 duration-150"
                      >
                        <span className="text-[8px] font-mono font-bold text-teal-850 bg-teal-50 px-2 py-0.5 rounded lowercase block mb-1.5 w-fit uppercase">
                          {rel.category}
                        </span>
                        <h5 className="font-sans font-semibold text-xs text-stone-900 leading-snug line-clamp-1">{rel.title}</h5>
                        <p className="text-[10.5px] font-mono text-stone-450 line-clamp-1 mt-0.5 italic">{rel.summary?.oneLineRevision || rel.oneLineRevision}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
