import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
    <div className="min-h-dvh w-full flex flex-col justify-between bg-[#f5f5f5] text-[#292524] relative overflow-hidden font-sans selection:bg-[#292524] selection:text-white">

      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">

        <div
          className="absolute -top-24 -right-24 w-96 h-96 sm:w-120 sm:h-120 rounded-full opacity-40 blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, #c8b8e0 0%, #a8c8e8 45%, transparent 75%)'
          }}
        />

        <div
          className="absolute -bottom-24 -left-24 w-96 h-96 sm:w-125 sm:h-125 rounded-full opacity-35 blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, #f4c5a8 0%, #a7e5d3 45%, transparent 75%)'
          }}
        />

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-20 blur-2xl"
          style={{
            background: 'radial-gradient(circle at center, #e8b8c4 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Top Navigation */}
      <header className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2.5">

          <div className="flex items-center gap-1 h-4 px-1" aria-hidden="true">
            <span className="w-0.5 h-3 bg-[#292524] rounded-full" />
            <span className="w-0.5 h-4.5 bg-[#292524] rounded-full" />
            <span className="w-0.5 h-2.5 bg-[#292524] rounded-full" />
          </div>
          <span className="text-[14px] font-semibold tracking-[0.2em] text-[#0c0a09] uppercase">
            VOICESCRIBE
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[13px] text-[#777169] hidden sm:inline">
            Voice Intelligence System
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-105 bg-white rounded-[20px] sm:rounded-3xl border border-[#e7e5e4] shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-7 sm:p-10 relative">


          <span className="text-[11px] font-medium tracking-[0.16em] uppercase text-[#777169] mb-2.5 block">
            ACCOUNT ACCESS
          </span>


          <h1 className="font-serif font-light text-[34px] sm:text-[38px] text-[#0c0a09] tracking-tight leading-[1.12] mb-2.5">
            Welcome back.
          </h1>

          <p className="text-[15px] text-[#777169] leading-relaxed mb-8">
            Enter your credentials to access your voice workspace.
          </p>


          {error && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-lg bg-[#fef2f2] text-[#dc2626] text-[13px] font-medium border border-[#fecaca] leading-snug"
            >
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-[13px] font-medium text-[#292524] mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] placeholder-[#a8a29e] outline-none focus:border-[#292524] focus:ring-1 focus:ring-[#292524] transition-all"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-[13px] font-medium text-[#292524]"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-[13px] text-[#777169] hover:text-[#0c0a09] transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 pl-3.5 pr-14 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] placeholder-[#a8a29e] outline-none focus:border-[#292524] focus:ring-1 focus:ring-[#292524] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#777169] hover:text-[#0c0a09] px-1.5 py-1 rounded transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>


            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[15px] font-medium tracking-[0.01em] transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>


          <div className="mt-8 pt-6 border-t border-[#f0efed] text-center">
            <p className="text-[13px] text-[#777169]">
              Need an account?{' '}
              <a
                href="#"
                className="font-medium text-[#0c0a09] hover:underline transition-colors"
              >
                Contact administrator
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-[12px] text-[#777169] border-t border-[#e7e5e4] shrink-0 gap-3 z-10">
        <div>
          <span>VOICESCRIBE. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-[#0c0a09] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#0c0a09] transition-colors">Terms</a>
          <a href="#" className="hover:text-[#0c0a09] transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
