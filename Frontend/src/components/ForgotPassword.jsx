import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Flow phase: 'request' -> 'verify' -> 'reset' -> 'complete'
  const [phase, setPhase] = useState('request');

  // State shared across phases
  const [username, setUsername] = useState(location.state?.username || '');
  const [otpId, setOtpId] = useState(null);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [resetToken, setResetToken] = useState('');

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback & loading state
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Cooldown timer for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus first OTP box on entering verify phase
  useEffect(() => {
    if (phase === 'verify') {
      setTimeout(() => {
        otpInputRefs[0].current?.focus();
      }, 60);
    }
  }, [phase]);

  // Phase 1: Request OTP (/api/auth/sendotp)
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Please enter your username.');
      return;
    }

    setError('');
    setNotice('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sendotp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Could not send verification code.');
      }

      setUsername(trimmedUsername);
      setOtpId(data.id);
      setOtpDigits(['', '', '', '']);
      setResendCooldown(45);
      setPhase('verify');
      setNotice('A four-digit verification code has been sent to your registered email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP individual digit changes
  const handleOtpChange = (index, value) => {
    const sanitized = value.replace(/\D/g, '');
    if (!sanitized) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    const digit = sanitized.slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    setError('');

    if (index < 3 && digit) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    const nextDigits = ['', '', '', ''];
    for (let i = 0; i < 4; i += 1) {
      nextDigits[i] = pasted[i] || '';
    }
    setOtpDigits(nextDigits);
    setError('');
    const focusIdx = Math.min(pasted.length, 3);
    otpInputRefs[focusIdx].current?.focus();
  };

  // Phase 2: Verify OTP (/api/auth/verifyotp)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const combinedOtp = otpDigits.join('');
    if (combinedOtp.length < 4) {
      setError('Please enter the complete four-digit code.');
      return;
    }

    setError('');
    setNotice('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verifyotp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          OTP: combinedOtp,
          id: otpId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed. Please check the code and try again.');
      }

      setResetToken(data.resetToken);
      setPhase('reset');
      setNotice('Identity verified. Choose a new password for your account.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Phase 3: Reset Password (/api/auth/resetpassword)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter both fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resetpassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          resetToken,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Could not reset password.');
      }

      setPhase('complete');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const phases = [
    { key: 'request', label: 'Identify' },
    { key: 'verify', label: 'Verify' },
    { key: 'reset', label: 'Update' },
  ];

  const activePhaseIndex =
    phase === 'request' ? 0 : phase === 'verify' ? 1 : phase === 'reset' ? 2 : 3;

  return (
    <div className="min-h-dvh w-full flex flex-col justify-between bg-[#f5f5f5] text-[#292524] relative overflow-hidden font-sans selection:bg-[#292524] selection:text-white">

      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 sm:w-120 sm:h-120 rounded-full opacity-40 blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, #c8b8e0 0%, #a8c8e8 45%, transparent 75%)',
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-96 h-96 sm:w-125 sm:h-125 rounded-full opacity-35 blur-3xl"
          style={{
            background: 'radial-gradient(circle at center, #f4c5a8 0%, #a7e5d3 45%, transparent 75%)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-20 blur-2xl"
          style={{
            background: 'radial-gradient(circle at center, #e8b8c4 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Top Navigation */}
      <header className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between z-10 shrink-0">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center gap-1 h-4 px-1" aria-hidden="true">
            <span className="w-0.5 h-3 bg-[#292524] rounded-full" />
            <span className="w-0.5 h-4.5 bg-[#292524] rounded-full" />
            <span className="w-0.5 h-2.5 bg-[#292524] rounded-full" />
          </div>
          <span className="text-[14px] font-semibold tracking-[0.2em] text-[#0c0a09] uppercase">
            VOICESCRIBE
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-[13px] font-medium text-[#777169] hover:text-[#0c0a09] transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-105 bg-white rounded-[20px] sm:rounded-3xl border border-[#e7e5e4] shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-7 sm:p-10 relative">

          {/* Single Eyebrow Label */}
          <span className="text-[11px] font-medium tracking-[0.16em] uppercase text-[#777169] mb-3 block">
            ACCOUNT RECOVERY
          </span>

          {/* Progression Hairline Bar */}
          {phase !== 'complete' && (
            <div className="grid grid-cols-3 gap-2 mb-7" aria-label="Recovery progress">
              {phases.map((item, idx) => {
                const isCurrent = idx === activePhaseIndex;
                const isDone = idx < activePhaseIndex;
                return (
                  <div key={item.key} className="flex flex-col gap-1.5">
                    <div
                      className={`h-1 rounded-full transition-colors ${isCurrent || isDone ? 'bg-[#292524]' : 'bg-[#f0efed]'
                        }`}
                    />
                    <span
                      className={`text-[12px] tracking-[0.01em] ${isCurrent
                          ? 'font-medium text-[#0c0a09]'
                          : isDone
                            ? 'text-[#292524]'
                            : 'text-[#a8a29e]'
                        }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Phase 1: Request OTP */}
          {phase === 'request' && (
            <>
              <h1 className="font-serif font-light text-[34px] sm:text-[38px] text-[#0c0a09] tracking-tight leading-[1.12] mb-2.5">
                Reset password.
              </h1>
              <p className="text-[15px] text-[#777169] leading-relaxed mb-7">
                Enter your username and we will send a four-digit verification code to your registered email.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mb-6 p-3.5 rounded-lg bg-[#fef2f2] text-[#dc2626] text-[13px] font-medium border border-[#fecaca] leading-snug"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label
                    htmlFor="recovery-username"
                    className="block text-[13px] font-medium text-[#292524] mb-1.5"
                  >
                    Username
                  </label>
                  <input
                    id="recovery-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your username"
                    className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] placeholder-[#a8a29e] outline-none focus:border-[#292524] focus:ring-1 focus:ring-[#292524] transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[15px] font-medium tracking-[0.01em] transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending code...</span>
                    </>
                  ) : (
                    'Send verification code'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Phase 2: Verify OTP */}
          {phase === 'verify' && (
            <>
              <h1 className="font-serif font-light text-[34px] sm:text-[38px] text-[#0c0a09] tracking-tight leading-[1.12] mb-2.5">
                Check your email.
              </h1>
              <p className="text-[15px] text-[#777169] leading-relaxed mb-6">
                Enter the four-digit code sent for{' '}
                <span className="font-medium text-[#292524]">{username}</span>. The code remains valid for 5 minutes.
              </p>

              {notice && !error && (
                <div className="mb-6 p-3.5 rounded-lg bg-[#fafafa] text-[#4e4e4e] text-[13px] border border-[#e7e5e4] leading-snug">
                  {notice}
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mb-6 p-3.5 rounded-lg bg-[#fef2f2] text-[#dc2626] text-[13px] font-medium border border-[#fecaca] leading-snug"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label
                    htmlFor="otp-digit-0"
                    className="block text-[13px] font-medium text-[#292524] mb-2.5"
                  >
                    Verification code
                  </label>
                  <div className="grid grid-cols-4 gap-3" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-digit-${idx}`}
                        ref={otpInputRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        aria-label={`Digit ${idx + 1}`}
                        className="w-full h-14 text-center font-mono text-[24px] font-medium text-[#0c0a09] bg-[#fafafa] rounded-lg border border-[#d6d3d1] outline-none focus:bg-white focus:border-[#292524] focus:ring-1 focus:ring-[#292524] transition-all"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[15px] font-medium tracking-[0.01em] transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    'Verify code'
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-[13px]">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setNotice('');
                      setPhase('request');
                    }}
                    className="text-[#777169] hover:text-[#0c0a09] transition-colors"
                  >
                    Change username
                  </button>

                  <button
                    type="button"
                    disabled={loading || resendCooldown > 0}
                    onClick={handleSendOtp}
                    className="font-medium text-[#292524] hover:text-[#0c0a09] disabled:text-[#a8a29e] disabled:cursor-not-allowed transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Phase 3: Reset Password */}
          {phase === 'reset' && (
            <>
              <h1 className="font-serif font-light text-[34px] sm:text-[38px] text-[#0c0a09] tracking-tight leading-[1.12] mb-2.5">
                Create new password.
              </h1>
              <p className="text-[15px] text-[#777169] leading-relaxed mb-6">
                Choose a new password for{' '}
                <span className="font-medium text-[#292524]">{username}</span>. Make sure it differs from your previous password.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mb-6 p-3.5 rounded-lg bg-[#fef2f2] text-[#dc2626] text-[13px] font-medium border border-[#fecaca] leading-snug"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-[13px] font-medium text-[#292524] mb-1.5"
                  >
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Enter new password"
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

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-[13px] font-medium text-[#292524] mb-1.5"
                  >
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Re-enter new password"
                      className="w-full h-11 pl-3.5 pr-14 rounded-lg bg-white border border-[#d6d3d1] text-[15px] text-[#0c0a09] placeholder-[#a8a29e] outline-none focus:border-[#292524] focus:ring-1 focus:ring-[#292524] transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#777169] hover:text-[#0c0a09] px-1.5 py-1 rounded transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
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
                      <span>Updating password...</span>
                    </>
                  ) : (
                    'Update password'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Phase 4: Complete */}
          {phase === 'complete' && (
            <>
              <div className="w-10 h-10 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center mb-5">
                <svg
                  className="w-5 h-5 text-[#16a34a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h1 className="font-serif font-light text-[34px] sm:text-[38px] text-[#0c0a09] tracking-tight leading-[1.12] mb-2.5">
                Password updated.
              </h1>
              <p className="text-[15px] text-[#777169] leading-relaxed mb-8">
                Your VoiceScribe password for{' '}
                <span className="font-medium text-[#292524]">{username}</span> has been reset. You can now sign in with your new credentials.
              </p>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full h-11 rounded-full bg-[#292524] hover:bg-[#0c0a09] text-white text-[15px] font-medium tracking-[0.01em] transition-all active:scale-[0.99] flex items-center justify-center shadow-sm"
              >
                Return to sign in
              </button>
            </>
          )}

          {/* Card Footer Link */}
          {phase !== 'complete' && (
            <div className="mt-8 pt-6 border-t border-[#f0efed] text-center">
              <p className="text-[13px] text-[#777169]">
                Remembered your password?{' '}
                <Link
                  to="/"
                  className="font-medium text-[#0c0a09] hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
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

export default ForgotPassword;

