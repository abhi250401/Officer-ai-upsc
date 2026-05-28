import React, { useState } from 'react';
import {
  Bookmark as BookmarkIcon,
  ExternalLink,
  X,
  FileCheck,
  Lightbulb
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

// Helper to parse URLs and Markdown-style links and render them into interactive clickable links
const renderFormattedSources = (text: string) => {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    while ((match = linkRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      parts.push(
        <a
          key={match[2] + "_" + idx}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0F766E] hover:underline font-semibold inline-flex items-center gap-0.5"
        >
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < line.length && lastIndex > 0) {
      parts.push(line.substring(lastIndex));
    }

    if (parts.length === 0) {
      const urlRegex = /(https?:\/\/[^\s\)]+)/g;
      let lastUrlIndex = 0;
      let urlMatch;
      while ((urlMatch = urlRegex.exec(line)) !== null) {
        if (urlMatch.index > lastUrlIndex) {
          parts.push(line.substring(lastUrlIndex, urlMatch.index));
        }
        let cleanUrl = urlMatch[1];
        if (cleanUrl.endsWith(")") || cleanUrl.endsWith("]")) {
          cleanUrl = cleanUrl.slice(0, -1);
        }
        parts.push(
          <a
            key={cleanUrl + "_" + idx}
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0F766E] hover:underline font-semibold break-all"
          >
            {cleanUrl}
          </a>
        );
        lastUrlIndex = urlRegex.lastIndex;
      }
      if (lastUrlIndex < line.length) {
        parts.push(line.substring(lastUrlIndex));
      }
    }

    return (
      <div key={idx} className="min-h-[18px]">
        {parts.length > 0 ? parts : line}
      </div>
    );
  });
};

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

  const detailedBrief = article.summary?.detailedBrief || article.summary?.whatHappened || "Detailed editorial brief loading...";
  const prelimsFacts = article.summary?.prelimsFacts || "Quick Prelims facts loading...";
  const whyMatters = article.summary?.whyMatters || article.summary?.whyImportant || "GS Syllabus importance references loading...";
  const oneLineRevision = article.summary?.oneLineRevision || "High-retention memory anchor loading...";
  
  const officialSourcesList = article.summary?.officialSources || (() => {
    if (article.source.toLowerCase().includes("pib")) {
      return "• Press Information Bureau PIB Cabinet Reports (https://pib.gov.in/PressReleasePage.aspx?PRID=1888547)\n• Cabinet Committee on Economic Affairs Releases (https://pib.gov.in)";
    } else if (article.source.toLowerCase().includes("prs")) {
      return "• PRS Legislative Research Bill Tracking System (https://prsindia.org/billtrack)\n• Parliament of India Standing Committee Reports (https://prsindia.org)";
    } else if (article.category === "Economy" || article.category === "Agriculture") {
      return "• Reserve Bank of India RBI Notification Database (https://www.rbi.org.in/Scripts/NotificationUser.aspx)\n• Union Ministry of Finance Reports (https://finmin.nic.in)\n• Budget & Economic Survey of India Tables (https://www.indiabudget.gov.in)";
    } else if (article.category === "Environment") {
      return "• Ministry of Environment, Forest and Climate Change Guidelines (https://moef.gov.in)\n• United Nations Climate Change UNFCCC Registry (https://unfccc.int)";
    } else {
      return `• Core ${article.category} Department Notifications (https://india.gov.in)\n• Official Gazette of India Publications (https://egazette.gov.in)`;
    }
  })();

  return (
    <div 
      id="article-detail-sheet-backdrop" 
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="article-detail-drawer" 
        className="w-full max-w-3xl bg-[#FAF9F5] rounded-xl shadow-2xl max-h-[92vh] flex flex-col overflow-y-auto relative border border-stone-200/60 selection:bg-teal-50/50"
      >
        {/* Absolute close button */}
        <button
          id="btn-close-article-details"
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition rounded-full p-1.5 w-8 h-8 flex items-center justify-center cursor-pointer z-20 text-lg font-bold bg-transparent border-0"
          title="Close Reading View"
        >
          <X className="w-4 h-4" />
        </button>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-24">
            <span className="animate-spin text-[#0F766E] font-mono text-xl">↺</span>
            <p className="text-xs text-stone-400 font-mono">Consolidating syllabus structures...</p>
          </div>
        ) : (
          <div className="p-6 md:p-12 space-y-9 max-w-2xl mx-auto flex-1 w-full text-stone-900">
            
            {/* Title block */}
            <div className="space-y-4">
              {article.category && (
                <div className="text-[10px] font-mono font-bold tracking-widest text-[#0F766E] uppercase font-sans">
                  {article.category}
                </div>
              )}
              <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight leading-snug text-[#1C1917]">
                {article.title}
              </h2>
              
              {/* Clean Editorial Metadata Line */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#78716C] font-serif border-b border-stone-200/65 pb-4">
                <span className="font-sans font-semibold text-[#0F766E]">{article.source}</span>
                <span>•</span>
                <span>{new Date(article.ingestionTimestamp).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"})}</span>
                <span>•</span>
                <span className="text-amber-800 font-semibold">{article.relevanceScore}/10 Relevance</span>
                {article.sourceLink && (
                  <>
                    <span>•</span>
                    <a 
                      href={article.sourceLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#0F766E] hover:underline hover:text-teal-800 transition font-sans font-medium"
                    >
                      Official Source ↗
                    </a>
                  </>
                )}
              </div>

              {/* Subtle Secondary Share Bar */}
              <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-[#A8A29E] font-sans pt-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold">Share briefing:</span>
                <button
                  onClick={shareToWhatsapp}
                  className="text-stone-500 hover:text-emerald-700 font-medium transition cursor-pointer p-0 bg-transparent border-0"
                >
                  WhatsApp
                </button>
                <span>·</span>
                <button
                  onClick={shareToTelegram}
                  className="text-stone-500 hover:text-[#0F766E] font-medium transition cursor-pointer p-0 bg-transparent border-0"
                >
                  Telegram
                </button>
                <span>·</span>
                <button
                  onClick={copyLink}
                  className="text-stone-500 hover:text-[#0F766E] font-medium transition cursor-pointer p-0 bg-transparent border-0"
                >
                  Copy Link
                </button>
                <span>·</span>
                <button 
                  onClick={(e) => onToggleBookmark(article.id, e)}
                  className="text-stone-500 hover:text-amber-800 font-medium transition cursor-pointer p-0 bg-transparent border-0"
                >
                  {isBookmarked ? '★ Unpin' : 'Pin to Bench'}
                </button>
              </div>
            </div>

            {/* Dynamic UPSC intelligence brief */}
            <div className="space-y-8 pt-2 font-serif text-[#292524] text-[13.5px] leading-relaxed">
              
            {/* Real Article Image with crisp source attribution under it, or brand placeholder briefing header */}
            <div className="space-y-1 w-full animate-fade-in" id="editorial-detail-media">
              <div className="w-full relative rounded-lg overflow-hidden border border-stone-200/50 bg-stone-100 aspect-video md:aspect-[21/9] select-none flex items-center justify-center">
                {(article as any).imageUrl ? (
                  <img
                    src={(article as any).imageUrl}
                    alt={article.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover select-none"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = document.getElementById("detail-editorial-fallback");
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}

                {/* Elegant Editorial Placeholder briefing background */}
                <div 
                  id="detail-editorial-fallback"
                  className="w-full h-full flex flex-col justify-between p-6 md:p-8 bg-gradient-to-br from-[#FAFAF9] via-[#FAF9F6] to-stone-100 border-b-4 border-[#0F766E]/40"
                  style={{ display: (article as any).imageUrl ? 'none' : 'flex' }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col space-y-1 text-left">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-[#0F766E] uppercase bg-[#E0F2FE]/50 text-[#0F766E] px-2.5 py-1 rounded-sm border border-[#0F766E]/10 w-fit">
                        {article.category || "UPSC Briefing"}
                      </span>
                      <span className="text-[9px] font-mono text-stone-400 uppercase tracking-tight pt-1">
                        {article.source} • {article.readingTime}m reading layout
                      </span>
                    </div>
                    {/* Ashoka Chakra style or elegant legal medallion seal */}
                    <div className="text-[#0F766E]/75 w-11 h-11 flex items-center justify-center rounded-full border border-stone-200/60 bg-white shadow-sm font-serif text-sm">
                      ◈
                    </div>
                  </div>

                  <div className="space-y-2 max-w-2xl text-left">
                    <p className="text-base md:text-lg font-display font-semibold text-stone-900 leading-tight tracking-tight">
                      {article.title}
                    </p>
                    <div className="w-12 h-[1px] bg-[#0F766E]/30"></div>
                    <p className="text-[9.5px] text-stone-400 font-sans tracking-wide uppercase font-semibold">
                      OFFICERAI PRE-SECURE SYLLABUS INTELLIGENCE
                    </p>
                  </div>
                </div>
              </div>

              {/* In-Article Source Attribution block */}
              {(article as any).imageUrl && (
                <div className="flex items-center justify-between px-1 text-[10px] text-[#A8A29E] font-sans">
                  <span>Source: <strong className="text-stone-500">{(article as any).imageSource || article.source || 'PIB India Archive'}</strong></span>
                  {(article as any).imageAttribution && <span>Attribution: <em className="text-stone-500">{(article as any).imageAttribution}</em></span>}
                </div>
              )}
            </div>

              {/* Summary */}
              <div className="space-y-2">
                <h3 className="text-sm font-sans font-bold text-[#1C1917] tracking-tight">Summary</h3>
                <div className="whitespace-pre-wrap text-[#44403C]">
                  {detailedBrief}
                </div>
              </div>

              {/* Key Facts */}
              <div className="space-y-2">
                <h3 className="text-sm font-sans font-bold text-[#1C1917] tracking-tight">Key Facts</h3>
                <div className="pl-4 border-l-2 border-stone-200 whitespace-pre-wrap text-[#44403C]">
                  {prelimsFacts}
                </div>
              </div>

              {/* Why It Matters */}
              <div className="space-y-2">
                <h3 className="text-sm font-sans font-bold text-[#1C1917] tracking-tight">Why It Matters</h3>
                <div className="whitespace-pre-wrap text-[#44403C]">
                  {whyMatters}
                </div>
              </div>

              {/* One-Line Revision */}
              <div className="space-y-2">
                <h3 className="text-sm font-sans font-bold text-[#1C1917] tracking-tight">One-Line Revision</h3>
                <div className="italic text-stone-700 pl-4 border-l-2 border-[#0F766E]/70">
                  &ldquo;{oneLineRevision}&rdquo;
                </div>
              </div>



              {/* Official Source */}
              <div className="space-y-2">
                <h3 className="text-sm font-sans font-bold text-[#1C1917] tracking-tight">Official Source</h3>
                <div className="text-xs text-stone-500 font-sans leading-relaxed whitespace-pre-wrap">
                  {renderFormattedSources(officialSourcesList)}
                </div>
              </div>

              {/* Related Topics / Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="pt-4 border-t border-stone-200/50 flex flex-wrap gap-2 items-center font-sans text-xs">
                  <span className="text-[10.5px] font-medium text-stone-400">Related topics:</span>
                  {article.tags.map((tg) => (
                    <span key={tg} className="text-[10.5px] text-[#0F766E] hover:underline cursor-pointer transition">
                      #{tg}
                    </span>
                  ))}
                </div>
              )}

            </div>

            {/* UPSC PRELIMS MULTIPLE CHOICE PRACTICE BOX */}
            {article.mcq && (
              <div id="inline-mcq-box" className="p-6 bg-[#FAFAF9] border border-stone-200/50 rounded-lg space-y-4 pt-5 mt-6 font-sans">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <FileCheck className="w-4 h-4 text-[#0F766E]" /> Practice Assessment
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Standard UPSC formatting
                  </span>
                </div>

                <p className="text-[13.5px] font-serif font-bold text-stone-900 whitespace-pre-wrap leading-relaxed">
                  {article.mcq.question}
                </p>

                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {article.mcq.options.map((opt, idx) => {
                    const hasAnswered = userAnswers[article.mcq!.id] !== undefined;
                    const isSelected = userAnswers[article.mcq!.id] === idx;
                    const isCorrect = article.mcq!.correctAnswer === idx;
                    
                    let optionClass = 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-300';
                    if (hasAnswered) {
                      if (isCorrect) {
                        optionClass = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold';
                      } else if (isSelected) {
                        optionClass = 'bg-rose-50 border-rose-200 text-rose-950';
                      } else {
                        optionClass = 'bg-stone-100/40 text-stone-400 border-stone-100 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        id={`mcq-detail-option-${idx}`}
                        disabled={hasAnswered}
                        onClick={() => onAnswerMCQ(article.mcq!.id, idx)}
                        className={`w-full text-left text-xs p-3 rounded-lg border transition duration-150 flex items-start gap-2.5 cursor-pointer ${optionClass}`}
                      >
                        <span className="font-mono font-bold bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded text-[10px] uppercase shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {userAnswers[article.mcq.id] !== undefined && (
                  <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2 text-stone-850">
                    <p className="font-bold text-xs text-[#0F766E] flex items-center gap-1 uppercase tracking-wider font-sans">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-100" /> Explanation Details:
                    </p>
                    <p className="text-[12.5px] leading-relaxed text-[#44403C] font-serif">
                      {article.mcq.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* USER PERSONAL MNEMONICS / NOTES COMPILATION INLINE */}
            {token && (
              <div className="bg-[#FAFAF9] border border-stone-200/40 rounded-lg p-5 space-y-3 font-sans">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1">
                   💡 Personal study notes
                </span>
                <p className="text-[11px] text-stone-500">
                  Compile static references (syllabus, reports, or GS index keys) linked to this material.
                </p>
                <div className="flex gap-2 font-sans">
                  <input
                    id="input-inline-card-notes"
                    type="text"
                    placeholder="e.g. MNEMONIC: 'Urea cutPM-PRANAM save50'... Links Article 48 DPSP"
                    value={localNotes}
                    onChange={(e) => {
                      setLocalNotes(e.target.value);
                      setHasSyncNotes(false);
                    }}
                    className="flex-1 text-xs px-3 py-2 border border-stone-200 rounded-md bg-white text-[#1C1816] focus:outline-none focus:border-stone-404"
                  />
                  <button
                    onClick={() => {
                      onSaveRevisionCard(article.id, localNotes);
                      setHasSyncNotes(true);
                    }}
                    className="bg-[#1C1917] hover:bg-stone-850 text-white text-xs font-bold py-2 px-4 rounded-md cursor-pointer transition shrink-0"
                  >
                    {hasSyncNotes ? 'Saved ✓' : 'Keep Notes'}
                  </button>
                </div>
              </div>
            )}

            {/* SATELLITE RELATED TOPICS LIST */}
            {(article as any).relatedArticles && (article as any).relatedArticles.length > 0 && (
              <div className="space-y-3 border-t border-stone-200/60 pt-6 font-sans">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">Connected Syllabus Topics</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(article as any).relatedArticles.map((rel: any) => (
                    <div
                      key={rel.id}
                      onClick={() => onSelectRelated(rel.id)}
                      className="bg-white border border-stone-200/60 hover:border-stone-400 p-3.5 rounded-lg text-left transition cursor-pointer space-y-2 block text-xs"
                    >
                      <span className="text-[9px] font-bold text-[#0F766E] uppercase tracking-wider">{rel.category}</span>
                      <h5 className="font-bold text-stone-900 line-clamp-2 leading-snug">{rel.title}</h5>
                      <p className="text-[10px] text-[#78716C] line-clamp-1 italic">{rel.oneLineRevision}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
