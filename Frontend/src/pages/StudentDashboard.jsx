import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { normalizeQuestionsData } from '../hooks/useFormFields';
import ActiveExamBanner from '../components/student/ActiveExamBanner';
import AvailablePapersGrid from '../components/student/AvailablePapersGrid';
import CompletedTranscriptsSection from '../components/student/CompletedTranscriptsSection';

const StudentDashboard = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [papersProgressMap, setPapersProgressMap] = useState({});
  const [currentProgress, setCurrentProgress] = useState({
    name: 'Loading...',
    total: 0,
    completed: 0,
    pending: 0,
    formId: null,
  });

  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const displayName = user?.name || user?.username || 'Student';

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/papers`);
        if (!response.ok) {
          throw new Error('Failed to fetch question papers');
        }
        const data = await response.json();
        const papersList = Array.isArray(data) ? data : [];
        setForms(papersList);

        // Compute saved progress from localStorage for all forms
        const progressMap = {};
        papersList.forEach((form) => {
          const savedData = localStorage.getItem(`formFields_${form.id}`);
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData);
              const keys = Object.keys(parsed).filter(
                (k) => parsed[k]?.label || parsed[k]?.question_number !== undefined
              );
              const total = keys.length;
              const completed = keys.filter((k) => parsed[k]?.filled).length;
              if (total > 0) {
                progressMap[form.id] = {
                  total,
                  completed,
                  percentage: Math.round((completed / total) * 100),
                };
              }
            } catch (e) {
              // ignore corrupt localStorage
            }
          }
        });
        setPapersProgressMap(progressMap);

        if (papersList.length > 0) {
          const lastActiveId = localStorage.getItem('lastActiveFormId') || papersList[0].id;
          const currentForm = papersList.find((f) => String(f.id) === String(lastActiveId)) || papersList[0];

          let fields = null;
          try {
            const fieldsRes = await fetch(`${API_BASE_URL}/api/questions/${currentForm.id}`);
            const rawFields = await fieldsRes.json();
            fields = normalizeQuestionsData(rawFields, currentForm.id);

            const savedData = localStorage.getItem(`formFields_${currentForm.id}`);
            if (savedData) {
              try {
                const parsedSavedData = JSON.parse(savedData);
                Object.keys(fields).forEach((key) => {
                  if (parsedSavedData[key] && fields[key].type === parsedSavedData[key].type) {
                    fields[key].filled = parsedSavedData[key].filled;
                    fields[key].value = parsedSavedData[key].value;
                  }
                });
              } catch (e) {
                console.error('Error parsing localStorage data', e);
              }
            }
          } catch (e) {
            console.log(e);
          }

          if (fields && Object.keys(fields).length > 0) {
            const keys = Object.keys(fields).filter(
              (k) => fields[k]?.label || fields[k]?.question_number !== undefined
            );
            const total = keys.length;
            const completed = keys.filter((k) => fields[k].filled).length;

            setCurrentProgress({
              name: currentForm.name,
              total,
              completed,
              pending: total - completed,
              formId: currentForm.id,
            });

            setPapersProgressMap((prev) => ({
              ...prev,
              [currentForm.id]: {
                total,
                completed,
                percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
              },
            }));
          } else {
            const savedStats = progressMap[currentForm.id];
            setCurrentProgress({
              name: currentForm.name,
              total: savedStats?.total || 0,
              completed: savedStats?.completed || 0,
              pending: (savedStats?.total || 0) - (savedStats?.completed || 0),
              formId: currentForm.id,
            });
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Attempted papers history dataset
  const attemptedPapers = [
    { id: 101, name: 'Factorization Worksheet', tag: 'Mathematics', date: 'Oct 24', score: 92, total: 100, status: 'Graded' },
    { id: 102, name: 'Physics Kinetics', tag: 'Science', date: 'Oct 12', score: 85, total: 100, status: 'Graded' },
    { id: 103, name: 'Grammar Assessment', tag: 'English', date: 'Oct 05', score: 78, total: 100, status: 'Graded' },
    { id: 104, name: 'World History Midterm', tag: 'History', date: 'Sep 28', score: 95, total: 100, status: 'Graded' },
    { id: 105, name: 'Basic Chemistry Lab', tag: 'Science', date: 'Sep 15', score: 88, total: 100, status: 'Graded' },
  ];

  // Categories list dynamically including any subject from the papers table
  const categories = useMemo(() => {
    const base = ['All', 'Mathematics', 'Science', 'Social Science'];
    forms.forEach((f) => {
      const subj = f.subject || f.tag;
      if (subj && !base.some((c) => c.toLowerCase() === subj.toLowerCase())) {
        base.push(subj);
      }
    });
    return base;
  }, [forms]);

  const getCategoryCount = (category) => {
    if (category === 'All') return forms.length;
    return forms.filter((f) => {
      const subj = f.subject || f.tag || '';
      return subj.toLowerCase() === category.toLowerCase();
    }).length;
  };

  const filteredForms = useMemo(() => {
    return forms.filter((form) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        (form.subject && form.subject.toLowerCase() === selectedCategory.toLowerCase()) ||
        (form.tag && form.tag.toLowerCase() === selectedCategory.toLowerCase());

      const matchesSearch =
        !searchQuery ||
        (form.name && form.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [forms, selectedCategory, searchQuery]);

  const completionPercentage = currentProgress.total > 0
    ? Math.round((currentProgress.completed / currentProgress.total) * 100)
    : 0;

  const latestTranscript = attemptedPapers[0];
  const archivedTranscripts = attemptedPapers.slice(1);

  return (
    <div className="min-h-dvh w-full flex flex-col bg-[#f5f5f5] text-[#292524] relative overflow-x-hidden font-sans selection:bg-[#292524] selection:text-white">
      {/* Decorative Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-32 right-1/4 w-150 h-150 rounded-full opacity-35 blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, #c8b8e0 0%, #a8c8e8 45%, transparent 75%)',
          }}
        />
        <div
          className="absolute top-96 -left-32 w-140 h-140 rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, #f4c5a8 0%, #a7e5d3 45%, transparent 75%)',
          }}
        />
      </div>

      {/* Floating Navbar */}
      <div className="sticky top-3 sm:top-4 z-40 w-full max-w-7xl mx-auto px-4 sm:px-6">
        <header className="w-full h-15 bg-white/90 backdrop-blur-md rounded-full border border-[#e7e5e4] shadow-[0_4px_16px_rgba(0,0,0,0.03)] px-5 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="flex items-center gap-1 h-4 px-0.5" aria-hidden="true">
              <span className="w-0.5 h-3.5 bg-[#0c0a09] rounded-full" />
              <span className="w-0.5 h-5 bg-[#0c0a09] rounded-full" />
              <span className="w-0.5 h-2.5 bg-[#0c0a09] rounded-full" />
            </div>
            <span className="text-[15px] font-semibold tracking-[0.18em] text-[#0c0a09] uppercase select-none">
              VOICESCRIBE
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 h-9 pl-1.5 pr-3 rounded-full bg-[#fafafa] hover:bg-white border border-[#e7e5e4] hover:border-[#d6d3d1] transition-all text-[14px] text-[#292524] active:scale-[0.98]"
                aria-label="User account menu"
                aria-expanded={isDropdownOpen}
              >
                <span className="w-6.5 h-6.5 rounded-full bg-[#292524] text-white text-[12px] font-medium flex items-center justify-center shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium hidden sm:inline text-[13.5px] text-[#0c0a09]">
                  {displayName}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-[#777169] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#e7e5e4] py-2 z-50">
                  <div className="px-4 py-3 border-b border-[#f0efed]">
                    <p className="text-[11px] text-[#777169] uppercase tracking-[0.08em] font-semibold">
                      Student Account
                    </p>
                    <p className="text-[14.5px] font-medium text-[#0c0a09] truncate mt-0.5">{displayName}</p>
                  </div>
                  <div className="pt-1.5 px-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-[13.5px] text-[#dc2626] hover:bg-[#fef2f2] rounded-xl flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* Main Workspace */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-16 flex-1 flex flex-col gap-10 z-10">
        {/* Welcome Section & Overview Stats */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-2">
          <div className="max-w-2xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#f0efed] text-[12px] font-semibold tracking-[0.08em] uppercase text-[#0c0a09] mb-4">
              Academic Session 2025–2026
            </span>
            <h1 className="font-serif font-light text-4xl sm:text-6xl text-[#0c0a09] tracking-[-0.03em] leading-[1.08] pb-1">
              Welcome back, <span className="italic font-light">{displayName.split(' ')[0]}</span>.
            </h1>
            <p className="text-[17px] text-[#4e4e4e] leading-relaxed mt-3 max-w-[60ch]">
              Select an examination paper to launch your real-time voice-interactive assessment studio.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
            <div className="bg-white border border-[#e7e5e4] rounded-2xl p-4 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col justify-between min-w-26.5 sm:min-w-26.5">
              <span className="text-[11px] text-[#777169] uppercase tracking-wider font-semibold">Assigned</span>
              <div className="my-1.5">
                <span className="font-serif font-light text-3xl sm:text-4xl text-[#0c0a09] leading-none">
                  {forms.length}
                </span>
              </div>
              <span className="text-[11px] text-[#777169] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                Active papers
              </span>
            </div>

            <div className="bg-white border border-[#e7e5e4] rounded-2xl p-4 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col justify-between min-w-26.25 sm:min-w-26.25">
              <span className="text-[11px] text-[#777169] uppercase tracking-wider font-semibold">Completed</span>
              <div className="my-1.5">
                <span className="font-serif font-light text-3xl sm:text-4xl text-[#0c0a09] leading-none">
                  {attemptedPapers.length}
                </span>
              </div>
              <span className="text-[11px] text-[#777169] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                Submitted
              </span>
            </div>

            <div className="bg-white border border-[#e7e5e4] rounded-2xl p-4 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col justify-between min-w-26.25 sm:min-w-26.25">
              <span className="text-[11px] text-[#777169] uppercase tracking-wider font-semibold">Evaluated</span>
              <div className="my-1.5">
                <span className="font-serif font-light text-3xl sm:text-4xl text-[#0c0a09] leading-none">
                  {attemptedPapers.filter((p) => p.status === 'Graded').length}
                </span>
              </div>
              <span className="text-[11px] text-[#0c0a09] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                Verified scores
              </span>
            </div>
          </div>
        </section>

        {/* Featured In-Progress Assessment Card */}
        <ActiveExamBanner
          currentProgress={currentProgress}
          completionPercentage={completionPercentage}
        />

        {/* Split: Available Papers & Completed Papers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <AvailablePapersGrid
            filteredForms={filteredForms}
            loading={loading}
            error={error}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            getCategoryCount={getCategoryCount}
            papersProgressMap={papersProgressMap}
          />

          <CompletedTranscriptsSection
            attemptedPapers={attemptedPapers}
            latestTranscript={latestTranscript}
            archivedTranscripts={archivedTranscripts}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#e7e5e4] bg-[#f5f5f5] mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between text-[13px] text-[#777169] gap-4">
          <div>
            <span>VOICESCRIBE Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-[#0c0a09] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#0c0a09] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#0c0a09] transition-colors">Help Desk</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentDashboard;

