import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import ComposePaperSection from '../components/teacher/ComposePaperSection';
import UploadEvaluatedPaperSection from '../components/teacher/UploadEvaluatedPaperSection';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const displayName = user?.name || user?.username || 'Teacher';

  const [activeView, setActiveView] = useState('compose'); // 'compose' | 'upload'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [availablePapers, setAvailablePapers] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);

  const fetchAvailablePapers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/papers`);
      if (Array.isArray(res.data)) {
        setAvailablePapers(res.data);
      } else {
        setAvailablePapers([]);
      }
    } catch (err) {
      console.error('Failed to fetch available papers:', err);
      setAvailablePapers([]);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const stuRes = await axios.get(`${API_BASE_URL}/api/students`);
      if (Array.isArray(stuRes.data)) {
        const normalizedStudents = stuRes.data.map((s) => ({
          id: String(s.id),
          name: s.name || s.Username || s.username || `Student #${s.id}`,
        }));
        setAvailableStudents(normalizedStudents);
      } else {
        setAvailableStudents([]);
      }
    } catch (err) {
      console.error('Failed to fetch available students:', err);
      setAvailableStudents([]);
    }
  };

  useEffect(() => {
    fetchAvailablePapers();
    fetchAvailableStudents();
  }, []);

  useEffect(() => {
    if (activeView === 'upload') {
      fetchAvailablePapers();
      fetchAvailableStudents();
    }
  }, [activeView]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePaperCreated = async () => {
    await fetchAvailablePapers();
  };

  return (
    <div className="min-h-dvh w-full flex flex-col bg-[#f5f5f5] text-[#292524] relative overflow-x-hidden font-sans selection:bg-[#292524] selection:text-white">
      {/* Decorative Blur Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-32 right-1/4 w-150 h-150 rounded-full opacity-35 blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, #c8b8e0 0%, #a8c8e8 45%, transparent 75%)',
          }}
        />
        <div
          className="absolute top-110 -left-32 w-135 h-135 rounded-full opacity-25 blur-3xl"
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
            <span className="hidden sm:inline-block w-px h-4 bg-[#e7e5e4]" aria-hidden="true" />
            <span className="hidden sm:inline-flex items-center text-[12px] font-semibold tracking-[0.08em] uppercase px-3 py-1 rounded-full bg-[#f0efed] text-[#0c0a09]">
              Paper Studio
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <nav
            aria-label="Teacher dashboard sections"
            className="hidden md:flex items-center p-1 rounded-full bg-[#f0efed] border border-[#e7e5e4]"
          >
            {[
              { id: 'compose', label: 'Compose Paper' },
              { id: 'upload', label: 'Upload Paper' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={`h-8 px-4 rounded-full text-[13px] font-medium transition-all active:scale-[0.98] ${activeView === tab.id
                  ? 'bg-[#292524] text-white shadow-2xs'
                  : 'text-[#4e4e4e] hover:text-[#0c0a09]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* User Account Menu */}
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
                      Faculty Account
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
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-16 flex-1 flex flex-col gap-8 z-10">
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2">
          <div className="max-w-2xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#f0efed] text-[12px] font-semibold tracking-[0.08em] uppercase text-[#0c0a09] mb-4">
              {activeView === 'compose' ? 'Assessment Authoring' : 'Evaluated Scripts'}
            </span>
            {activeView === 'compose' ? (
              <>
                <h1 className="font-serif font-light text-4xl sm:text-5xl text-[#0c0a09] tracking-[-0.03em] leading-[1.1] pb-1">
                  Compose an <span className="italic font-light">examination paper</span>.
                </h1>
                <p className="text-[16px] text-[#4e4e4e] leading-relaxed mt-2.5 max-w-[60ch]">
                  Define paper details, configure objective and subjective questions with marks, and generate a fillable PDF worksheet.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-serif font-light text-4xl sm:text-5xl text-[#0c0a09] tracking-[-0.03em] leading-[1.1] pb-1">
                  Upload an <span className="italic font-light">evaluated paper</span>.
                </h1>
                <p className="text-[16px] text-[#4e4e4e] leading-relaxed mt-2.5 max-w-[60ch]">
                  Choose the examination paper and student, enter the total marks obtained, and upload the evaluated PDF answer sheet.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 md:hidden">
            {[
              { id: 'compose', label: 'Compose Paper' },
              { id: 'upload', label: 'Upload Paper' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={`h-9 px-3.5 rounded-full text-[13px] font-medium border transition-all active:scale-[0.98] ${activeView === tab.id
                  ? 'bg-[#292524] text-white border-[#292524]'
                  : 'bg-white text-[#4e4e4e] border-[#d6d3d1]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* View Switching */}
        {activeView === 'compose' && (
          <ComposePaperSection onPaperCreated={handlePaperCreated} />
        )}

        {activeView === 'upload' && (
          <UploadEvaluatedPaperSection
            availablePapers={availablePapers}
            availableStudents={availableStudents}
          />
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;

