import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Lock, Mail, User, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Clock } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { user, login, register, verifyEmail, choosePassword, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'signin' | 'register' | 'registered' | 'verify' | 'force_password'
  const [mode, setMode] = useState<'signin' | 'register' | 'registered' | 'verify' | 'force_password'>('signin');
  const [verificationToken, setVerificationToken] = useState<string>('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect verification token from URL hash (e.g., #verify=xyz or /#verify=xyz)
  useEffect(() => {
    const hash = window.location.hash;
    const verifyPrefix = '#verify=';
    const altPrefix = '#/verify=';

    let token = '';
    if (hash.startsWith(verifyPrefix)) {
      token = hash.substring(verifyPrefix.length);
    } else if (hash.startsWith(altPrefix)) {
      token = hash.substring(altPrefix.length);
    }

    if (token) {
      setVerificationToken(token);
      setMode('verify');
    } else if (user?.must_change_password) {
      setMode('force_password');
    } else if (user) {
      navigate('/');
    }
  }, [location, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const loggedIn = await login(email.trim(), password);
        if (loggedIn.must_change_password) {
          setMode('force_password');
        } else {
          navigate('/');
        }
      } else if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!email.trim()) throw new Error('Please enter your email address.');
        await register(name.trim(), email.trim());
        setMode('registered');
      } else if (mode === 'verify') {
        if (password.length < 15 || password.length > 128) {
          throw new Error('Password must be between 15 and 128 characters.');
        }
        await verifyEmail(verificationToken, password);
        // Clear hash token from window url
        window.history.replaceState(null, '', window.location.pathname + '#/');
        navigate('/');
      } else if (mode === 'force_password') {
        if (password.length < 15 || password.length > 128) {
          throw new Error('Password must be between 15 and 128 characters.');
        }
        if (password !== confirmPassword) {
          throw new Error('The passwords do not match.');
        }
        await choosePassword(password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setMode('signin');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-light flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Heading */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-navy text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-navy/20 border-2 border-deepRed">
            FD
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black tracking-tight text-navy">
          Arvo Systems Frontdesk
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 font-medium">
          Customer Support & SLA Tracking Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          {/* Mode Titles */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-navy">
              {mode === 'signin' && 'Sign In'}
              {mode === 'register' && 'Create Customer Account'}
              {mode === 'registered' && 'Check Your Email'}
              {mode === 'verify' && 'Verify Email & Set Password'}
              {mode === 'force_password' && 'Permanent Password Required'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'signin' && 'Use your Frontdesk credentials to access your portal.'}
              {mode === 'register' && 'We’ll email you a secure link to complete setup.'}
              {mode === 'registered' && 'A verification link has been dispatched to your email.'}
              {mode === 'verify' && 'Choose a secure password (15 to 128 characters).'}
              {mode === 'force_password' && 'Staff accounts must choose a permanent password upon first sign-in.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-deepRed text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Registered Confirmation State */}
          {mode === 'registered' ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-xs text-slate-600">
                If the email is eligible, you will receive a verification link valid for 1 hour. Open the link to choose your password and access Frontdesk.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                >
                  Send another link
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field (for register) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Full Name</label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy focus:border-navy bg-light-50 text-navy"
                    />
                  </div>
                </div>
              )}

              {/* Email field (for signin and register) */}
              {(mode === 'signin' || mode === 'register') && (
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Email Address</label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy focus:border-navy bg-light-50 text-navy"
                    />
                  </div>
                </div>
              )}

              {/* Password field (for signin, verify, force_password) */}
              {mode !== 'register' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-navy">
                      {mode === 'verify' || mode === 'force_password' ? 'New Password' : 'Password'}
                    </label>
                    {(mode === 'verify' || mode === 'force_password') && (
                      <span className="text-[10px] text-slate-400">15–128 characters</span>
                    )}
                  </div>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="block w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy focus:border-navy bg-light-50 text-navy"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-navy"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password field (for force_password) */}
              {mode === 'force_password' && (
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Confirm New Password</label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy focus:border-navy bg-light-50 text-navy"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <Button type="submit" loading={loading} className="w-full">
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'register' && 'Send Verification Link'}
                  {mode === 'verify' && 'Verify & Enter Frontdesk'}
                  {mode === 'force_password' && 'Save Password & Continue'}
                </Button>
              </div>

              {/* Mode switch actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="text-xs text-center text-slate-600 hover:text-deepRed font-medium transition"
                  >
                    Need a customer account? <span className="font-bold underline">Create one</span>
                  </button>
                )}

                {mode === 'register' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                    }}
                    className="text-xs text-center text-slate-600 hover:text-navy font-medium transition flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Already registered? Sign in
                  </button>
                )}

                {mode === 'force_password' && (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-xs text-center text-deepRed hover:underline font-medium transition"
                  >
                    Sign out to temporary account
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Operating Hours card */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Support hours: Mon–Fri · 09:30–18:30 IST</span>
        </div>
      </div>
    </div>
  );
};
