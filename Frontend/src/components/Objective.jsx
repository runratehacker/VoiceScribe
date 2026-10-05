import React from 'react';
import LatexRenderer from './LatexRenderer';

const Objective = ({ fieldKey, label, heading, question, value, filled, totalQuestions, onPrev, onNext, hasPrev, hasNext, options = [], onSelectOption }) => {
  return (
    <main className="flex-1 w-full mx-auto flex flex-col mb-4 min-h-0">
      <div className="flex-1 bg-[#FDFDFD] rounded-4xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 flex flex-col p-6 md:p-8 relative overflow-hidden gap-6">

        {/* Top Info Bar with Navigation */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 border border-slate-200 rounded-2xl px-5 py-3 bg-white shadow-sm">
              <h2 className="text-lg font-bold text-slate-800">Question {label}</h2>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Multiple Choice
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

        {/* Question Text Box */}
        <div className="w-full border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm shrink-0 bg-white flex flex-col items-center justify-center min-h-30 gap-2">
          {heading && (
            <span className="text-sm font-semibold tracking-wider text-black-600 uppercase mb-1 text-center">
              <LatexRenderer text={heading} />
            </span>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-snug text-center w-full">
            <LatexRenderer text={question || label} />
          </h1>
        </div>

        {/* Answer Block (Options) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full overflow-y-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {options.map((option, index) => {
            const trimmedValue = value ? String(value).trim().toUpperCase() : "";
            const optionLabelUpper = option.label ? String(option.label).trim().toUpperCase() : "";
            const isSelected = trimmedValue && (
              trimmedValue === optionLabelUpper ||
              trimmedValue.startsWith(optionLabelUpper + '.') ||
              trimmedValue.startsWith(optionLabelUpper + ')') ||
              trimmedValue === `OPTION ${optionLabelUpper}`
            );
            if (isSelected) {
              return (
                <div 
                  key={index} 
                  onClick={() => onSelectOption && onSelectOption(option.label)}
                  className="flex items-center gap-4 p-4 pr-3 rounded-full border border-[#333] bg-[#1A1A1A] transition-colors cursor-pointer shrink-0 shadow-md"
                >
                  <div className="w-10 h-10 rounded-full border border-white/40 text-white flex items-center justify-center font-bold text-base shrink-0">
                    {option.label}
                  </div>
                  <span className="text-white font-bold text-base tracking-wide whitespace-normal">{option.text}</span>
                  <div className="ml-auto w-10 h-10 rounded-full border border-white/40 text-white flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              );
            }
            return (
              <div 
                key={index} 
                onClick={() => onSelectOption && onSelectOption(option.label)}
                className="flex items-center gap-4 p-4 pr-6 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer group shrink-0 shadow-sm"
              >
                <div className="w-10 h-10 rounded-full border border-slate-300 text-slate-500 flex items-center justify-center font-bold text-base group-hover:border-slate-400 shrink-0">
                  {option.label}
                </div>
                <span className="text-slate-700 font-bold text-base tracking-wide whitespace-normal">{option.text}</span>
              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
};

export default Objective;

