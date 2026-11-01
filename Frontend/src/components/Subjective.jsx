import React, { useRef, useEffect } from 'react';
import LatexRenderer from './LatexRenderer';

const Subjective = ({
  fieldKey,
  questionNumber,
  label,
  heading,
  question,
  marks,
  value,
  filled,
  totalQuestions,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onClear
}) => {
  const answerContainerRef = useRef(null);
  const displayNumber = questionNumber || label || fieldKey;
  const hasAnswer = Boolean(value && String(value).trim().length > 0) || Boolean(filled);

  useEffect(() => {
    if (answerContainerRef.current) {
      answerContainerRef.current.scrollTo({
        top: answerContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [value]);

  const wordCount = value ? String(value).trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="flex-1 w-full mx-auto flex flex-col mb-4 min-h-0">
      {/* Asymmetric Studio Split Layout (ElevenLabs Editorial Studio) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1 min-h-0 items-stretch">

        {/* Left Column (5 cols): Question Prompt Reading Room */}
        <section className="lg:col-span-5 bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#e7e5e4] p-7 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle atmospheric corner gradient bloom */}
          <div
            className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #f4c5a8 0%, #a7e5d3 50%, transparent 75%)' }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col">
            {/* Question Meta Badge Bar */}
            <div className="flex items-center justify-between pb-5 border-b border-[#f0efed] mb-7 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-[0.08em] uppercase bg-[#f0efed] text-[#0c0a09]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                  Subjective
                </span>
                <span className="text-[14px] font-medium text-[#777169]">
                  Question {displayNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {marks !== undefined && marks !== null && (
                  <span className="text-[12px] font-semibold text-[#292524] bg-[#f0efed] px-2.5 py-1 rounded-full tabular-nums">
                    {marks} {Number(marks) === 1 ? 'Mark' : 'Marks'}
                  </span>
                )}
                <span className="text-[12.5px] font-medium text-[#0c0a09] bg-[#fafafa] px-3 py-1 rounded-full border border-[#e7e5e4] tabular-nums">
                  {displayNumber} of {totalQuestions}
                </span>
              </div>
            </div>

            {/* Question Heading / Topic */}
            {heading && (
              <p className="text-[14px] font-medium text-[#777169] mb-2.5">
                <LatexRenderer text={heading} />
              </p>
            )}

            {/* Display Question Headline (Waldenburg Light 300 signature) */}
            <h1 className="font-serif font-light text-2xl sm:text-3xl lg:text-[32px] text-[#0c0a09] leading-[1.22] tracking-tight pb-1 mb-6">
              <LatexRenderer text={question || label} />
            </h1>
          </div>

          {/* Voice Input Instructions Footer */}
          <div className="relative z-10 pt-5 border-t border-[#f0efed] flex flex-col gap-1 text-[13px] text-[#777169]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
              <span className="font-medium text-[#0c0a09]">Spoken dictation enabled</span>
            </div>
            <p className="text-[12.5px] text-[#777169]">
              Speak naturally at conversational volume. Your spoken words are transcribed continuously.
            </p>
          </div>
        </section>

        {/* Right Column (7 cols): Spoken Answer Workspace & Speech Canvas */}
        <section className="lg:col-span-7 bg-white rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#e7e5e4] p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
          {/* Header with Word Count & Clear Action */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#f0efed] mb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif font-light text-[22px] text-[#0c0a09] tracking-[-0.02em]">
                Spoken Transcript
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0c0a09] bg-[#f0efed] px-3 py-1 rounded-full tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                {wordCount} {wordCount === 1 ? 'Word' : 'Words'}
              </span>

              <button
                type="button"
                onClick={onClear}
                disabled={!hasAnswer}
                className="h-7.5 px-3 rounded-full bg-white hover:bg-[#fafafa] border border-[#d6d3d1] hover:border-[#0c0a09] text-[11.5px] font-medium text-[#292524] hover:text-[#0c0a09] transition-all inline-flex items-center gap-1.5 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                title="Clear recorded transcript"
                aria-label="Clear recorded transcript"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear Answer</span>
              </button>
            </div>
          </div>

          {/* Interactive Speech Canvas */}
          <div
            ref={answerContainerRef}
            className="flex-1 w-full rounded-2xl bg-[#fafafa] border border-[#e7e5e4] p-6 sm:p-8 overflow-y-auto scrollbar-none min-h-70"
          >
            {value ? (
              <div className="text-[#0c0a09] text-[16.5px] sm:text-[18px] leading-[1.7] wrap-break-word whitespace-pre-wrap text-left font-normal">
                <LatexRenderer text={value} />
                <span className="inline-block w-0.5 h-5 bg-[#292524] ml-1 animate-pulse align-text-bottom" />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center py-12">
                {/* ElevenLabs voice-icon-circular */}
                <div className="w-12 h-12 rounded-full bg-white shadow-2xs border border-[#e7e5e4] text-[#292524] flex items-center justify-center mb-4">
                  <div className="flex items-center gap-1" aria-hidden="true">
                    <span className="w-0.5 h-3.5 bg-[#292524] rounded-full" />
                    <span className="w-0.5 h-5 bg-[#292524] rounded-full" />
                    <span className="w-0.5 h-2.5 bg-[#292524] rounded-full" />
                  </div>
                </div>
                <h3 className="font-serif font-light text-2xl text-[#0c0a09] tracking-[-0.02em] mb-1.5">
                  Transcript Canvas Ready
                </h3>
                <p className="text-[14px] text-[#777169] max-w-sm leading-relaxed">
                  Begin speaking or toggle the microphone control below to dictate your answer in real time.
                </p>
              </div>
            )}
          </div>

          {/* Transcript Footer Status */}
          <div className="pt-4 border-t border-[#f0efed] mt-4 flex items-center justify-between text-[12.5px] text-[#777169]">
            <span>Continuous voice capture</span>
            <span className="text-[#0c0a09] font-medium">Synced</span>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Subjective;
