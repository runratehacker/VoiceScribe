import React from 'react';

const CompletedTranscriptsSection = ({ attemptedPapers = [], latestTranscript, archivedTranscripts = [] }) => {
  return (
    <aside id="completed-transcripts" className="lg:col-span-5 flex flex-col gap-6">
      {/* Vertically Stacked Section Header */}
      <div className="flex items-baseline justify-between gap-4 pb-1">
        <div>
          <h2 className="font-serif font-light text-[28px] sm:text-[40px] text-[#0c0a09] tracking-tight leading-[1.15]">
            Completed Papers
          </h2>
          <p className="text-[15px] text-[#777169] mt-1.5">
            Verified oral transcripts and evaluation scores.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full bg-white border border-[#e7e5e4] text-[#292524] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
          {attemptedPapers.length} Graded
        </span>
      </div>

      {/* Hero Card for the Most Recent Evaluation */}
      {latestTranscript && (
        <div className="relative overflow-hidden bg-white rounded-2xl border border-[#e7e5e4] p-6 sm:p-7 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
          <div
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-35 blur-2xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, #a7e5d3 0%, #a8c8e8 50%, transparent 75%)'
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f0efed] text-[#0c0a09] text-[11px] font-semibold uppercase tracking-[0.08em] mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                Latest Evaluation
              </div>
              <h3 className="font-serif font-light text-[24px] text-[#0c0a09] tracking-[-0.02em] leading-snug">
                {latestTranscript.name}
              </h3>
              <p className="text-[13.5px] text-[#777169] mt-0.5">
                {latestTranscript.tag} · {latestTranscript.date}
              </p>
            </div>

            {/* Editorial Display Score */}
            <div className="text-right shrink-0">
              <div className="font-serif font-light text-3xl sm:text-4xl text-[#0c0a09] leading-none">
                {latestTranscript.score}
                <span className="text-[16px] text-[#777169] font-sans font-normal">/{latestTranscript.total}</span>
              </div>
              <span className="text-[11px] text-[#777169] font-medium mt-1 block">
                Certified Score
              </span>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-[#f0efed] flex items-center justify-between gap-4">
            <span className="text-[12.5px] text-[#4e4e4e] flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
              Transcript ready for PDF export
            </span>
            <button
              onClick={() => alert(`Downloading certified transcript: ${latestTranscript.name}`)}
              className="h-9 px-4 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[13px] font-medium transition-all flex items-center gap-2 active:scale-[0.98] shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Archive Transcripts List */}
      <div className="bg-white rounded-2xl border border-[#e7e5e4] shadow-[0_4px_16px_rgba(0,0,0,0.02)] p-6 sm:p-7 flex flex-col">
        <div className="flex items-center justify-between pb-3.5 mb-1 border-b border-[#e7e5e4]">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#777169]">
            Transcript Archive
          </span>
          <span className="text-[12px] font-medium text-[#777169]">
            Score · Export
          </span>
        </div>

        <div className="divide-y divide-[#f0efed]">
          {archivedTranscripts.map((paper) => (
            <div
              key={paper.id}
              className="py-3.5 last:pb-0 flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#f0efed] group-hover:bg-[#292524] text-[#292524] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <div className="min-w-0">
                  <h4 className="text-[15px] font-medium text-[#0c0a09] truncate">
                    {paper.name}
                  </h4>
                  <p className="text-[13px] text-[#777169] mt-0.5">
                    {paper.tag} · {paper.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 shrink-0">
                <div className="text-right">
                  <span className="font-serif font-light text-[20px] text-[#0c0a09] tabular-nums">
                    {paper.score}
                  </span>
                  <span className="text-[12px] text-[#777169]">/{paper.total}</span>
                </div>

                <button
                  onClick={() => alert(`Downloading certified transcript: ${paper.name}`)}
                  className="h-8 px-3 rounded-full border border-[#d6d3d1] hover:border-[#0c0a09] hover:bg-[#292524] text-[#0c0a09] hover:text-white transition-all flex items-center gap-1.5 text-[12px] font-medium active:scale-[0.98]"
                  title={`Download PDF for ${paper.name}`}
                  aria-label={`Download PDF for ${paper.name}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden sm:inline">PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Re-evaluation Request Row */}
        <div className="mt-6 pt-4 border-t border-[#e7e5e4] flex items-center justify-between text-[13px] text-[#777169]">
          <span>Discrepancy in voice transcription?</span>
          <button
            onClick={() => alert('Re-evaluation request submitted to faculty desk.')}
            className="font-medium text-[#0c0a09] hover:underline cursor-pointer"
          >
            Request review
          </button>
        </div>
      </div>
    </aside>
  );
};

export default CompletedTranscriptsSection;

