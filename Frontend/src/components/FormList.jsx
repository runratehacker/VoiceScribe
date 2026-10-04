import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const FormList = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentProgress, setCurrentProgress] = useState({
    name: 'Loading...',
    total: 0,
    completed: 0,
    pending: 0,
    formId: null
  });
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/forms`);
        if (!response.ok) {
          throw new Error('Failed to fetch question papers');
        }
        const data = await response.json();
        setForms(data);

        if (data.length > 0) {
          const lastActiveId = localStorage.getItem('lastActiveFormId') || data[0].id;
          const currentForm = data.find(f => String(f.id) === String(lastActiveId)) || data[0];

          let fields = null;
          try {
            const fieldsRes = await fetch(`${API_BASE_URL}/api/fields/${currentForm.id}`);
            fields = await fieldsRes.json();

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
                console.error("Error parsing localStorage data", e);
              }
            }
          } catch (e) {
            console.log(e);
          }

          if (fields) {
            const keys = Object.keys(fields).filter(k => fields[k].label);
            const total = keys.length;
            const completed = keys.filter(k => fields[k].filled).length;

            setCurrentProgress({
              name: currentForm.name,
              total,
              completed,
              pending: total - completed,
              formId: currentForm.id
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

  return (
    <div className="h-screen w-full overflow-hidden bg-[#F3F4F8] p-4 md:p-6 flex flex-col font-sans text-slate-800">

      {/* Top Navigation */}
      <nav className="w-full flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#EA580C] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">VOICE SCRIBE</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
          <a href="#" className="text-slate-800 border-b-2 border-slate-800 pb-1 text-lg">Question Papers</a>
        </div>

        <div className="flex items-center gap-4">

          <button className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </button>
          <button className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center  hover:ring-2 hover:ring-[#EA580C] hover:text-[#EA580C] transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Layout Area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col lg:flex-row gap-8 px-2 pb-4">

        {/* Left Column */}
        <div className="w-full lg:w-7/12 flex flex-col gap-6">

          {/* Previous Attempted Papers Card */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 flex-1 relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-slate-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <h2 className="text-2xl font-bold">Attempted Papers</h2>
              </div>
              <button className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                View History
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
              {[
                { id: 101, name: 'Factoization WS', tag: 'Mathematics', date: 'Yesterday', score: '92/100' },
                { id: 102, name: 'Physics Kinetics', tag: 'Science', date: 'Oct 12, 2023', score: '85/100' },
                { id: 103, name: 'Grammar Test 1', tag: 'English', date: 'Oct 05, 2023', score: '78/100' },
                { id: 104, name: 'World History Midterm', tag: 'History', date: 'Sep 28, 2023', score: '95/100' },
                { id: 105, name: 'Basic Chemistry', tag: 'Science', date: 'Sep 15, 2023', score: '88/100' }
              ].map((paper, idx) => (
                <div key={paper.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${idx % 2 === 0 ? 'bg-slate-800' : 'bg-[#EA580C]'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-slate-800">{paper.name}</h3>
                        <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {paper.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Completed: {paper.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-400 font-medium mb-0.5">Score</p>
                      <p className="font-bold text-slate-800">{paper.score}</p>
                    </div>

                    <button
                      onClick={() => alert(`Downloading completed paper: ${paper.name}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm hover:border-[#EA580C] hover:text-[#EA580C] transition-all text-sm font-bold text-slate-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>


        </div>

        {/* Right Column - Available Question Papers */}
        <div className="w-full lg:w-5/12 flex flex-col">
          <div className="flex justify-between items-center mb-6 mt-2">
            <h2 className="text-2xl font-bold">Available Papers</h2>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-800 border-b border-slate-300 pb-0.5">See all Papers</a>
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1E293B]"></div>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100">{error}</div>
            ) : forms.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl shadow-sm">
                <p className="text-slate-500">No question papers available.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {forms.map((form, index) => (
                  <div
                    key={form.id}
                    onClick={() => navigate(`/fillform/${form.id}`)}
                    className="group cursor-pointer rounded-2xl p-4 transition-all hover:bg-white hover:shadow-sm flex items-center justify-between border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center text-white ${index % 2 === 0 ? 'bg-[#EA580C]' : 'bg-[#3B82F6]'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-slate-800">{form.name}</h3>
                          <span className="bg-[#1E293B] text-white text-[12px] font-semibold px-2.5 py-0.5 rounded-full tracking-wide">
                            {form.tag || 'Assessment'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 truncate w-48 lg:w-64">
                          {form.description || 'Complete this paper to test your knowledge.'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm font-medium text-slate-400">
                          <span>Available now</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 group-hover:bg-[#1E293B] flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4 text-slate-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Proposal Progress Card */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 mt-6">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-xl">Current Paper: {currentProgress.name}</h3>
              <button
                onClick={() => {
                  if (currentProgress.formId) navigate(`/fillform/${currentProgress.formId}`);
                }}
                className="flex items-center gap-1 text-sm font-medium border border-slate-200 rounded-full px-4 py-1.5 hover:bg-slate-50 text-[#1E293B]"
              >
                <svg className="w-4 h-4 text-[#EA580C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Resume
              </button>
            </div>
            <div className="flex justify-between items-start">
              <div className="w-1/3 border-r border-slate-200 pr-4">
                <p className="text-sm text-slate-500 mb-1">Total Questions</p>
                <h4 className="text-3xl font-bold">{currentProgress.total}</h4>
                <div className="flex flex-wrap gap-1 mt-4">
                  {[...Array(currentProgress.total || 0)].map((_, i) => (
                    <div key={i} className="w-1 h-8 bg-slate-200 rounded-full"></div>
                  ))}
                </div>
              </div>
              <div className="w-1/3 border-r border-slate-200 pl-6 pr-4">
                <p className="text-sm text-slate-500 mb-1">Completed</p>
                <h4 className="text-3xl font-bold">{currentProgress.completed}</h4>
                <div className="flex flex-wrap gap-1 mt-4">
                  {[...Array(currentProgress.completed || 0)].map((_, i) => (
                    <div key={i} className="w-1 h-8 bg-[#1E293B] rounded-full"></div>
                  ))}
                </div>
              </div>
              <div className="w-1/3 pl-6 pr-4">
                <p className="text-sm text-slate-500 mb-1">Pending</p>
                <h4 className="text-3xl font-bold">{currentProgress.pending}</h4>
                <div className="flex flex-wrap gap-1 mt-4">
                  {[...Array(currentProgress.pending || 0)].map((_, i) => (
                    <div key={i} className="w-1 h-8 bg-[#EA580C] rounded-full"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FormList;
