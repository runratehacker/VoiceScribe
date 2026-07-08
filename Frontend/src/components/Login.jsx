import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';

const Login = () => {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    if (user?.role === 'teacher') {
      return <Navigate to="/teacher-dashboard" replace />;
    }
    return <Navigate to="/fillform" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8044/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      login(data.token, data.user);
      if (data.user.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/fillform');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#F3F4F8] p-4 md:p-6 flex flex-col font-sans text-slate-800">

      {/* Imitating the fillform/1 Header structure */}
      <nav className="w-full flex items-center justify-between mb-6 px-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#EA580C] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">VOICE SCRIBE</span>
        </div>

      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto p-6 md:p-8 relative">

        {/* Subtle decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-linear-to-br from-slate-200 to-transparent rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-linear-to-tr from-[#EA580C]/10 to-transparent rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="w-full max-w-115 bg-[#FDFDFD] rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12 relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-800 mb-3">Welcome Back</h1>
            <p className="text-slate-500 text-md">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-md font-medium text-slate-700 ml-1" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-5 py-3.5 rounded-2xl bg-[#F3F4F6] border border-transparent focus:border-[#EA580C]/20 focus:bg-white outline-none transition-all text-md text-slate-700 placeholder-slate-400"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="block text-md font-medium text-slate-700" htmlFor="password">Password</label>
                <a href="#" className="text-sm font-medium text-slate-500 hover:text-[#EA580C] transition-colors">Forgot password?</a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-5 py-3.5 rounded-2xl bg-[#F3F4F6] border border-transparent focus:border-[#EA580C]/20 focus:bg-white outline-none transition-all text-md text-slate-700 placeholder-slate-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 mt-4 rounded-full text-white text-md font-bold transition-all shadow-sm flex justify-center items-center gap-2 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#1E293B] hover:bg-slate-800 active:scale-[0.98]'}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{'  '}
              <a href="#" className="font-bold text-[#1E293B] hover:text-[#EA580C] transition-colors">Sign up</a>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
