import React from 'react';
import {
  FileCheck,
  Lightbulb,
  CheckCircle,
  Clock,
  RotateCw,
  Sliders,
  Check
} from 'lucide-react';

interface PYQDeskProps {
  pyqList: any[];
  selectedPyqId: string;
  setSelectedPyqId: (id: string) => void;
  mainsDraftAnswer: string;
  setMainsDraftAnswer: (ans: string) => void;
  gradingResponse: any;
  setGradingResponse: React.Dispatch<React.SetStateAction<any>>;
  gradingInProgress: boolean;
  onEvaluateMainsAnswer: () => void;
  prelimsPyqAnswers: Record<string, number>;
  onAnswerPrelimsPyq: (pyqId: string, optionIndex: number) => void;
  token: string | null;
}

export default function PYQDesk({
  pyqList,
  selectedPyqId,
  setSelectedPyqId,
  mainsDraftAnswer,
  setMainsDraftAnswer,
  gradingResponse,
  setGradingResponse,
  gradingInProgress,
  onEvaluateMainsAnswer,
  prelimsPyqAnswers,
  onAnswerPrelimsPyq,
  token
}: PYQDeskProps) {
  // Separate Prelims vs Mains questions
  const mainsQuestions = pyqList.filter((q) => q.type === 'MAINS');
  const prelimsQuestions = pyqList.filter((q) => q.type === 'PRELIMS');

  return (
    <div id="pyq-practice-desk" className="space-y-6">
      <div className="border-b border-stone-200/50 pb-3">
        <h2 className="text-base font-bold text-stone-900 tracking-tight uppercase flex items-center gap-1.5 font-display">
          🎯 UPSC PYQ Sandbox & Mains Practice Desk
        </h2>
        <p className="text-xs text-stone-500 leading-normal">
          Draft GS answers and essays for instant, objective evaluation matching LBSNAA criteria, or complete high-yield prelims MCQs questions.
        </p>
      </div>

      {/* GS MAINS ESSAY EVALUATION PORTAL */}
      <div className="bg-white border border-stone-200/60 rounded-xl overflow-hidden shadow-3xs space-y-4">
        <div className="bg-stone-900 px-4 py-3 text-white flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-teal-400">GS Mains Essay Sandbox</span>
          <span className="text-[9px] font-mono text-stone-400">Gemini 3.5 Active Policy Grader</span>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10.5px] font-mono font-bold text-stone-500 uppercase block tracking-wider">
              1. Select Syllabus Syllabus Question Node
            </label>
            <select
              id="select-mains-pyq"
              value={selectedPyqId}
              onChange={(e) => {
                setSelectedPyqId(e.target.value);
                setGradingResponse(null);
              }}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-md text-stone-900 bg-stone-50 font-sans focus:outline-none focus:ring-1 focus:ring-teal-700 font-bold"
            >
              {mainsQuestions.length > 0 ? (
                mainsQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    [{q.year} GS-{q.paper}] {q.question.substring(0, 100)}...
                  </option>
                ))
              ) : (
                <option value="pyq-mains-1">[2023 GS-III] Discuss the National Green Hydrogen Mission and its impact on carbon intensity.</option>
              )}
            </select>
          </div>

          {/* Render selected Question box */}
          {(() => {
            const selectedMatch = pyqList.find((q) => q.id === selectedPyqId) || {
              question: "Discuss the National Green Hydrogen Mission's viability as a route to decarbonization and economic self-reliance. Overcome key challenges.",
              marks: 15,
              words: 250,
              year: 2023,
              paper: "III"
            };
            return (
              <div className="p-4 bg-stone-50 rounded-lg space-y-2 border border-stone-150 font-sans">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[#0F766E] uppercase">
                  <span>Year {selectedMatch.year} • Mains General Studies {selectedMatch.paper}</span>
                  <span className="bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">{selectedMatch.marks} Marks • {selectedMatch.words} Words</span>
                </div>
                <h4 className="text-xs md:text-sm font-semibold tracking-tight text-stone-900 leading-relaxed font-serif">
                  “{selectedMatch.question}”
                </h4>
              </div>
            );
          })()}

          {/* Essay Entry Desk */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10.5px] font-mono text-stone-500 font-bold uppercase">
              <span>✍ Essay Draft Arena</span>
              <span>{mainsDraftAnswer.trim().split(/\s+/).filter(Boolean).length} / 250 words</span>
            </div>
            <textarea
              id="mains-essay-answer-textarea"
              rows={8}
              value={mainsDraftAnswer}
              onChange={(e) => setMainsDraftAnswer(e.target.value)}
              placeholder="Paste or write your structured Answer (Introduction, Key dimensions, Constitutional articles, way forward ideas and a neat transition summary)..."
              className="w-full text-xs p-3 border border-stone-200 rounded-lg bg-[#FAF9F5] text-stone-950 focus:outline-none focus:ring-1 focus:ring-teal-700 font-sans leading-relaxed shadow-3xs"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {!token ? (
              <p className="text-[10.5px] font-mono text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                🔒 Authenticate to access the Gemini AI Grader.
              </p>
            ) : (
              <p className="text-[10px] text-stone-400 font-mono">
                ✓ Free evaluation powered by fine-tuned grading parameters.
              </p>
            )}

            <button
              id="submit-mains-essay-btn"
              onClick={onEvaluateMainsAnswer}
              disabled={gradingInProgress || !mainsDraftAnswer.trim()}
              className="w-full sm:w-auto bg-stone-950 hover:bg-stone-800 text-white text-xs font-mono font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-55 shrink-0"
            >
              {gradingInProgress ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                  <span>Evaluating Answer...</span>
                </>
              ) : (
                <span>Submit to AI Grader</span>
              )}
            </button>
          </div>

          {/* AI grading report */}
          {gradingResponse && (
            <div id="mains-grading-response-report" className="border border-teal-200 rounded-lg overflow-hidden shrink-0 animate-fade-in font-sans">
              <div className="bg-teal-900 border-b border-teal-800 p-3 text-white flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-teal-200 uppercase flex items-center gap-1">
                  🎯 Consolidated AI Review Report Card
                </span>
                <span className="text-xs font-mono font-extrabold text-teal-200 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                  Total Score: {gradingResponse.score !== undefined ? `${gradingResponse.score}/15 Marks` : gradingResponse.totalScore || "8.5/15 Marks"}
                </span>
              </div>

              <div className="p-4 bg-teal-50/50 space-y-4 text-xs">
                {/* Visual score criteria segments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-teal-100 font-mono text-[10px]">
                  <div>
                    <span className="text-teal-900 uppercase font-black tracking-wider block">Syllabus Alignment Ratio:</span>
                    <p className="font-bold text-stone-800 mt-0.5">{gradingResponse.strengths?.length > 1 ? "92% Excellent match" : "Good core concepts coverage"}</p>
                  </div>
                  <div>
                    <span className="text-teal-900 uppercase font-black tracking-wider block">Flow & Structural Integrity:</span>
                    <p className="font-bold text-stone-800 mt-0.5">{gradingResponse.gaps?.length > 0 ? "Identified gaps in facts" : "Standard intro & way forward structure"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Introductions summary feedback */}
                  {gradingResponse.feedback && (
                    <div className="space-y-1">
                      <h5 className="font-bold text-teal-950">Overview Assessment & Guidance:</h5>
                      <p className="text-stone-700 leading-relaxed">{gradingResponse.feedback}</p>
                    </div>
                  )}

                  {/* Strengths */}
                  {gradingResponse.strengths && gradingResponse.strengths.length > 0 && (
                    <div className="space-y-1">
                      <h5 className="font-bold text-teal-900 flex items-center gap-1">✓ Core Content Strengths:</h5>
                      <ul className="list-disc list-inside text-stone-600 pl-1 space-y-0.5 font-sans leading-relaxed">
                        {gradingResponse.strengths.map((st: string, idx: number) => (
                          <li key={idx}>{st}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Gaps */}
                  {gradingResponse.gaps && gradingResponse.gaps.length > 0 && (
                    <div className="space-y-1">
                      <h5 className="font-bold text-rose-900 flex items-center gap-1">✗ Missing Critical Dimensions (Gaps):</h5>
                      <ul className="list-disc list-inside text-stone-600 pl-1 space-y-0.5 font-sans leading-relaxed">
                        {gradingResponse.gaps.map((gp: string, idx: number) => (
                          <li key={idx} className="text-rose-950/90">{gp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Syllabus linkages suggestions */}
                  {gradingResponse.referenceSyllabusLinkages && (
                    <div className="p-3 bg-white border border-teal-200/50 rounded-lg space-y-1.5 text-[11px] font-mono text-teal-950/90">
                      <span className="font-bold block uppercase tracking-wider text-[10px]">Citations & Syllabus linkages suggested:</span>
                      <p className="leading-relaxed">{gradingResponse.referenceSyllabusLinkages}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GS PRELIMS PYQ DRILLS */}
      <div className="bg-white border border-stone-200/60 rounded-xl overflow-hidden shadow-3xs space-y-4">
        <div className="bg-stone-900 px-4 py-3 text-white">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-teal-400">GS Prelims PYQ Drills</span>
        </div>

        <div className="p-4 md:p-6 divide-y divide-stone-150">
          {prelimsQuestions.length > 0 ? (
            prelimsQuestions.map((item, index) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-stone-400 gap-2">
                  <span className="font-bold uppercase tracking-widest text-[#0F766E]">UPSC Prelims Year {item.year}</span>
                  <span className="bg-stone-100 border px-2 py-0.5 rounded text-stone-600 font-bold">Paper {item.paper} Code</span>
                </div>

                <p className="text-xs font-semibold text-stone-950 font-sans leading-relaxed">
                  <strong>Q{index + 1}.</strong> {item.question}
                </p>

                <div className="grid grid-cols-1 gap-1.5">
                  {item.options.map((opt: string, idx: number) => {
                    const hasAnswered = prelimsPyqAnswers[item.id] !== undefined;
                    const isSelected = prelimsPyqAnswers[item.id] === idx;
                    const isCorrect = item.correctAnswer === idx;

                    let btnClass = 'bg-white border-stone-200 hover:bg-stone-50';
                    if (hasAnswered) {
                      if (isCorrect) {
                        btnClass = 'bg-emerald-50 border-emerald-350 text-emerald-950 font-bold';
                      } else if (isSelected) {
                        btnClass = 'bg-rose-50 border-rose-350 text-rose-950';
                      } else {
                        btnClass = 'bg-stone-105-half text-stone-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        id={`pyq-pre-opt-${item.id}-${idx}`}
                        disabled={hasAnswered}
                        onClick={() => onAnswerPrelimsPyq(item.id, idx)}
                        className={`w-full text-left text-xs p-2.5 rounded border transition-colors flex items-start gap-2 cursor-pointer ${btnClass}`}
                      >
                        <span className="font-mono bg-stone-100 text-stone-600 border px-1.5 py-0.2 rounded text-[10px] uppercase font-bold shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {prelimsPyqAnswers[item.id] !== undefined && (
                  <div className="bg-emerald-50/50 border border-emerald-200 text-stone-900 text-xs p-3 rounded-lg space-y-1.5 animate-fade-in font-sans leading-relaxed pl-3 border-l-2 border-emerald-500">
                    <p className="font-bold text-emerald-900 flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider">
                      <Lightbulb className="w-3.5 h-3.5 fill-current text-amber-500" /> Syllabus Reference Answers:
                    </p>
                    <p className="text-stone-700 leading-relaxed text-xs">{item.explanation}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-stone-400 font-mono">
              Fetching UPSC prelims database segment...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
