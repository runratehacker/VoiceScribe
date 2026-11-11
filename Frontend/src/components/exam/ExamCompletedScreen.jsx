import React from 'react';
import { useNavigate } from 'react-router-dom';

const ExamCompletedScreen = ({
  onPrev,
  onDownload,
  progressTotal = 0,
  progressCompleted = 0
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 w-full mx-auto flex flex-col mb-4 min-h-0">
      <div className="flex-1 bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#e7e5e4] flex flex-col p-8 sm:p-12 relative overflow-hidden gap-8">

        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-35 blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, #a7e5d3 0%, #a8c8e8 50%, transparent 75%)'
          }}
          aria-hidden="true"
        />

        {/* Top Info Bar */}
        <div className="relative z-10 flex items-center justify-between pb-5 border-b border-[#f0efed] shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-[0.08em] uppercase bg-[#f0efed] text-[#0c0a09]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
              Submission Complete
            </span>
            {progressTotal > 0 && (
              <span className="text-[14px] font-medium text-[#777169] tabular-nums">
                {progressCompleted} of {progressTotal} Questions Recorded
              </span>
            )}
          </div>

          <button
            onClick={() => navigate('/fillform')}
            className="text-[13.5px] font-medium text-[#777169] hover:text-[#0c0a09] transition-colors"
          >
            Return to Desk
          </button>
        </div>

        {/* Main Content Centered */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-6 my-auto text-center">
          {/* ElevenLabs voice-icon-circular */}
          <div className="w-14 h-14 rounded-full bg-[#f0efed] text-[#0c0a09] flex items-center justify-center mb-5">
            <svg className="w-6 h-6 text-[#0c0a09]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="font-serif font-light text-3xl sm:text-[42px] text-[#0c0a09] tracking-tight leading-[1.12] pb-1 mb-3">
            Examination Completed.
          </h1>

          <p className="text-[16px] text-[#4e4e4e] max-w-lg leading-relaxed font-normal mb-8">
            All spoken answers have been transcribed and saved to your evaluation record. Download your certified PDF transcript below or review your recorded responses.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={onPrev}
              className="h-11 px-6 rounded-full bg-white border border-[#d6d3d1] hover:border-[#0c0a09] text-[#292524] font-medium text-[14px] transition-all shadow-2xs active:scale-[0.98]"
            >
              Review Responses
            </button>
            <button
              onClick={onDownload}
              className="h-11 px-7 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white font-medium text-[14px] transition-all flex items-center gap-2 shadow-xs active:scale-[0.98]"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExamCompletedScreen;
