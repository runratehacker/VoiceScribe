import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const TeacherDashboard = () => {
  const [file, setFile] = useState(null);
  const [paperName, setPaperName] = useState('');
  const [subject, setSubject] = useState('');
  const [assignedTo, setAssignedTo] = useState('All Students');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [uploadedPapers, setUploadedPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(true);

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/uploaded-papers`);
        if (response.ok) {
          const data = await response.json();
          setUploadedPapers(data);
        }
      } catch (err) {
        console.error('Failed to fetch papers', err);
      } finally {
        setLoadingPapers(false);
      }
    };
    fetchPapers();
  }, []);

  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !paperName || !subject) {
      setMessage('Please fill all fields and select a PDF.');
      return;
    }

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('name', paperName);
    formData.append('subject', subject);
    formData.append('assignedTo', assignedTo);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setMessage(`Successfully uploaded ${paperName}`);
      setUploadedPapers(prev => [data.file, ...prev]);
      setFile(null);
      setPaperName('');
      setSubject('');
      setAssignedTo('All Students');
    } catch (err) {
      setMessage('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const displayName = user?.name || user?.username || 'Teacher';

  return (
    <div className="min-h-dvh w-full flex flex-col bg-[#f5f5f5] text-[#292524] relative overflow-x-hidden font-sans selection:bg-[#292524] selection:text-white">

      {/* Atmospheric Pastel Gradient Orbs (ElevenLabs signature) */}
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
      </div>

      {/* Floating Top Navigation Bar */}
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
              TEACHER DESK
            </span>
          </div>

          {/* Center: Navigation Pill */}
          <nav className="hidden md:inline-flex items-center gap-1 bg-[#fafafa] p-1 rounded-full border border-[#f0efed]" aria-label="Teacher Navigation">
            <span className="px-4 py-1.5 rounded-full text-[13.5px] font-medium bg-[#292524] text-white shadow-xs select-none">
              Paper Management
            </span>
          </nav>

          {/* Right: User Profile Pill & Dropdown */}
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
                <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-[20px] shadow-[0_12px_36px_rgba(0,0,0,0.08)] border border-[#e7e5e4] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-[#f0efed]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] text-[#777169] uppercase tracking-wider font-semibold">Account</p>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#f0efed] text-[#0c0a09]">
                        <span className="w-1 h-1 rounded-full bg-[#0c0a09]" />
                        Faculty
                      </span>
                    </div>
                    <p className="text-[14.5px] font-medium text-[#0c0a09] truncate">{displayName}</p>
                    <p className="text-[12px] text-[#777169] mt-0.5">Role: Teacher</p>
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

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-6 pt-7 sm:pt-9 pb-12 flex-1 flex flex-col gap-10 z-10">

        {/* Editorial Header */}
        <section className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#e7e5e4] text-[11px] font-semibold tracking-[0.18em] uppercase text-[#777169] w-fit mb-2 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
            <span>CURRICULUM STUDIO</span>
          </div>
          <h1 className="font-serif font-light text-4xl sm:text-5xl text-[#0c0a09] tracking-[-0.03em] leading-[1.1] pb-1">
            Assessment Library.
          </h1>
          <p className="text-[16px] text-[#4e4e4e] max-w-xl leading-relaxed">
            Publish PDF worksheets and review voice-transcribed student submissions across classes.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column (7 cols): Uploaded Papers */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-[#e7e5e4] flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#f0efed]">
              <div>
                <h2 className="font-serif font-light text-2xl sm:text-[28px] text-[#0c0a09] tracking-[-0.02em]">
                  Uploaded Papers
                </h2>
                <p className="text-[14px] text-[#777169] mt-1">
                  Active worksheets assigned to students.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-[#f0efed] text-[#0c0a09]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0c0a09]" />
                {uploadedPapers.length} Papers
              </span>
            </div>

            <div className="divide-y divide-[#f0efed]">
              {loadingPapers ? (
                <div className="py-12 text-center text-[#777169] text-[15px]">Loading papers...</div>
              ) : uploadedPapers.length === 0 ? (
                <div className="py-12 text-center text-[#777169] border border-dashed border-[#d6d3d1] rounded-2xl bg-[#fafafa] text-[15px]">
                  No papers uploaded yet. Upload your first worksheet on the right.
                </div>
              ) : (
                uploadedPapers.map((paper) => (
                  <div key={paper.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#f0efed] text-[#292524] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 mb-0.5 flex-wrap">
                          <h3 className="font-medium text-[16px] text-[#0c0a09] truncate">{paper.name}</h3>
                          <span className="bg-[#f0efed] text-[#292524] text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {paper.subject}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#777169]">Uploaded {paper.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[11px] text-[#777169] uppercase tracking-wider font-semibold">Submissions</p>
                        <p className="font-serif text-[20px] text-[#0c0a09] leading-tight">{paper.submissions || 0}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`${API_BASE_URL}${paper.path}`}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full border border-[#e7e5e4] hover:border-[#0c0a09] hover:bg-[#fafafa] text-[#292524] transition-all flex items-center justify-center"
                          title="Download PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                        <button
                          onClick={() => alert(`Viewing submissions for: ${paper.name}`)}
                          className="h-9 px-4 bg-white border border-[#d6d3d1] hover:border-[#0c0a09] rounded-full text-[13px] font-medium text-[#292524] hover:bg-[#fafafa] transition-all flex items-center gap-1.5"
                        >
                          <span className="hidden sm:inline">View</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Upload New Paper */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-[#e7e5e4] flex flex-col">
            <h3 className="font-serif font-light text-2xl sm:text-[26px] text-[#0c0a09] tracking-[-0.02em] mb-1.5">
              Upload New Paper
            </h3>
            <p className="text-[14px] text-[#777169] mb-6">
              Add a structured PDF worksheet for voice-enabled student evaluation.
            </p>

            <form onSubmit={handleUpload} className="flex flex-col gap-4 w-full">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#292524]">
                  Paper Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Factorization Worksheet"
                  value={paperName}
                  onChange={(e) => setPaperName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] placeholder-[#a8a29e] outline-none focus:border-[#292524] focus:ring-1 focus:ring-[#292524] transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#292524]">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g., Mathematics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] placeholder-[#a8a29e] outline-none focus:border-[#292524] focus:ring-1 focus:ring-[#292524] transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#292524]">
                  Assign To
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] outline-none focus:border-[#292524] focus:ring-1 focus:ring-[#292524] transition-all cursor-pointer"
                >
                  <option value="All Students">All Students</option>
                  <option value="Class 8A">Class 8A</option>
                  <option value="Class 8B">Class 8B</option>
                  <option value="Class 9A">Class 9A</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-[13px] font-medium text-[#292524]">
                  Worksheet File (PDF)
                </span>
                <label className="w-full flex flex-col items-center justify-center py-6 px-4 bg-[#fafafa] rounded-xl border border-dashed border-[#d6d3d1] hover:border-[#0c0a09] hover:bg-white transition-all cursor-pointer group">
                  <svg className="w-6 h-6 text-[#777169] group-hover:text-[#0c0a09] mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-[14px] font-medium text-[#292524] text-center px-4 truncate max-w-full">
                    {file ? file.name : "Select or drop PDF file"}
                  </span>
                  <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                </label>
              </div>

              {message && (
                <p className={`text-[13px] font-medium text-center ${message.includes('Error') || message.includes('Please') ? 'text-[#dc2626]' : 'text-[#0c0a09]'}`}>
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={uploading || !file || !paperName || !subject}
                className="w-full h-11 mt-2 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[15px] font-medium transition-all shadow-xs flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  'Publish Paper'
                )}
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
