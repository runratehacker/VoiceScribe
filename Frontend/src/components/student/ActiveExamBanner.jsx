import React from 'react';
import { useNavigate } from 'react-router-dom';

const ActiveExamBanner = ({ currentProgress, completionPercentage }) => {
  const navigate = useNavigate();

  if (!currentProgress?.formId) return null;

  return (
    <section className="relative overflow-hidden bg-white rounded-3xl border border-[#e7e5e4] shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-8 sm:p-10">
      <div
        className="absolute -top-16 -right-16 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, #c8b8e0 0%, #f4c5a8 50%, transparent 75%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-3.5 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold tracking-wider uppercase bg-[#f0efed] text-[#292524]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
              Active Session
            </span>
            <span className="text-[14px] text-[#777169] font-medium">
              {currentProgress.completed} of {currentProgress.total} Questions Answered
            </span>
          </div>

          <h2 className="font-serif font-light text-2xl sm:text-[34px] text-[#0c0a09] tracking-[-0.02em] mb-4 leading-snug">
            {currentProgress.name}
          </h2>

          <div className="max-w-lg">
            <div className="w-full h-1.5 rounded-full bg-[#e7e5e4] overflow-hidden mb-2.5">
              <div
                className="h-full bg-[#292524] rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[13.5px] text-[#4e4e4e] font-medium">
              <span>{completionPercentage}% complete</span>
              <span>{currentProgress.pending} remaining</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 h-9 px-4 py-1.5 bg-[#f0efed] rounded-full" aria-hidden="true">
            <span className="w-0.5 h-3.5 bg-[#292524] rounded-full animate-pulse" />
            <span className="w-0.5 h-6 bg-[#292524] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-0.5 h-2.5 bg-[#292524] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-0.5 h-7 bg-[#292524] rounded-full animate-pulse" style={{ animationDelay: '75ms' }} />
            <span className="w-0.5 h-4 bg-[#292524] rounded-full animate-pulse" style={{ animationDelay: '220ms' }} />
          </div>

          <button
            onClick={() => navigate(`/fillform/${currentProgress.formId}`)}
            className="h-11 px-6 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[15px] font-medium transition-all active:scale-[0.98] flex items-center gap-2.5 shadow-sm"
          >
            <span>Resume Paper</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ActiveExamBanner;

