import React from 'react';
import { LiveWaveform } from './Livewaveform';

const VoiceFooter = ({ isRecording, toggleMicrophone }) => {
  return (
    <footer className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-4 pb-0 shrink-0">

      {/* WAVEFORM PILL */}
      <div className="flex-1 min-w-0 flex items-center justify-between p-2 pr-4 bg-white/40 border border-slate-200/80 rounded-[3rem] shadow-sm backdrop-blur-md">
        <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 overflow-hidden">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center px-6 gap-1">
          <div className="flex items-center gap-2 mb-1 shrink-0">
            <span className="font-semibold text-slate-800 text-lg pt-2 truncate">Input Audio</span>
            {isRecording ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#7BA4D6] text-white mt-2 shrink-0">Live</span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-400 text-white mt-2 shrink-0">Inactive</span>
            )}
          </div>
          <div className="w-full h-10 pt-1 overflow-hidden shrink-0">
            <LiveWaveform
              processing={false}
              active={isRecording}
              barColor="#7BA4D6"
              barWidth={4}
              barGap={3}
              height={40}
              mode="static"
            />
          </div>
        </div>

        <button className="w-12 h-12 rounded-full bg-white shadow-[0_2px_8px_rgb(0,0,0,0.08)] flex items-center justify-center shrink-0 hover:bg-slate-50 transition-colors text-slate-600">
          {/* Sparkles / AI Icon */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </button>
      </div>

      {/* MIC BUTTON PILL */}
      <button
        onClick={toggleMicrophone}
        className="w-full md:w-[320px] lg:w-[360px] flex items-center justify-between p-2 pr-4 bg-white/40 border border-slate-200/80 rounded-[3rem] shadow-sm backdrop-blur-md hover:bg-white/60 transition-all active:scale-[0.98] group shrink-0"
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 overflow-hidden transition-colors ${isRecording ? 'bg-[#FFF0E6] text-[#E05C3A]' : 'bg-slate-200 text-slate-500'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </div>

        <div className="flex-1 flex flex-col items-start px-5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-lg">Mic</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium text-white transition-colors ${isRecording ? 'bg-[#E05C3A]' : 'bg-slate-400'}`}>
              {isRecording ? 'Active' : 'Inactive'}
            </span>
          </div>
          <span className="text-slate-500 text-[15px] mt-2">
            {isRecording ? 'Listening to response...' : 'Mic is off. Tap to start.'}
          </span>
        </div>

        <div className="w-12 h-12 rounded-full bg-white shadow-[0_2px_8px_rgb(0,0,0,0.08)] flex items-center justify-center shrink-0 group-hover:bg-slate-50 transition-colors">
          {isRecording ? (
            // Stop Icon
            <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            // Play Icon
            <svg className="w-5 h-5 text-slate-700 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
            </svg>
          )}
        </div>
      </button>

    </footer>
  );
};

export default VoiceFooter;
