import React, { useState, useRef, useEffect } from 'react';
import LatexRenderer from './LatexRenderer';

const Subjective = ({ fieldKey, label, heading, question, value, filled, totalQuestions, onPrev, onNext, hasPrev, hasNext }) => {
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(true);
  const answerContainerRef = useRef(null);

  const hasAutoCollapsedRef = useRef(false);

  // Reset auto-collapse state and expand question when switching questions
  useEffect(() => {
    hasAutoCollapsedRef.current = false;
    setIsQuestionExpanded(true);
  }, [fieldKey]);

  useEffect(() => {
    if (answerContainerRef.current) {
      const { scrollHeight, clientHeight } = answerContainerRef.current;

      // If text overflows container and hasn't been auto-collapsed yet for this question
      if (scrollHeight > clientHeight && !hasAutoCollapsedRef.current) {
        setIsQuestionExpanded(false);
        hasAutoCollapsedRef.current = true;
      }

      answerContainerRef.current.scrollTo({
        top: answerContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [value]);

  return (
    <div className="flex-1 w-full mx-auto flex flex-col mb-4 min-h-0">
      <div className="flex-1 bg-[#FDFDFD] rounded-4xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 flex flex-col p-6 md:p-8 relative overflow-hidden gap-6">

        {/* Top Info Bar with Navigation */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 border border-slate-200 rounded-2xl px-5 py-3 bg-white shadow-sm">
              <h2 className="text-lg font-bold text-slate-800">Question {label || fieldKey}</h2>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Subjective
              </span>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className={`px-3 py-2 rounded-2xl font-bold transition-colors ${!hasPrev ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm'}`}
              >
                Prev
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className={`px-3 py-2 rounded-2xl font-bold transition-colors ${!hasNext ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm'}`}
              >
                Next
              </button>
            </div>
          </div>
          <span className="text-slate-400 font-medium text-sm tracking-wide pr-2">{fieldKey} / {totalQuestions}</span>
        </div>

        {/* Question Text Box - Only visible when expanded */}
        <div
          className={`w-full border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm shrink-0 bg-white flex flex-col items-center justify-center min-h-30 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all duration-300 transform origin-top gap-2 ${isQuestionExpanded ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 h-0 p-0 min-h-0 hidden'}`}
          onClick={() => setIsQuestionExpanded(false)}
          title="Click to collapse question"
        >
          {heading && (
            <span className="text-sm font-semibold tracking-wider text-black-600 uppercase mb-1 text-center">
              <LatexRenderer text={heading} />
            </span>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-snug text-center w-full">
            <LatexRenderer text={question || label} />
          </h1>
        </div>

        {/* Answer Workspace Box */}
        <div className="flex-1 w-full border border-slate-200 rounded-2xl shadow-sm bg-white relative p-6 md:p-8 transition-all duration-300 flex flex-col">

          {/* Floating Q Button - Only visible when question is collapsed */}
          {!isQuestionExpanded && (
            <button
              onClick={() => setIsQuestionExpanded(true)}
              className="absolute top-4 right-4 w-11 h-11 rounded-xl bg-[#F8FAFC] border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 flex items-center justify-center font-bold text-lg shadow-sm transition-all z-10"
              title="Show Question"
            >
              Q
            </button>
          )}

          {/* Actual Workspace / Canvas area */}
          <div
            ref={answerContainerRef}
            className="w-full h-full rounded-xl bg-slate-50/50 border border-dashed border-slate-300 flex flex-col text-slate-400 p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {value ? (
              <div className="w-full flex-1">
                <div className="text-slate-800 text-base md:text-lg leading-relaxed wrap-break-word whitespace-pre-wrap text-left">
                  <LatexRenderer text={value} />
                  <span className="inline-block w-0.5 h-5 bg-blue-500 ml-1 animate-pulse align-text-bottom" />
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <svg className="w-12 h-12 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <p className="font-medium text-lg text-slate-500">Your Answer Workspace</p>
                <p className="text-sm mt-2">Press mic icon button to record your answer.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Subjective;
