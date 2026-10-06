import React from 'react';

const ExamCompletedScreen = ({ onPrev, onDownload }) => {
  return (
    <div className="flex-1 w-full mx-auto flex flex-col mb-4 min-h-0">
      <div className="flex-1 bg-[#FDFDFD] rounded-4xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 flex flex-col p-6 md:p-8 relative overflow-y-auto gap-6 [&::-webkit-scrollbar]:hidden " style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

        {/* Top Info Bar with Navigation */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 border border-slate-200 rounded-2xl px-5 py-3 bg-white shadow-sm">
              <h2 className="text-lg font-bold text-slate-800">Submission</h2>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Completed
              </span>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onPrev}
                className="px-3 py-2 rounded-2xl font-bold transition-colors bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm"
              >
                Prev
              </button>
              <button
                disabled={true}
                className="px-3 py-2 rounded-2xl font-bold transition-colors bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
          <span className="text-slate-400 font-medium text-sm tracking-wide pr-2">Done</span>
        </div>

        {/* Main Content Centered */}
        <div className="flex-1 flex flex-col items-center py-4">
          <div className="my-auto flex flex-col items-center gap-6 w-full">

            <div className="bg-green-50 p-5 md:p-6 rounded-full border border-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 md:h-16 md:w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 text-center">Exam Completed!</h2>
            <p className="text-slate-500 text-center text-base md:text-xl max-w-4xl px-8">
              You have successfully answered all questions. You can now download your filled question paper or go back to review your answers.
            </p>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 mt-2">
              <button
                onClick={onPrev}
                className="px-5 py-3 md:px-6 md:py-4 rounded-2xl font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm transition-all text-sm md:text-base"
              >
                Go Back to Review
              </button>
              <button
                onClick={onDownload}
                className="px-5 py-3 md:px-6 md:py-4 rounded-2xl font-bold bg-[#1A1A1A] text-white border border-[#333] shadow-md hover:bg-black transition-all flex items-center gap-2 text-sm md:text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamCompletedScreen;
