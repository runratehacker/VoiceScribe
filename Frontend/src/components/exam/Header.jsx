import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({
  progressTotal = 0,
  progressCompleted = 0,
  progressPending = 0,
  currentQuestionIndex = 0,
  onGoToQuestion,
  onEndExam,
  isCompleted = false
}) => {
  const navigate = useNavigate();
  const [showExitModal, setShowExitModal] = useState(false);
  const [showEndExamModal, setShowEndExamModal] = useState(false);

  const handleExitConfirm = () => {
    navigate('/fillform');
  };

  const handleEndExamConfirm = () => {
    setShowEndExamModal(false);
    if (onEndExam) {
      onEndExam();
    }
  };

  const percentage = progressTotal > 0 ? Math.round((progressCompleted / progressTotal) * 100) : 0;

  return (
    <>
      <header className="w-full bg-white/90 backdrop-blur-md rounded-[22px] border border-[#e7e5e4] shadow-[0_4px_20px_rgba(0,0,0,0.03)] px-5 sm:px-6 py-3 mb-5 shrink-0 flex items-center justify-between gap-4 transition-all">
        {/* Left: Brand Monogram & Examination Mode */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="flex items-center gap-1.5 h-4.5 px-0.5" aria-hidden="true">
            <span className="w-0.5 h-3.5 bg-[#292524] rounded-full" />
            <span className="w-0.5 h-5 bg-[#292524] rounded-full" />
            <span className="w-0.5 h-2.5 bg-[#292524] rounded-full" />
          </div>
          <span className="text-[15px] font-semibold tracking-[0.2em] text-[#0c0a09] uppercase select-none">
            VOICESCRIBE
          </span>
          <span className="hidden sm:inline-block w-px h-4 bg-[#e7e5e4]" aria-hidden="true" />
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase px-2.5 py-0.5 rounded-full bg-[#f0efed] text-[#0c0a09]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
            EXAM SESSION
          </span>
        </div>

        {/* Center: Live Evaluation Progress Pill (Middle-dot rationed, no background bar track) */}
        {progressTotal > 0 && (
          <div className="hidden md:flex items-center gap-3.5 px-4 py-1.5 bg-[#fafafa] rounded-full border border-[#e7e5e4]">
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
              <span className="text-[#0c0a09] tabular-nums">
                {progressCompleted} of {progressTotal} answered
              </span>
              <span className="text-[#a8a29e]">·</span>
              <span className="text-[#777169] tabular-nums">
                {progressPending} remaining
              </span>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full bg-[#f0efed] text-[#0c0a09] tabular-nums">
              {percentage}%
            </span>
          </div>
        )}

        {/* Right: Actions (Distinct Intents, top-nav Secondary + Primary CTA pattern) */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fafafa] border border-[#f0efed] text-[12px] text-[#777169] font-medium select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
            <span>Auto-saved</span>
          </div>

          <button
            onClick={() => setShowExitModal(true)}
            className="h-8 px-4.5 rounded-full bg-transparent border border-[#d6d3d1] hover:border-[#0c0a09] text-[14px] font-medium text-[#0c0a09] transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
            title="Return to Student Dashboard"
          >
            <span>Exit to Desk</span>
          </button>

          {!isCompleted && onEndExam && (
            <button
              onClick={() => setShowEndExamModal(true)}
              className="h-8 px-4.5 bg-[#292524] hover:bg-[#0c0a09] rounded-full text-[14px] font-medium text-white transition-all shadow-xs active:scale-[0.98] flex items-center gap-2 cursor-pointer"
              title="Finish and submit examination"
            >
              <span>End Exam</span>
            </button>
          )}
        </div>
      </header>

      {/* Confirmation Modal for Exit to Desk */}
      {showExitModal && (
        <div className="fixed inset-0 bg-[#0c0a09]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-[#e7e5e4] shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-7 max-w-md w-full relative text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f0efed] text-[#0c0a09] text-[11px] font-semibold uppercase tracking-[0.08em] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
              Session Navigation
            </div>
            <h3 className="font-serif font-light text-2xl sm:text-[28px] text-[#0c0a09] mb-2.5 tracking-[-0.02em] leading-snug">
              Return to Student Desk?
            </h3>
            <p className="text-[14.5px] text-[#4e4e4e] leading-relaxed mb-6 font-normal">
              Your recorded voice responses and transcriptions are saved automatically. You can resume this paper at any time from your dashboard.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="h-10 px-5 rounded-full bg-white border border-[#d6d3d1] hover:border-[#0c0a09] text-[13.5px] font-medium text-[#292524] transition-all active:scale-[0.98]"
              >
                Continue Paper
              </button>
              <button
                onClick={handleExitConfirm}
                className="h-10 px-5 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[13.5px] font-medium transition-all shadow-xs active:scale-[0.98]"
              >
                Exit to Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for End Exam */}
      {showEndExamModal && (
        <div className="fixed inset-0 bg-[#0c0a09]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-[#e7e5e4] shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-7 max-w-md w-full relative text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f0efed] text-[#0c0a09] text-[11px] font-semibold uppercase tracking-[0.08em] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
              Final Submission
            </div>
            <h3 className="font-serif font-light text-2xl sm:text-[28px] text-[#0c0a09] mb-2.5 tracking-[-0.02em] leading-snug">
              End Examination Now?
            </h3>
            <p className="text-[14.5px] text-[#4e4e4e] leading-relaxed mb-6 font-normal">
              You have answered <span className="font-medium text-[#0c0a09] tabular-nums">{progressCompleted} of {progressTotal}</span> questions{progressPending > 0 ? ` (${progressPending} remaining)` : ''}. Ending the exam will take you to the completion summary where you can download your transcript.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEndExamModal(false)}
                className="h-10 px-5 rounded-full bg-white border border-[#d6d3d1] hover:border-[#0c0a09] text-[13.5px] font-medium text-[#292524] transition-all active:scale-[0.98] cursor-pointer"
              >
                Keep Answering
              </button>
              <button
                onClick={handleEndExamConfirm}
                className="h-10 px-5 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[13.5px] font-medium transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                End Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
