import React, { useState, useEffect } from 'react';
import {
  Award,
  TrendingUp,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Activity,
  Compass,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Article, MCQ } from '../types.ts';

interface LearningPathProps {
  token: string | null;
  onOpenArticle: (article: Article) => void;
}

interface FocusTopic {
  category: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM';
}

interface PerformanceSummary {
  totalPracticed: number;
  overallAccuracy: number;
  categoryAccuracy: Record<string, number>;
}

interface PathData {
  focusTopics: FocusTopic[];
  suggestedArticles: Article[];
  suggestedMCQs: MCQ[];
  suggestedRevisionCards: any[];
  performanceSummary: PerformanceSummary;
}

export default function LearningPath({ token, onOpenArticle }: LearningPathProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PathData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [submittingMcqId, setSubmittingMcqId] = useState<string | null>(null);

  const fetchPath = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/learning-path', { headers });
      if (!res.ok) {
        throw new Error('Could not pull real-time UPSC learning path telemetry.');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || 'Error pulling personalized recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPath();
  }, [token]);

  const handleAnswerMCQ = async (mcqId: string, optionIdx: number, correctAnswer: number, category: string) => {
    if (userAnswers[mcqId] !== undefined) return;

    setUserAnswers(prev => ({ ...prev, [mcqId]: optionIdx }));
    setSubmittingMcqId(mcqId);

    const isCorrect = optionIdx === correctAnswer;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch('/api/mcq/attempt', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mcqId,
          optionIndex: optionIdx,
          isCorrect,
          category
        })
      });

      // Silently refresh the analytics dashboard behind the scenes after short timeout to capture new performance statistics
      setTimeout(() => {
        fetchPath();
        setSubmittingMcqId(null);
      }, 1500);

    } catch (err) {
      console.error('Failed submitting MCQ answer attempt:', err);
      setSubmittingMcqId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#FCFAF7] min-h-[70vh] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-[#0F766E] rounded-full animate-spin"></div>
          <Compass className="w-5 h-5 text-[#0F766E] absolute animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-mono text-sm font-bold text-stone-750">Parsing Syllabus Performance Telemetry...</h3>
          <p className="text-xs text-stone-400 max-w-xs font-mono">Consolidating bookmarks, MCQ accuracy indices, and active revision flashcards...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-stone-200 rounded-xl text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
        <h3 className="text-lg font-serif text-stone-900">Telemetry Out of Sync</h3>
        <p className="text-xs text-stone-505 leading-relaxed font-mono">
          We experienced an error evaluating your syllabus records: {error}
        </p>
        <button
          onClick={fetchPath}
          className="inline-flex items-center gap-1.5 bg-[#1C1816] hover:bg-stone-850 text-white font-mono text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition"
        >
          <RotateCw className="w-3.5 h-3.5" /> Reconnect Database
        </button>
      </div>
    );
  }

  const { focusTopics, suggestedArticles, suggestedMCQs, suggestedRevisionCards, performanceSummary } = data;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto px-4 md:px-0 py-6">
      
      {/* 1. PATH INTRO BANNER */}
      <div className="bg-[#FAF8F5] border border-stone-200/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-3xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-widest text-[#0F766E] uppercase bg-teal-50 border border-teal-100/60 px-2.5 py-1 rounded-md">
            <Compass className="w-3 h-3 text-[#0F766E]" /> Static Grounding Adaptive Pathway
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-medium text-stone-900 leading-tight">
            Personalized Learning Pathway
          </h1>
          <p className="text-stone-600 font-sans text-xs md:text-sm max-w-xl leading-relaxed">
            This module dynamically maps your quiz accuracy history, review behaviors, and bookmarks to identify syllabus vulnerabilities. Tap any suggested note to initiate focused study.
          </p>
        </div>

        <button
          onClick={fetchPath}
          className="inline-flex items-center gap-1.5 self-start md:self-auto text-[11px] font-mono font-bold border border-stone-200 hover:border-stone-300 text-stone-705 bg-white px-3.5 py-2 rounded-xl transition cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" /> Refresh Analytics
        </button>
      </div>

      {/* 2. REALTIME PERFORMANCE INDEX GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total Drills Tried */}
        <div className="bg-white border border-stone-200/50 rounded-2xl p-5 flex items-center gap-4 shadow-3xs">
          <div className="p-3.5 bg-rose-50 rounded-xl text-rose-800">
            <Activity className="w-5 h-5 text-rose-800" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-stone-450 tracking-wider">Total Practice Drills</span>
            <div className="text-2xl font-mono font-bold text-stone-900">{performanceSummary.totalPracticed}</div>
            <span className="text-[10px] font-mono text-stone-400">MCQ attempts saved</span>
          </div>
        </div>

        {/* Accuracy Index Score */}
        <div className="bg-white border border-stone-200/50 rounded-2xl p-5 flex items-center gap-4 shadow-3xs">
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-800">
            <Award className="w-5 h-5 text-emerald-800" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-stone-450 tracking-wider">Accuracy Index Score</span>
            <div className="text-2xl font-mono font-bold text-emerald-800">{performanceSummary.overallAccuracy}%</div>
            <span className="text-[10px] font-mono text-emerald-600">Target Benchmark: 75%</span>
          </div>
        </div>

        {/* Quick Strategy Accent */}
        <div className="bg-[#1C1816] text-stone-100 border border-stone-850 rounded-2xl p-5 flex items-center gap-4 shadow-2xs">
          <div className="p-3.5 bg-[#2B2725] rounded-xl">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-stone-400 tracking-wider">Dynamic Priority Focus</span>
            <div className="text-sm font-sans font-semibold text-amber-100">
              {focusTopics[0]?.category || 'General Syllabus'}
            </div>
            <span className="text-[10.5px] font-sans text-stone-400 block line-clamp-1">
              Active weakness mapping is running
            </span>
          </div>
        </div>

      </div>

      {/* 3. SYLLABUS WEAKNESS ANALYSIS */}
      <div className="bg-white border border-stone-200/50 rounded-2xl p-5 md:p-6 space-y-4 shadow-3xs">
        <div className="space-y-1">
          <h2 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
            📊 Syllabus Priority Diagnostics
          </h2>
          <p className="text-xs text-stone-450">We constantly evaluate performance metrics to focus your limited attention on high-yield goals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* Diagnostic priority cards */}
          <div className="space-y-3">
            {focusTopics.map((topic, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex gap-3 items-start transition ${
                  topic.priority === 'HIGH'
                    ? 'bg-rose-50/40 border-rose-150'
                    : 'bg-[#FAF8F5] border-stone-200/80'
                }`}
              >
                <span className={`text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded leading-none mt-0.5 shrink-0 ${
                  topic.priority === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-stone-200 text-stone-700'
                }`}>
                  {topic.priority}
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs font-mono font-bold text-[#1C1816]">{topic.category}</h4>
                  <p className="text-[11.5px] text-stone-600 leading-relaxed font-sans">{topic.reason}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sector wise accuracy bar maps */}
          <div className="bg-[#FCFAF7] border border-stone-200 rounded-xl p-4 md:p-5 space-y-3">
            <h4 className="text-[11px] font-mono font-bold text-stone-605 uppercase tracking-wider block">
              Category Accuracy Distribution
            </h4>
            
            <div className="space-y-3.5">
              {['Welfare Schemes', 'Governance', 'Environment', 'Economy', 'Agriculture', 'Science & Tech'].map((cat) => {
                const acc = performanceSummary.categoryAccuracy[cat];
                const hasTried = acc !== undefined;
                
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between items-center text-[10.5px] font-mono text-stone-700">
                      <span>{cat}</span>
                      <span className="font-bold">{hasTried ? `${acc}% accuracy` : 'Not practiced yet'}</span>
                    </div>
                    <div className="w-full bg-stone-200/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          !hasTried ? 'w-[10%] bg-stone-300' : acc >= 75 ? 'bg-emerald-600' : acc >= 50 ? 'bg-amber-500' : 'bg-rose-600'
                        }`}
                        style={{ width: `${hasTried ? acc : 10}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 4. REAL STUDY RECOMMENDATIONS ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* High yield study notes column */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold text-stone-450 uppercase tracking-widest pl-1">
            📑 Suggested High-Yield Notes ({suggestedArticles.length})
          </h2>

          <div className="space-y-3">
            {suggestedArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => onOpenArticle(art)}
                className="bg-white border border-stone-200/70 rounded-xl p-4 cursor-pointer hover:border-[#0F766E] transition hover:-translate-y-0.5 duration-150 shadow-3xs hover:shadow-2xs group flex items-start gap-3"
              >
                <div className="p-2 py-2.5 bg-[#FAF8F5] border border-stone-200/50 rounded-lg shrink-0 text-center font-mono w-14">
                  <span className="block text-[14px] font-bold text-[#0F766E] leading-none">{art.relevanceScore}</span>
                  <span className="text-[8px] text-stone-400 uppercase font-bold tracking-widest leading-none mt-1 block">Score</span>
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span className="text-[8px] font-mono font-bold text-teal-850 bg-teal-50 px-2 py-0.5 rounded lowercase uppercase">
                      {art.category}
                    </span>
                    <span className="text-[8.5px] font-mono text-stone-450">
                      • {art.readingTime}m read
                    </span>
                  </div>
                  <h3 className="text-xs md:text-[13px] font-semibold text-stone-900 leading-snug font-sans group-hover:text-[#0F766E] transition">
                    {art.title}
                  </h3>
                  <div className="text-[11px] font-mono text-stone-500 line-clamp-1 italic mt-0.5">
                    {art.summary?.oneLineRevision || "High value exam outline dynamic synthesis."}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#0F766E] transition self-center shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Customized drill quizzes column */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold text-stone-450 uppercase tracking-widest pl-1">
            ⚡ Recommended Drill Quizzes ({suggestedMCQs.length})
          </h2>

          <div className="space-y-4">
            {suggestedMCQs.map((mcq) => {
              const hasAnswered = userAnswers[mcq.id] !== undefined;
              const isSelected = userAnswers[mcq.id];
              const isCorrectAtAnswer = mcq.correctAnswer === isSelected;
              const isSubmitting = submittingMcqId === mcq.id;

              return (
                <div
                  key={mcq.id}
                  className="bg-white border border-stone-200/70 rounded-2xl p-4 shadow-3xs space-y-3 border-l-4 border-l-amber-500/80"
                >
                  <div className="flex justify-between items-center border-b border-stone-100 pb-1.5">
                    <span className="text-[9px] font-mono font-bold text-stone-450 uppercase tracking-wider flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" /> Syllabus Test
                    </span>
                    <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {mcq.tags?.[0] || 'Drill'}
                    </span>
                  </div>

                  <p className="text-xs md:text-[12.5px] font-bold text-stone-900 leading-relaxed font-sans mt-1">
                    {mcq.question}
                  </p>

                  <div className="space-y-1.5">
                    {mcq.options.map((opt, idx) => {
                      let btnClass = 'bg-[#FCFAF7] hover:bg-stone-100 text-stone-850 border-stone-200/80 hover:border-stone-300';
                      
                      if (hasAnswered) {
                        if (mcq.correctAnswer === idx) {
                          btnClass = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold';
                        } else if (idx === isSelected) {
                          btnClass = 'bg-rose-50 border-rose-300 text-rose-950';
                        } else {
                          btnClass = 'bg-stone-50/50 text-stone-400 border-stone-100';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          id={`lp-mcq-opt-${idx}`}
                          disabled={hasAnswered}
                          onClick={() => handleAnswerMCQ(mcq.id, idx, mcq.correctAnswer, mcq.tags?.[0] || 'General')}
                          className={`w-full text-left text-[11px] md:text-[11.5px] p-2.5 rounded-lg border transition duration-150 flex items-start gap-2.5 cursor-pointer ${btnClass}`}
                        >
                          <span className="font-mono bg-stone-105 border border-stone-205 text-stone-705 px-1 rounded text-[8.5px] uppercase font-bold text-center shrink-0 leading-none py-0.5">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="font-sans leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {hasAnswered && (
                    <div className="bg-[#FCFAF7] border border-stone-200/60 rounded-xl p-3 text-[11.5px] leading-relaxed text-stone-600 font-sans animate-fade-in relative">
                      <div className="flex items-center gap-1 font-bold text-stone-900 text-[10px] font-mono uppercase mb-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-100" /> Syllabus Explainer:
                      </div>
                      <p>{mcq.explanation}</p>
                      
                      {isSubmitting && (
                        <div className="absolute right-3 bottom-3 text-[10px] font-mono text-stone-400 flex items-center gap-1">
                          <span className="animate-spin text-[#0F766E] font-bold">↺</span> Syncing telemetry...
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 5. SUGGESTED FLASHCARDS ROW */}
      <div className="bg-[#FCFAF8]/45 border border-stone-200/60 rounded-2xl p-5 md:p-6 space-y-4 shadow-3xs">
        <h2 className="text-xs font-mono font-bold text-stone-450 uppercase tracking-widest flex items-center gap-1.5 pl-1">
          <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-50" /> Suggested Revision & Active Recall Flashcards ({suggestedRevisionCards.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suggestedRevisionCards.map((card, idx) => (
            <div
              key={card.id || idx}
              className="bg-white border border-stone-200 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-3xs border-t-4 border-t-teal-700/80"
            >
              <div className="space-y-1">
                <span className="text-[8px] font-mono font-bold text-teal-850 bg-teal-50 px-2 py-0.5 rounded uppercase block w-fit">
                  {card.category || 'Focus Note'}
                </span>
                <span className="text-[10px] text-stone-400 font-mono italic line-clamp-1 block leading-none">
                  {card.articleTitle || 'Syllabus alignment'}
                </span>
              </div>

              <p className="text-xs font-mono font-bold italic text-stone-850 leading-relaxed leading-6 py-2">
                “ {card.notes || card.customNotes || 'High-retention macro target.'} ”
              </p>

              <div className="text-[9.5px] font-mono text-stone-400 flex items-center gap-1 shrink-0 pt-1.5 border-t border-stone-100">
                <Clock className="w-3 h-3" /> Active recall seed
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
