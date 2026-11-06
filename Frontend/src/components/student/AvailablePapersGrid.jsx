import React from 'react';
import { useNavigate } from 'react-router-dom';

const ORB_GRADIENTS = [
  'radial-gradient(circle at center, #c8b8e0 0%, #a8c8e8 50%, transparent 75%)',
  'radial-gradient(circle at center, #f4c5a8 0%, #a7e5d3 50%, transparent 75%)',
  'radial-gradient(circle at center, #e8b8c4 0%, #c8b8e0 50%, transparent 75%)',
  'radial-gradient(circle at center, #a7e5d3 0%, #a8c8e8 50%, transparent 75%)',
];

const AvailablePapersGrid = ({
  filteredForms,
  loading,
  error,
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
  getCategoryCount,
  papersProgressMap,
}) => {
  const navigate = useNavigate();

  return (
    <section id="available-papers" className="lg:col-span-7 flex flex-col gap-6">
      {/* Section Header + Search Input & Wrapped Category Pills */}
      <div className="flex flex-col gap-4 pb-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-serif font-light text-[28px] sm:text-[40px] text-[#0c0a09] tracking-tight leading-[1.15]">
              Available Papers
            </h2>
            <p className="text-[15px] text-[#777169] mt-1.5">
              Select an assigned worksheet to launch the interactive voice studio.
            </p>
          </div>

          {/* Text-Input Search */}
          <div className="relative w-full sm:w-60 shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title..."
              aria-label="Filter available papers by title"
              className="w-full h-10 pl-9 pr-3.5 text-[13.5px] rounded-xl bg-white border border-[#d6d3d1] text-[#0c0a09] placeholder-[#777169] outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all"
            />
            <svg className="w-4 h-4 text-[#777169] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Category Filter Pills Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            const count = getCategoryCount(cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`h-9 px-3.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-1.5 active:scale-[0.98] ${isActive
                  ? 'bg-[#292524] text-white shadow-xs'
                  : 'bg-white text-[#777169] hover:text-[#0c0a09] border border-[#e7e5e4] hover:border-[#d6d3d1]'
                  }`}
              >
                <span>{cat}</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full tabular-nums ${isActive ? 'bg-white/20 text-white' : 'bg-[#f0efed] text-[#777169]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Papers Content States */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((item, idx) => (
            <div
              key={item}
              className={`bg-white rounded-2xl border border-[#e7e5e4] p-6 flex flex-col justify-between gap-6 animate-pulse ${idx === 0 ? 'md:col-span-2' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="h-6 w-24 bg-[#f0efed] rounded-full" />
                <div className="h-8 w-8 bg-[#f0efed] rounded-full" />
              </div>
              <div className="space-y-2.5">
                <div className="h-6 w-2/3 bg-[#f0efed] rounded-md" />
                <div className="h-4 w-full bg-[#f5f5f5] rounded-md" />
              </div>
              <div className="pt-4 border-t border-[#f0efed] flex items-center justify-between">
                <div className="h-4 w-28 bg-[#f0efed] rounded-md" />
                <div className="h-9 w-24 bg-[#f0efed] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-[#fef2f2] text-[#dc2626] text-[14px] border border-[#fecaca] flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-1.5 rounded-full bg-white border border-[#fecaca] text-[#dc2626] text-[12px] font-medium hover:bg-[#fef2f2]"
          >
            Retry
          </button>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e7e5e4] p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f0efed] text-[#292524] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-[16px] font-medium text-[#0c0a09]">No matching papers found</p>
          <p className="text-[14px] text-[#777169] max-w-xs">
            Try clearing your search filter or selecting a different subject category.
          </p>
          {(selectedCategory !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-2 h-9 px-4 rounded-full bg-[#292524] text-white text-[13px] font-medium hover:bg-[#0c0a09] transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredForms.map((form, index) => {
            const isFeaturedTile = index === 0 && filteredForms.length % 2 !== 0;
            const paperStats = papersProgressMap[form.id];
            const hasStarted = paperStats && paperStats.completed > 0;
            const isTinted = index % 3 === 1;

            return (
              <article
                key={form.id}
                onClick={() => navigate(`/fillform/${form.id}`)}
                className={`group relative overflow-hidden cursor-pointer rounded-2xl p-6 border border-[#e7e5e4] hover:border-[#0c0a09] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between gap-6 ${isFeaturedTile ? 'md:col-span-2' : ''
                  } ${isTinted ? 'bg-[#fafafa]' : 'bg-white'}`}
              >
                {/* Subtle atmospheric pastel orb on featured or alternate cards */}
                {(isFeaturedTile || index % 2 === 0) && (
                  <div
                    className="absolute -top-20 -right-20 w-52 h-52 rounded-full opacity-30 group-hover:opacity-45 blur-2xl pointer-events-none transition-opacity"
                    style={{ background: ORB_GRADIENTS[index % ORB_GRADIENTS.length] }}
                    aria-hidden="true"
                  />
                )}

                {/* Top Row: Subject Badge Pill & Voice-Icon Circular Plate */}
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 bg-[#f0efed] text-[#0c0a09] text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-[0.08em]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                      {form.subject || form.tag || 'Assessment'}
                    </span>
                    {hasStarted && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-[#e7e5e4] text-[#292524]">
                        {paperStats.percentage}% recorded
                      </span>
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[#f0efed] group-hover:bg-[#292524] text-[#292524] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                    <div className="flex items-center gap-0.5" aria-hidden="true">
                      <span className="w-[1.5px] h-2.5 bg-current rounded-full" />
                      <span className="w-[1.5px] h-3.5 bg-current rounded-full" />
                      <span className="w-[1.5px] h-2 bg-current rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Middle Row: Editorial Serif Headline & Description */}
                <div className="relative z-10">
                  <h3 className={`font-serif font-light text-[#0c0a09] tracking-[-0.02em] leading-[1.2] mb-2 ${isFeaturedTile ? 'text-[26px] sm:text-[32px]' : 'text-[22px] sm:text-[28px]'
                    }`}>
                    {form.name}
                  </h3>
                  <p className="text-[14.5px] text-[#4e4e4e] leading-relaxed line-clamp-2 max-w-xl">
                    {form.description || 'Structured oral evaluation worksheet with automated speech transcription.'}
                  </p>
                </div>

                {/* Bottom Row */}
                <div className="relative z-10 pt-4 border-t border-[#f0efed] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-[13px] text-[#777169] font-medium tabular-nums">
                    {form.max_marks !== undefined && form.max_marks !== null && (
                      <>
                        <span className="text-[#292524] font-medium">
                          {form.max_marks} Marks
                        </span>
                        <span className="text-[#d6d3d1]" aria-hidden="true">·</span>
                      </>
                    )}
                    <span>
                      {paperStats?.total
                        ? `${paperStats.completed}/${paperStats.total} answered`
                        : 'Voice evaluation'}
                    </span>
                  </div>

                  <span className="h-9 px-4 rounded-full bg-white border border-[#d6d3d1] group-hover:border-[#0c0a09] group-hover:bg-[#292524] text-[#0c0a09] group-hover:text-white transition-all text-[13px] font-medium inline-flex items-center gap-1.5 shrink-0 active:scale-[0.98]">
                    <span>{hasStarted ? 'Resume Paper' : 'Start Paper'}</span>
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AvailablePapersGrid;

