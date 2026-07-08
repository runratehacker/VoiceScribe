import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ progressTotal = 0, progressCompleted = 0, progressPending = 0 }) => {
  const navigate = useNavigate();

  const handleSave = () => {
    alert("Progress is automatically saved as you go!");
  };

  const handleExit = () => {
    navigate('/fillform');
  };

  return (
    <header className="flex justify-between items-start mb-4 w-full max-w-6xl mx-auto shrink-0 gap-4">
      <button
        onClick={handleExit}
        className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-colors text-slate-600 shrink-0 mt-2"
        title="Go Back"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      {/* Embedded Progress Widget */}
      {progressTotal > 0 && (
        <div className="flex-1 bg-white rounded-[2rem] px-8 py-4 shadow-sm border border-slate-200 flex justify-between items-start max-w-3xl">
          <div className="w-1/3 border-r border-slate-200 pr-6">
            <div className="flex justify-between items-end mb-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</p>
              <h4 className="text-lg font-bold leading-none text-slate-800">{progressTotal}</h4>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {[...Array(progressTotal)].map((_, i) => (
                <div key={i} className="w-1 h-3 bg-slate-200 rounded-full"></div>
              ))}
            </div>
          </div>
          <div className="w-1/3 border-r border-slate-200 pl-6 pr-6">
            <div className="flex justify-between items-end mb-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
              <h4 className="text-lg font-bold leading-none text-[#1E293B]">{progressCompleted}</h4>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {[...Array(progressCompleted)].map((_, i) => (
                <div key={i} className="w-1 h-3 bg-[#1E293B] rounded-full"></div>
              ))}
            </div>
          </div>
          <div className="w-1/3 pl-6">
            <div className="flex justify-between items-end mb-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
              <h4 className="text-lg font-bold leading-none text-[#EA580C]">{progressPending}</h4>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {[...Array(progressPending)].map((_, i) => (
                <div key={i} className="w-1 h-3 bg-[#EA580C] rounded-full"></div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 shrink-0 mt-3">
        <button
          onClick={handleSave}
          className="px-5 h-10 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 font-bold text-slate-700 transition-colors"
        >
          Save
        </button>
        <button
          onClick={handleExit}
          className="px-5 h-10 bg-[#1E293B] rounded-full shadow-sm hover:bg-slate-800 font-bold text-white transition-colors"
        >
          Exit
        </button>
      </div>
    </header>
  );
};

export default Header;
