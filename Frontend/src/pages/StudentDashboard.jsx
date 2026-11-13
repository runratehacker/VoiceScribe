import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { normalizeQuestionsData } from '../hooks/usePaperQuestions';


const ORB_GRADIENTS = [
  'radial-gradient(circle at center, #c8b8e0 0%, #a8c8e8 50%, transparent 75%)',
  'radial-gradient(circle at center, #f4c5a8 0%, #a7e5d3 50%, transparent 75%)',
  'radial-gradient(circle at center, #e8b8c4 0%, #c8b8e0 50%, transparent 75%)',
  'radial-gradient(circle at center, #a7e5d3 0%, #a8c8e8 50%, transparent 75%)',
];

const formatEvaluatedDate = (rawDate) => {

  if (!rawDate) return 'Graded';

  const normalized = String(rawDate).trim().replace(' ', 'T');
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return String(rawDate).split(' ')[0];
  }

  return parsed.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

};

const StudentDashboard = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState('questionnaires');
  const [papersProgressMap, setPapersProgressMap] = useState({});
  const [currentProgress, setCurrentProgress] = useState({
    name: 'Loading...',
    total: 0,
    completed: 0,
    pending: 0,
    formId: null
  });

  const [evaluatedPapersRaw, setEvaluatedPapersRaw] = useState({
    signedUrl: [],
    paperids: [],
    total_marks: [],
    created_at: [],
  });

  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/papers`);
        const data = response.data;
        const papersList = Array.isArray(data) ? data : [];
        setForms(papersList);

        // Compute saved progress from localStorage for all forms
        const progressMap = {};
        papersList.forEach(form => {
          const savedData = localStorage.getItem(`formFields_${form.id}`);
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData);
              const keys = Object.keys(parsed).filter(
                k => parsed[k]?.label || parsed[k]?.question_number !== undefined
              );
              const total = keys.length;
              const completed = keys.filter(k => parsed[k]?.filled).length;
              if (total > 0) {
                progressMap[form.id] = {
                  total,
                  completed,
                  percentage: Math.round((completed / total) * 100)
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
          const currentForm = papersList.find(f => String(f.id) === String(lastActiveId)) || papersList[0];

          let fields = null;
          try {
            const fieldsRes = await axios.get(`${API_BASE_URL}/api/questions/${currentForm.id}`);
            const rawFields = fieldsRes.data;
            fields = normalizeQuestionsData(rawFields, currentForm.id);

            const savedData = localStorage.getItem(`formFields_${currentForm.id}`);
            if (savedData) {
              try {
                const parsedSavedData = JSON.parse(savedData);
                Object.keys(fields).forEach(key => {
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
              k => fields[k]?.label || fields[k]?.question_number !== undefined
            );
            const total = keys.length;
            const completed = keys.filter(k => fields[k].filled).length;

            setCurrentProgress({
              name: currentForm.name,
              total,
              completed,
              pending: total - completed,
              formId: currentForm.id
            });

            setPapersProgressMap(prev => ({
              ...prev,
              [currentForm.id]: {
                total,
                completed,
                percentage: total > 0 ? Math.round((completed / total) * 100) : 0
              }
            }));
          } else {
            const savedStats = progressMap[currentForm.id];
            setCurrentProgress({
              name: currentForm.name,
              total: savedStats?.total || 0,
              completed: savedStats?.completed || 0,
              pending: (savedStats?.total || 0) - (savedStats?.completed || 0),
              formId: currentForm.id
            });
          }
        }
        try {
          const evalRes = await axios.get(`${API_BASE_URL}/api/evaluated/student`);
          const evalData = evalRes.data;
          setEvaluatedPapersRaw({
            signedUrl: Array.isArray(evalData.signedUrl) ? evalData.signedUrl : [],
            paperids: Array.isArray(evalData.paperids) ? evalData.paperids : [],
            total_marks: Array.isArray(evalData.total_marks) ? evalData.total_marks : [],
            created_at: Array.isArray(evalData.created_at) ? evalData.created_at : [],
          });
        } catch (evalErr) {
          console.error('Error fetching evaluated papers:', evalErr);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Evaluated papers mapped from /api/evaluated/student/:studentid
  const attemptedPapers = useMemo(() => {
    const { signedUrl = [], paperids = [], total_marks = [], created_at = [] } = evaluatedPapersRaw;
    return signedUrl.map((url, idx) => {
      const paperId = paperids[idx];
      const marks = total_marks[idx];
      const rawDate = created_at[idx];
      const matchedPaper = forms.find((f) => String(f.id) === String(paperId));
      return {
        id: `eval-${paperId ?? idx}-${idx}`,
        paperId,
        name: matchedPaper?.name || `Paper #${paperId ?? idx + 1}`,
        tag: matchedPaper?.subject || matchedPaper?.tag || 'Assessment',
        date: formatEvaluatedDate(rawDate || matchedPaper?.end_date),
        score: marks ?? 0,
        total: Number(matchedPaper?.max_marks) || 50,
        status: 'Graded',
        signedUrl: url,
      };
    });
  }, [evaluatedPapersRaw, forms]);

  // Categories list dynamically including any subject from the papers table
  const categories = useMemo(() => {
    const base = ['All', 'Mathematics', 'Science', 'Social Science'];
    forms.forEach(f => {
      const subj = f.subject || f.tag;
      if (subj && !base.some(c => c.toLowerCase() === subj.toLowerCase())) {
        base.push(subj);
      }
    });
    return base;
  }, [forms]);

  // Category counts
  const getCategoryCount = (cat) => {
    if (cat === 'All') return forms.length;
    return forms.filter(f => {
      const subj = f.subject || f.tag;
      return subj && subj.toLowerCase() === cat.toLowerCase();
    }).length;
  };

  // Filtered forms based on category and search
  const filteredForms = useMemo(() => {
    return forms.filter(form => {
      const subj = form.subject || form.tag || '';
      const matchesCategory = selectedCategory === 'All' ||
        subj.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = !searchQuery ||
        (form.name && form.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        subj.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [forms, selectedCategory, searchQuery]);

  const completionPercentage = currentProgress.total > 0
    ? Math.round((currentProgress.completed / currentProgress.total) * 100)
    : 0;

  const displayName = user?.name || user?.username || 'Student';
  const latestTranscript = attemptedPapers[0];
  const archivedTranscripts = attemptedPapers;

  return (
    <div className="min-h-dvh w-full flex flex-col bg-[#f5f5f5] text-[#292524] relative overflow-x-hidden font-sans selection:bg-[#292524] selection:text-white">

      {/* Atmospheric Pastel Gradient Orbs (ElevenLabs signature visual voltage) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-32 right-1/4 w-160 h-160 rounded-full opacity-35 blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, #c8b8e0 0%, #a8c8e8 45%, transparent 75%)'
          }}
        />
        <div
          className="absolute top-96 -left-32 w-135 h-135 rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, #f4c5a8 0%, #a7e5d3 45%, transparent 75%)'
          }}
        />
        <div
          className="absolute bottom-12 right-12 w-110 h-110 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, #e8b8c4 0%, transparent 70%)'
          }}
        />
      </div>


      {/* FLOATING TOP NAVIGATION BAR                                               */}

      <div className="sticky top-3 sm:top-4 z-40 w-full max-w-7xl mx-auto px-4 sm:px-6 transition-all">
        <header className="w-full bg-white/90 backdrop-blur-md rounded-[22px] border border-[#e7e5e4] shadow-[0_4px_20px_rgba(0,0,0,0.03)] px-5 sm:px-6 py-3 flex items-center justify-between gap-4 transition-all">

          {/* Left: Brand Monogram & Wordmark */}
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
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#f0efed] text-[#292524]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
              STUDENT DESK
            </span>
          </div>

          {/* Right: Actions & User Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 h-9 pl-1.5 pr-3 rounded-full bg-[#fafafa] hover:bg-white border border-[#e7e5e4] hover:border-[#d6d3d1] transition-all text-[14px] text-[#292524] active:scale-[0.99] shadow-2xs"
                aria-label="User account menu"
                aria-expanded={isDropdownOpen}
              >
                <span className="w-6.5 h-6.5 rounded-full bg-[#292524] text-white flex items-center justify-center shrink-0">
                  <span className="flex items-center gap-0.5" aria-hidden="true">
                    <span className="w-[1.5px] h-2 bg-white rounded-full" />
                    <span className="w-[1.5px] h-3 bg-white rounded-full" />
                    <span className="w-[1.5px] h-1.5 bg-white rounded-full" />
                  </span>
                </span>
                <span className="font-medium hidden sm:inline text-[13.5px] text-[#0c0a09]">
                  {displayName}
                </span>
                <svg className={`w-3.5 h-3.5 text-[#777169] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-60 bg-white rounded-[20px] shadow-[0_12px_36px_rgba(0,0,0,0.08)] border border-[#e7e5e4] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-[#f0efed]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] text-[#777169] uppercase tracking-wider font-semibold">Account</p>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#f0efed] text-[#0c0a09]">
                        <span className="w-1 h-1 rounded-full bg-[#0c0a09]" />
                        Verified
                      </span>
                    </div>
                    <p className="text-[14.5px] font-medium text-[#0c0a09] truncate">{displayName}</p>
                    <p className="text-[12px] text-[#777169] mt-0.5">Role: Student</p>
                  </div>

                  <div className="pt-1.5 px-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-[13.5px] text-[#dc2626] hover:bg-[#fef2f2] rounded-xl flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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

      {/* Main Container */}
      <main className="w-full max-w-7xl mx-auto px-6 pt-7 sm:pt-15 pb-15 flex-1 flex flex-col gap-12 z-10">


        {/* EDITORIAL HERO HEADER SECTION (Waldenburg Light 300 & Stat Trio)        */}

        <section className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-3 pt-1">
          <div
            className="absolute -top-16 -left-16 w-96 h-96 rounded-full opacity-35 blur-3xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, #c8b8e0 0%, #a8c8e8 45%, transparent 75%)'
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-2xl">
            {/* Editorial Eyebrow Badge Pill (Restrained: 1 on page) */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#e7e5e4] text-[11px] font-semibold tracking-[0.18em] uppercase text-[#777169] mb-6 shadow-2xs backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
              <span>ORAL ASSESSMENT SUITE</span>
            </div>

            {/* Editorial Display Headline (Waldenburg Light 300) */}
            <h1 className="font-serif font-light text-4xl sm:text-5xl lg:text-[62px] text-[#0c0a09] tracking-[-0.035em] leading-[1.1] pb-1">
              Welcome back, <span className="italic font-light">{displayName}</span>.
            </h1>

            {/* Editorial Subtext */}
            <p className="text-[16px] sm:text-[17.5px] text-[#4e4e4e] leading-relaxed mt-3 max-w-xl font-normal">
              Dictate answers naturally using spoken voice. Review assigned worksheets, resume ongoing sessions, and download certified evaluation transcripts.
            </p>
          </div>

          {/* Elevated High-Craft Editorial Metrics Trio */}
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
                  {attemptedPapers.filter(p => p.status === 'Graded').length}
                </span>
              </div>
              <span className="text-[11px] text-[#0c0a09] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                Verified scores
              </span>
            </div>
          </div>
        </section>

        {/* Featured In-Progress Assessment Card (ElevenLabs gradient-orb-card) */}
        {currentProgress.formId && (
          <section className="relative overflow-hidden bg-white rounded-3xl border border-[#e7e5e4] shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-8 sm:p-10">
            <div
              className="absolute -top-16 -right-16 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, #c8b8e0 0%, #f4c5a8 50%, transparent 75%)'
              }}
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3.5 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold tracking-wider uppercase bg-[#f0efed] text-[#292524]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                    Active Session
                  </span>
                  <span className="text-[14px] text-[#777169] font-medium">
                    {currentProgress.completed} of {currentProgress.total} Questions Answered
                  </span>
                </div>

                <h2 className="font-serif font-light text-2xl sm:text-[34px] text-[#0c0a09] tracking-[-0.02em] mb-4 leading-snug">
                  {currentProgress.name}
                </h2>

                <div className="max-w-lg">
                  <div className="w-full h-1.5 rounded-full bg-[#e7e5e4] overflow-hidden mb-2.5">
                    <div
                      className="h-full bg-[#292524] rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[13.5px] text-[#4e4e4e] font-medium">
                    <span>{completionPercentage}% complete</span>
                    <span>{currentProgress.pending} remaining</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5 shrink-0">
                <div className="hidden sm:flex items-center gap-1.5 h-9 px-4 py-1.5 bg-[#f0efed] rounded-full" aria-hidden="true">
                  <span className="w-0.5 h-3.5 bg-[#292524] rounded-full animate-pulse" />
                  <span className="w-0.5 h-6 bg-[#292524] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-0.5 h-2.5 bg-[#292524] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  <span className="w-0.5 h-7 bg-[#292524] rounded-full animate-pulse" style={{ animationDelay: '75ms' }} />
                  <span className="w-0.5 h-4 bg-[#292524] rounded-full animate-pulse" style={{ animationDelay: '220ms' }} />
                </div>

                <button
                  onClick={() => navigate(`/fillform/${currentProgress.formId}`)}
                  className="h-11 px-6 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[15px] font-medium transition-all active:scale-[0.98] flex items-center gap-2.5 shadow-sm"
                >
                  <span>Resume Paper</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </section>
        )}


        {/* MAIN WORKSPACE SPLIT: AVAILABLE PAPERS  & COMPLETED PAPERS  */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">


          {/* LEFT COLUMN : AVAILABLE PAPERS  */}

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

                {/*  Text-Input Search */}
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

              {/* Category Filter Pills Row (Full Width, No Clipping) */}
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
              /* Skeletal Loaders Matching Final Bento Card Layout */
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

                        {/* voice-icon-circular (32px) */}
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

                      {/* Bottom Row: Hairline Divider, Total Marks + Question Count & Single Action Verb CTA */}
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


          {/* RIGHT COLUMN : COMPLETED PAPERS (Featured + Voice Rows)     */}

          <aside id="completed-transcripts" className="lg:col-span-5 flex flex-col gap-6">

            {/* Vertically Stacked Section Header */}
            <div className="flex items-baseline justify-between gap-4 pb-1">
              <div>
                <h2 className="font-serif font-light text-[28px] sm:text-[40px] text-[#0c0a09] tracking-tight leading-[1.15]">
                  Completed Papers
                </h2>
                <p className="text-[15px] text-[#777169] mt-1.5">
                  Verified oral transcripts and evaluation scores.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full bg-white border border-[#e7e5e4] text-[#292524] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                {attemptedPapers.length} Graded
              </span>
            </div>

            {/* Featured Latest Evaluated Spotlight Card (gradient-orb-card) */}
            {latestTranscript && (
              <div className="relative overflow-hidden bg-white rounded-2xl border border-[#e7e5e4] p-6 sm:p-7 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                <div
                  className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-35 blur-2xl pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center, #a7e5d3 0%, #a8c8e8 50%, transparent 75%)'
                  }}
                  aria-hidden="true"
                />

                <div className="relative z-10 flex items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f0efed] text-[#0c0a09] text-[11px] font-semibold uppercase tracking-[0.08em] mb-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                      Latest Evaluation
                    </div>
                    <h3 className="font-serif font-light text-[24px] text-[#0c0a09] tracking-[-0.02em] leading-snug">
                      {latestTranscript.name}
                    </h3>
                    <p className="text-[13.5px] text-[#777169] mt-0.5">
                      {latestTranscript.tag} · {latestTranscript.date}
                    </p>
                  </div>

                  {/* Editorial Display Score */}
                  <div className="text-right shrink-0">
                    <div className="font-serif font-light text-3xl sm:text-4xl text-[#0c0a09] leading-none">
                      {latestTranscript.score}
                      <span className="text-[16px] text-[#777169] font-sans font-normal">/{latestTranscript.total}</span>
                    </div>
                    <span className="text-[11px] text-[#777169] font-medium mt-1 block">
                      Certified Score
                    </span>
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-[#f0efed] flex items-center justify-between gap-4">
                  <span className="text-[12.5px] text-[#4e4e4e] flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                    Transcript ready for PDF export
                  </span>
                  <a
                    href={latestTranscript.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="h-9 px-4 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[13px] font-medium transition-all flex items-center gap-2 active:scale-[0.98] shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>
            )}

            {/* Archive Transcripts List ( voice-row inside surface-card) */}
            <div className="bg-white rounded-2xl border border-[#e7e5e4] shadow-[0_4px_16px_rgba(0,0,0,0.02)] p-6 sm:p-7 flex flex-col">
              <div className="flex items-center justify-between pb-3.5 mb-1 border-b border-[#e7e5e4]">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#777169]">
                  Transcript Archive
                </span>
                <span className="text-[12px] font-medium text-[#777169]">
                  Score · Export
                </span>
              </div>

              {archivedTranscripts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[14px] text-[#777169]">No evaluated papers available yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f0efed]">
                  {archivedTranscripts.map((paper) => (
                    <div
                      key={paper.id}
                      className="py-3.5 last:pb-0 flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/*  voice-icon-circular (32px) */}
                        <div className="w-8 h-8 rounded-full bg-[#f0efed] group-hover:bg-[#292524] text-[#292524] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-[15px] font-medium text-[#0c0a09] truncate">
                            {paper.name}
                          </h4>
                          <p className="text-[13px] text-[#777169] mt-0.5">
                            {paper.tag} · {paper.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 shrink-0">
                        <div className="text-right">
                          <span className="font-serif font-light text-[20px] text-[#0c0a09] tabular-nums">
                            {paper.score}
                          </span>
                          <span className="text-[12px] text-[#777169]">/{paper.total}</span>
                        </div>

                        <a
                          href={paper.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="h-8 px-3 rounded-full border border-[#d6d3d1] hover:border-[#0c0a09] hover:bg-[#292524] text-[#0c0a09] hover:text-white transition-all flex items-center gap-1.5 text-[12px] font-medium active:scale-[0.98]"
                          title={`Download PDF for ${paper.name}`}
                          aria-label={`Download PDF for ${paper.name}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span className="hidden sm:inline">PDF</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Re-evaluation Request Row */}
              <div className="mt-6 pt-4 border-t border-[#e7e5e4] flex items-center justify-between text-[13px] text-[#777169]">
                <span>Discrepancy in voice transcription?</span>
                <button
                  onClick={() => alert('Re-evaluation request submitted to faculty desk.')}
                  className="font-medium text-[#0c0a09] hover:underline cursor-pointer"
                >
                  Request review
                </button>
              </div>
            </div>

          </aside>

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
