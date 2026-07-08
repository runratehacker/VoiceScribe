import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        const response = await fetch('http://localhost:8044/api/uploaded-papers');
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
      const response = await fetch('http://localhost:8044/api/upload', {
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

  return (
    <div className="h-screen w-full overflow-hidden bg-[#F3F4F8] p-4 md:p-6 flex flex-col font-sans text-slate-800">

      {/* Top Navigation EXACTLY like FormList */}
      <nav className="w-full flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#EA580C] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">VOICE SCRIBE <span className="text-[#EA580C] text-sm ml-2 font-medium">TEACHER</span></span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
          <a href="#" className="text-slate-800 border-b-2 border-slate-800 pb-1 text-lg">Dashboard</a>
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

        {/* Left Column (Matches "Attempted Papers" list from FormList) */}
        <div className="w-full lg:w-7/12 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 flex-1 relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-slate-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <h2 className="text-2xl font-bold">Uploaded Papers</h2>
              </div>
              <button className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
              {loadingPapers ? (
                <div className="text-center py-4 text-slate-500">Loading papers...</div>
              ) : uploadedPapers.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  No papers uploaded yet. Upload your first paper!
                </div>
              ) : (
                uploadedPapers.map((paper, idx) => (
                  <div key={paper.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${idx % 2 === 0 ? 'bg-slate-800' : 'bg-[#EA580C]'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-slate-800">{paper.name}</h3>
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {paper.subject}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Uploaded {paper.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400 font-medium mb-0.5">Submissions</p>
                        <p className="font-bold text-slate-800">{paper.submissions || 0}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`http://localhost:8044${paper.path}`}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm hover:border-slate-400 hover:text-slate-800 transition-all text-sm font-bold text-slate-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>

                        </a>
                        <button
                          onClick={() => alert(`Viewing submissions for: ${paper.name}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm hover:border-[#EA580C] hover:text-[#EA580C] transition-all text-sm font-bold text-slate-600"
                        >
                          <span className="hidden sm:inline">View</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Matches "Available Papers" column from FormList) */}
        <div className="w-full lg:w-5/12 flex flex-col gap-6">
          <div className="flex justify-between items-center mt-2">
            <h2 className="text-2xl font-bold">Paper Management</h2>
          </div>

          <div className="flex-1 flex flex-col">
            {/* Upload New Paper Card (Matches "Progress Card" from FormList) */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 flex-1 flex flex-col">
              <h3 className="font-bold text-xl mb-2 text-slate-800">Upload New Paper</h3>
              <p className="text-sm text-slate-500 mb-8">Upload a PDF worksheet for your students to fill out using voice.</p>

              <form onSubmit={handleUpload} className="flex flex-col items-center gap-3 w-full flex-1">

                {/* Form Metadata Inputs */}
                <div className="w-full flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder="Worksheet / Question Paper     Name"
                    value={paperName}
                    onChange={(e) => setPaperName(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-[#F3F4F6] border border-transparent focus:border-[#EA580C]/20 focus:bg-white outline-none transition-all text-base text-slate-700 placeholder-slate-400"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Subject (e.g., Science)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-[#F3F4F6] border border-transparent focus:border-[#EA580C]/20 focus:bg-white outline-none transition-all text-base text-slate-700 placeholder-slate-400"
                    required
                  />
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-[#F3F4F6] border border-transparent focus:border-[#EA580C]/20 focus:bg-white outline-none transition-all text-base text-slate-700 cursor-pointer"
                  >
                    <option value="All Students">All Students</option>
                    <option value="Class 8A">Class 8A</option>
                    <option value="Class 8B">Class 8B</option>
                    <option value="Class 9A">Class 9A</option>
                  </select>
                </div>

                <label className="w-full flex-1 flex flex-col items-center justify-center py-3 px-4 bg-slate-50 text-blue rounded-2xl shadow-inner border-2 border-dashed border-slate-200 hover:bg-slate-100 hover:border-[#EA580C] transition-colors cursor-pointer group min-h-15">
                  <svg className="w-6 h-6 text-slate-400 group-hover:text-[#EA580C] mb-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <span className="text-sm font-medium text-slate-600 group-hover:text-[#EA580C] transition-colors text-center px-4 wrap-break-word line-clamp-1">
                    {file ? file.name : "Select or drop PDF file"}
                  </span>
                  <input type='file' className="hidden" accept=".pdf" onChange={handleFileChange} />
                </label>

                {message && (
                  <p className={`text-xs font-medium text-center ${message.includes('Error') || message.includes('Please') ? 'text-red-500' : 'text-green-500'}`}>
                    {message}
                  </p>
                )}

                {file && paperName && subject && (
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`w-full py-4 mt-2 rounded-full text-white text-base font-bold transition-all shadow-sm flex justify-center items-center gap-2 ${uploading ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#1E293B] hover:bg-slate-800 active:scale-[0.98]'}`}
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Uploading...
                      </>
                    ) : 'Upload Paper'}
                  </button>
                )}
              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard;
