import React from 'react';
import { LiveWaveform } from '../LiveWaveform';

const VoiceFooter = ({
  isRecording,
  toggleMicrophone,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  isLastQuestion = false
}) => {
  return (
    <footer className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-2 pb-1 shrink-0 z-20">

      {/* Left: Previous Question Navigation Pill */}
      {onPrev && (
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className={`h-11 px-5 rounded-full transition-all text-[13.5px] font-medium flex items-center gap-2 shrink-0 ${!hasPrev
              ? 'bg-[#f0efed] text-[#777169] opacity-60 cursor-not-allowed border border-transparent'
              : 'bg-white border border-[#d6d3d1] hover:border-[#0c0a09] text-[#292524] hover:bg-[#fafafa] shadow-2xs active:scale-[0.98]'
            }`}
          aria-label="Previous Question"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </button>
      )}

      {/* Center: Live Audio Feed & Waveform Studio */}
      <div className="flex-1 w-full min-w-0 flex items-center justify-between p-1.5 pl-3.5 pr-2 bg-white/95 border border-[#e7e5e4] rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-md">
        <div className="flex items-center gap-3 shrink-0">
          {/*  voice-icon-circular (32px) with 3-bar monogram */}
          <div className="w-8 h-8 rounded-full bg-[#f0efed] text-[#292524] flex items-center justify-center shrink-0">
            <div className="flex items-center gap-0.5" aria-hidden="true">
              <span className="w-[1.5px] h-2.5 bg-[#292524] rounded-full" />
              <span className="w-[1.5px] h-3.5 bg-[#292524] rounded-full" />
              <span className="w-[1.5px] h-2 bg-[#292524] rounded-full" />
            </div>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[13px] font-medium text-[#0c0a09] leading-tight">Voice Studio</span>
            <span className="text-[11px] text-[#777169]">
              {isRecording ? 'Listening for answer' : 'Microphone paused'}
            </span>
          </div>
        </div>

        {/* Center Live Waveform Bars */}
        <div className="flex-1 max-w-xs sm:max-w-md mx-4 h-8 overflow-hidden flex items-center">
          <LiveWaveform
            processing={false}
            active={isRecording}
            barColor="#292524"
            barWidth={3}
            barGap={3}
            height={28}
            mode="static"
          />
        </div>

        {/* Mic Toggle Button Pill */}
        <button
          onClick={toggleMicrophone}
          className={`h-9 px-4 rounded-full flex items-center gap-2 transition-all active:scale-[0.98] shrink-0 ${isRecording
              ? 'bg-[#292524] hover:bg-[#0c0a09] text-white shadow-2xs'
              : 'bg-[#f0efed] hover:bg-[#e7e5e4] text-[#0c0a09]'
            }`}
          aria-label={isRecording ? 'Pause microphone' : 'Enable microphone'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-[#0c0a09]'}`} />
          <span className="text-[13px] font-medium hidden sm:inline">
            {isRecording ? 'Recording' : 'Enable Mic'}
          </span>
        </button>
      </div>

      {/* Right: Next Question / End Exam Navigation Pill */}
      {onNext && (
        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`h-11 px-6 rounded-full transition-all text-[14px] font-medium flex items-center gap-2 shrink-0 cursor-pointer ${!hasNext
              ? 'bg-[#f0efed] text-[#777169] opacity-60 cursor-not-allowed border border-transparent'
              : 'bg-[#292524] hover:bg-[#0c0a09] text-white shadow-xs active:scale-[0.98]'
            }`}
          aria-label={isLastQuestion ? 'End Exam' : 'Next Question'}
        >
          <span>{isLastQuestion ? 'End Exam' : 'Next'}</span>
          {isLastQuestion ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      )}

    </footer>
  );
};

export default VoiceFooter;
