import React from 'react';
import LatexRenderer from './LatexRenderer';

const Objective = ({
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
  options = [],
  onSelectOption
}) => {
  const displayNumber = questionNumber || label || fieldKey;

  return (
    <div className="flex-1 w-full mx-auto flex flex-col mb-4 min-h-0">
      {/* Asymmetric Studio Split Layout Editorial Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1 min-h-0 items-stretch">

        {/* Left Column (7 cols): Question Prompt Reading Room */}
        <section className="lg:col-span-7 bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#e7e5e4] p-7 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle atmospheric corner gradient bloom */}
          <div
            className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #c8b8e0 0%, #a8c8e8 50%, transparent 75%)' }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col">
            {/* Question Meta Badge Bar */}
            <div className="flex items-center justify-between pb-5 border-b border-[#f0efed] mb-7 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-[0.08em] uppercase bg-[#f0efed] text-[#0c0a09]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                  Multiple Choice
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
            <h1 className="font-serif font-light text-2xl sm:text-3xl lg:text-[34px] text-[#0c0a09] leading-[1.2] tracking-tight pb-1 mb-6">
              <LatexRenderer text={question || label} />
            </h1>
          </div>

          {/* Voice Input Prompt Tip */}
          <div className="relative z-10 pt-5 border-t border-[#f0efed] flex items-center justify-between text-[13px] text-[#777169]">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
              <span className="font-medium text-[#292524]">Speak option letter or click any choice</span>
            </div>
            <span className="hidden sm:inline text-[#777169]">Instant capture</span>
          </div>
        </section>

        {/* Right Column (5 cols): Interactive Options Column */}
        <section className="lg:col-span-5 bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#e7e5e4] p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle atmospheric bottom-right gradient bloom */}
          <div
            className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full opacity-25 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #f4c5a8 0%, #a7e5d3 50%, transparent 75%)' }}
            aria-hidden="true"
          />

          {/* Top Header Bar */}
          <div className="relative z-10 flex items-center justify-between pb-5 border-b border-[#f0efed] mb-5 shrink-0">
            <div>
              <h2 className="font-serif font-light text-[24px] text-[#0c0a09] tracking-[-0.02em] leading-none">
                Answer Choices
              </h2>
              <p className="text-[13px] text-[#777169] mt-1.5">
                Choose one response below
              </p>
            </div>
            {value ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] px-3 py-1 rounded-full bg-[#292524] text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Option {String(value).trim().charAt(0).toUpperCase()}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] px-3 py-1 rounded-full bg-[#f0efed] text-[#777169]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                {options.length} Options
              </span>
            )}
          </div>

          {/* Balanced Vertical Stack of Tactile Option Cards */}
          <div className="relative z-10 flex-1 flex flex-col justify-center gap-3.5 overflow-y-auto py-1 scrollbar-none">
            {options.map((option, index) => {
              const trimmedValue = value ? String(value).trim().toUpperCase() : "";
              const optionLabelUpper = option.label ? String(option.label).trim().toUpperCase() : "";
              const isSelected = Boolean(
                trimmedValue && (
                  trimmedValue === optionLabelUpper ||
                  trimmedValue.startsWith(optionLabelUpper + '.') ||
                  trimmedValue.startsWith(optionLabelUpper + ')') ||
                  trimmedValue === `OPTION ${optionLabelUpper}`
                )
              );

              return (
                <button
                  type="button"
                  key={index}
                  onClick={() => onSelectOption && onSelectOption(isSelected ? '' : option.label)}
                  aria-pressed={isSelected}
                  className={`w-full text-left flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 cursor-pointer group active:scale-[0.99] ${isSelected
                    ? 'bg-[#292524] text-white border-[#0c0a09] shadow-[0_6px_20px_rgba(12,10,9,0.12)]'
                    : 'bg-white hover:bg-[#fafafa] text-[#0c0a09] border-[#e7e5e4] hover:border-[#0c0a09] shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
                    }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Option Letter Circular Plate */}
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-serif text-[13px] shrink-0 transition-colors ${isSelected
                        ? 'bg-white text-[#0c0a09] font-medium'
                        : 'bg-[#f0efed] group-hover:bg-[#292524] text-[#0c0a09] group-hover:text-white font-normal'
                        }`}
                    >
                      {option.label}
                    </span>

                    {/* Option Content with LaTeX Support */}
                    <span
                      className={`text-[16px] sm:text-[17px] leading-snug whitespace-normal flex-1 ${isSelected ? 'text-white font-medium' : 'text-[#0c0a09] font-normal'
                        }`}
                    >
                      <LatexRenderer text={option.text} />
                    </span>
                  </div>

                  {/* Right Tactile Radio Indicator */}
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${isSelected
                      ? 'bg-white text-[#0c0a09]'
                      : 'border border-[#d6d3d1] group-hover:border-[#0c0a09] bg-transparent'
                      }`}
                    aria-hidden="true"
                  >
                    {isSelected ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09] opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Status Footer */}
          <div className="relative z-10 pt-5 border-t border-[#f0efed] mt-5 flex items-center justify-between text-[13px] text-[#777169] shrink-0">
            <span>Say &ldquo;Option A&rdquo; or click to choose</span>
            <span className="inline-flex items-center gap-1.5 text-[#0c0a09] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
              Synced
            </span>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Objective;
