import React, { useState } from 'react';
import {
  Bookmark as BookmarkIcon,
  ExternalLink,
  Clock,
  ChevronRight,
  FileCheck,
  Lightbulb,
  X
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    whatHappened: false,
    whyImportant: false,
    prelimsSnapshot: false,
    mainsAnalysis: false,
    wayForward: false,
    pyqLinkage: false,
    oneLineRevision: false
  });

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

  const toggleSection = (sec: string) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

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
  };

  if (!article) return null;

  return (
    <div 
      id="article-detail-sheet-backdrop" 
      className="fixed inset-0 z-50 bg-[#1C1816]/30 backdrop-blur-xs flex justify-end animate-fade-in select-none"
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
            <span className="text-[10px] font-mono font-medium tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded uppercase">
              {article.source}
            </span>
            <span className="text-[10px] font-mono font-medium tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
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
              <div className="space-y-3 border-b border-stone-200/40 pb-4">
                <h2 className="text-2xl md:text-3xl font-display font-medium tracking-tight leading-snug text-stone-900">
                  {article.title}
                </h2>
                
                {/* Visual Metadata Alignment */}
                <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-stone-500 font-mono">
                  <span className="text-[#0F766E] font-bold">
                    ★ {article.relevanceScore}/10 Focus Score
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
                      className="inline-flex items-center gap-1.5 text-xs text-[#0F766E] hover:text-teal-800 font-semibold font-sans hover:underline group bg-teal-50 border border-teal-100/60 px-3 py-1.5 rounded-lg transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#0F766E]/70" />
                      <span>Verify Original Source Publication ↗</span>
                    </a>
                  </div>
                )}
              </div>

              {/* ACTION TOOLBAR & PIN ACTION */}
              <div id="social-share-row" className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F4]/80 p-3 rounded-lg border border-stone-200/40">
                <span className="text-[10px] font-mono font-semibold uppercase text-stone-600 tracking-wider">
                  Syllabus Workspace Actions:
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={shareToWhatsapp} className="hover:bg-stone-100 text-stone-700 text-[10px] font-semibold font-mono border border-stone-200 px-2.5 py-1 rounded cursor-pointer transition">
                    WhatsApp
                  </button>
                  <button onClick={shareToTelegram} className="hover:bg-stone-100 text-stone-700 text-[10px] font-semibold font-mono border border-stone-200 px-2.5 py-1 rounded cursor-pointer transition">
                    Telegram
                  </button>
                  <button onClick={copyLink} className="hover:bg-stone-100 text-stone-700 text-[10px] font-semibold font-mono border border-stone-200 px-2.5 py-1 rounded cursor-pointer transition">
                    Copy
                  </button>
                  <button 
                    onClick={(e) => onToggleBookmark(article.id, e)}
                    className={`text-[10px] font-bold font-mono px-3 py-1 rounded cursor-pointer border transition-all ${
                      isBookmarked ? 'bg-teal-50 border-teal-300 text-teal-850' : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
                    }`}
                  >
                    {isBookmarked ? '★ Pinned' : 'Pin to Bench'}
                  </button>
                </div>
              </div>

              {/* THE 2-3 LINE HIGH-IMPACT COGNITIVE AI SUMMARY */}
              {article.summary && (
                <div className="bg-[#FAF8F5] border border-stone-200/50 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#0F766E] block">
                    Intelligence Insight Takeaway
                  </span>
                  <p className="text-[13px] md:text-sm text-stone-700 leading-relaxed font-sans italic">
                    {article.summary.whatHappened}
                  </p>
                </div>
              )}

              {/* VERIFIED OFFICIAL REFERENCES SECTION */}
              <div className="space-y-2.5">
                <span className="text-[10.5px] font-mono font-semibold text-stone-500 uppercase tracking-widest block">
                  Official References
                </span>
                <div className="flex flex-wrap gap-2">
                  <a href="https://pib.gov.in" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] text-teal-900 hover:underline font-serif bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-3 py-1 rounded transition">
                    <ExternalLink className="w-3 h-3 text-stone-400" /> Press Information Bureau (PIB India)
                  </a>
                  <a href="https://prsindia.org" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] text-teal-900 hover:underline font-serif bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-3 py-1 rounded transition">
                    <ExternalLink className="w-3 h-3 text-stone-400" /> PRS Legislative Reports
                  </a>
                  {article.category === "Economy" && (
                    <a href="https://rbi.org.in" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] text-teal-900 hover:underline font-serif bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-3 py-1 rounded transition">
                      <ExternalLink className="w-3 h-3 text-stone-400" /> Reserve Bank of India Bulletins
                    </a>
                  )}
                  {article.category === "Environment" && (
                    <a href="https://moefcc.gov.in" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] text-teal-900 hover:underline font-serif bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-3 py-1 rounded transition">
                      <ExternalLink className="w-3 h-3 text-stone-400" /> MoEFCC Statutory Gazettes
                    </a>
                  )}
                </div>
              </div>

              {/* TAGS COLOURED NEATLY */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 border-b border-stone-200/30 pb-3">
                  {article.tags.map((tg) => (
                    <span key={tg} className="text-[10px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      #{tg}
                    </span>
                  ))}
                </div>
              )}

              {/* THE ACCORDIONS (COLLAPSED BY DEFAULT FOR INTELLECTUAL CALMNESS) */}
              {article.summary ? (
                <div className="divide-y divide-stone-200/45 border-t border-b border-stone-200/40">
                  {/* Why It Matters */}
                  <div className="py-3">
                    <button onClick={() => toggleSection('whyImportant')} className="w-full flex items-center justify-between text-left text-xs md:text-sm font-semibold text-stone-900 hover:text-[#0F766E] transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold text-[#0F766E] bg-teal-50 px-1.5 py-0.5 rounded">01</span>
                        <span className="font-sans">Syllabus Relevance & Why It Matters</span>
                      </span>
                      <span className="text-stone-400 hover:text-stone-900 text-xs">{openSections['whyImportant'] ? '▴' : '▾'}</span>
                    </button>
                    {openSections['whyImportant'] && (
                      <div className="mt-2 text-xs md:text-[13px] text-stone-600 leading-relaxed font-sans space-y-2 animate-fade-in pl-5">
                        <p>{article.summary.whyImportant}</p>
                        {article.summary.background && (
                          <p className="border-t border-dashed border-stone-200 pt-2 italic text-stone-500">
                            <strong>Historical Backdrop:</strong> {article.summary.background}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Prelims Snapshot */}
                  <div className="py-3">
                    <button onClick={() => toggleSection('prelimsSnapshot')} className="w-full flex items-center justify-between text-left text-xs md:text-sm font-semibold text-stone-900 hover:text-[#0F766E] transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold text-[#0F766E] bg-teal-50 px-1.5 py-0.5 rounded">02</span>
                        <span className="font-sans">Prelims Snapshot (Legal Frameworks, Treaties & Indicators)</span>
                      </span>
                      <span className="text-stone-400 hover:text-stone-900 text-xs">{openSections['prelimsSnapshot'] ? '▴' : '▾'}</span>
                    </button>
                    {openSections['prelimsSnapshot'] && (
                      <div className="mt-2 text-xs md:text-[13px] text-stone-700 leading-relaxed font-serif whitespace-pre-wrap pl-5 pr-1 animate-fade-in">
                        {article.summary.prelimsFacts}
                      </div>
                    )}
                  </div>

                  {/* Mains Perspective */}
                  <div className="py-3">
                    <button onClick={() => toggleSection('mainsAnalysis')} className="w-full flex items-center justify-between text-left text-xs md:text-sm font-semibold text-stone-900 hover:text-[#0F766E] transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold text-[#0F766E] bg-teal-50 px-1.5 py-0.5 rounded">03</span>
                        <span className="font-sans">Mains Perspective & Core Argumentative Matrix</span>
                      </span>
                      <span className="text-stone-400 hover:text-stone-900 text-xs">{openSections['mainsAnalysis'] ? '▴' : '▾'}</span>
                    </button>
                    {openSections['mainsAnalysis'] && (
                      <div className="mt-2 text-xs md:text-[13px] text-stone-700 leading-relaxed font-sans whitespace-pre-wrap pl-5 border-l border-stone-205 pr-1 animate-fade-in">
                        {article.summary.mainsAnalysis}
                      </div>
                    )}
                  </div>

                  {/* Constitutional Links */}
                  <div className="py-3">
                    <button onClick={() => toggleSection('constitutionalLinks')} className="w-full flex items-center justify-between text-left text-xs md:text-sm font-semibold text-stone-900 hover:text-[#0F766E] transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold text-[#0F766E] bg-teal-50 px-1.5 py-0.5 rounded">04</span>
                        <span className="font-sans">Constitutional Mapping & Legal Code Links</span>
                      </span>
                      <span className="text-stone-400 hover:text-stone-900 text-xs">{openSections['constitutionalLinks'] ? '▴' : '▾'}</span>
                    </button>
                    {openSections['constitutionalLinks'] && (
                      <div className="mt-2 text-xs md:text-[13px] text-stone-700 leading-relaxed font-sans whitespace-pre-wrap pl-5 pr-1 animate-fade-in">
                        {article.summary.constitutionalLinks}
                      </div>
                    )}
                  </div>

                  {/* Way Forward */}
                  <div className="py-3">
                    <button onClick={() => toggleSection('wayForward')} className="w-full flex items-center justify-between text-left text-xs md:text-sm font-semibold text-stone-900 hover:text-[#0F766E] transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold text-[#0F766E] bg-teal-50 px-1.5 py-0.5 rounded">05</span>
                        <span className="font-sans">Pragmatic Way Forward & Prescriptions</span>
                      </span>
                      <span className="text-stone-400 hover:text-stone-900 text-xs">{openSections['wayForward'] ? '▴' : '▾'}</span>
                    </button>
                    {openSections['wayForward'] && (
                      <div className="mt-2 text-xs md:text-[13px] text-stone-600 leading-relaxed font-sans whitespace-pre-wrap pl-5 pr-1 animate-fade-in">
                        {article.summary.wayForward}
                      </div>
                    )}
                  </div>

                  {/* PYQ Connections */}
                  <div className="py-3">
                    <button onClick={() => toggleSection('pyqLinkage')} className="w-full flex items-center justify-between text-left text-xs md:text-sm font-semibold text-stone-900 hover:text-[#0F766E] transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold text-[#0F766E] bg-teal-50 px-1.5 py-0.5 rounded">06</span>
                        <span className="font-sans">CSE Previous Year Questions Connection Reference</span>
                      </span>
                      <span className="text-stone-400 hover:text-stone-900 text-xs">{openSections['pyqLinkage'] ? '▴' : '▾'}</span>
                    </button>
                    {openSections['pyqLinkage'] && (
                      <div className="mt-2 text-xs md:text-[12.5px] text-stone-605 leading-relaxed font-mono italic pl-5 animate-fade-in">
                        {article.summary.pyqLinkage}
                      </div>
                    )}
                  </div>

                  {/* One-Line Core Takeaway */}
                  <div className="py-3">
                    <button onClick={() => toggleSection('oneLineRevision')} className="w-full flex items-center justify-between text-left text-xs md:text-sm font-semibold text-stone-900 hover:text-[#0F766E] transition cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold text-[#0F766E] bg-teal-50 px-1.5 py-0.5 rounded">07</span>
                        <span className="font-sans">One-Line Revision Core Takeaway</span>
                      </span>
                      <span className="text-stone-400 hover:text-stone-900 text-xs">{openSections['oneLineRevision'] ? '▴' : '▾'}</span>
                    </button>
                    {openSections['oneLineRevision'] && (
                      <div className="mt-2 text-xs md:text-[13px] text-[#0F766E] font-semibold leading-relaxed font-mono pl-5 animate-fade-in bg-stone-50 p-2 rounded">
                        “{article.summary.oneLineRevision}”
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="italic text-xs text-stone-400 font-mono">Model analyses template currently loading...</p>
              )}

              {/* QUIZ MODULE (LIGHTWEIGHT, MINIMAL INTERACTIONS, PROGRESSIVE EXPLANATION REVEAL) */}
              {article.mcq && (
                <div id="inline-mcq-box" className="p-5 bg-[#FAF8F5] border border-stone-200/50 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-200/30 pb-2">
                    <span className="text-[10px] font-mono font-bold text-stone-700 uppercase tracking-widest flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-[#0F766E]" /> Prelims MCQ Micro-Drill
                    </span>
                    <span className="text-[9px] font-mono text-stone-400 bg-white border border-stone-250 px-2 py-0.5 rounded">
                      GS Syllabus Test
                    </span>
                  </div>

                  <p className="text-[13px] md:text-sm font-medium text-stone-900 leading-relaxed">
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
                          optClass = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold';
                        } else if (isSelected) {
                          optClass = 'bg-rose-50 border-rose-300 text-rose-900';
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
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {userAnswers[article.mcq.id] !== undefined && (
                    <div className="bg-white border border-stone-200/80 rounded-lg p-3.5 space-y-1.5 text-stone-900 animate-fade-in">
                      <p className="font-semibold text-xs text-stone-800 flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-current" /> Detailed Citation & Rational:
                      </p>
                      <p className="text-[12px] leading-relaxed text-stone-500 font-sans">
                        {article.mcq.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* PERSONAL STUDY MNEMONICS & PIN ACTION */}
              {token && (
                <div className="bg-[#FAF8F5] border border-stone-200/50 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono font-semibold text-stone-550 uppercase tracking-wider block">
                    ✍ Memorize & Build Personal Syllabus Mentations
                  </span>
                  <div className="flex gap-2.5">
                    <input
                      id="input-inline-card-notes"
                      type="text"
                      placeholder="e.g., 'Core alignment: GS-3 infrastructure, Article 48A link, COP-30 targets'"
                      value={localNotes}
                      onChange={(e) => {
                        setLocalNotes(e.target.value);
                        setHasSyncNotes(false);
                      }}
                      className="flex-1 text-xs px-3 py-2 border border-stone-200 rounded-lg bg-white text-stone-900 focus:outline-none focus:border-stone-405 font-sans"
                    />
                    <button
                      onClick={() => {
                        onSaveRevisionCard(article.id, localNotes);
                        setHasSyncNotes(true);
                      }}
                      className="bg-[#1C1816] hover:bg-stone-800 text-white text-[11px] font-mono font-semibold py-2 px-3 rounded-lg cursor-pointer transition shrink-0"
                    >
                      {hasSyncNotes ? 'Saved ✓' : 'Add Card'}
                    </button>
                  </div>
                </div>
              )}

              {/* RELATED SYLLABUS CONNECTIONS REDESIGN */}
              {(article as any).relatedArticles && (article as any).relatedArticles.length > 0 && (
                <div className="space-y-3 border-t border-stone-200/40 pt-4">
                  <span className="text-[10px] font-mono font-semibold text-stone-500 uppercase tracking-widest block">
                    Syllabus Connected Entities
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-6">
                    {(article as any).relatedArticles.map((rel: any) => (
                      <div
                        key={rel.id}
                        onClick={() => onSelectRelated(rel.id)}
                        className="p-3 bg-white border border-stone-200 hover:border-teal-700 rounded-lg cursor-pointer transition shadow-3xs hover:-translate-y-0.5 duration-150"
                      >
                        <span className="text-[8px] font-mono font-semibold text-teal-850 bg-teal-50 px-1.5 py-0.5 rounded lowercase block mb-1 w-fit">
                          {rel.category}
                        </span>
                        <h5 className="font-sans font-semibold text-xs text-stone-900 leading-snug line-clamp-1">{rel.title}</h5>
                        <p className="text-[10px] font-mono text-stone-400 line-clamp-1 mt-0.5 italic">{rel.oneLineRevision}</p>
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
