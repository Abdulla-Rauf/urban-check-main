import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const verifyToken = searchParams.get('verifyToken');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyNotice, setVerifyNotice] = useState(null);

  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const authError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const navigate = useNavigate();

  // If arrived with ?verifyToken=, verify account
  useEffect(() => {
    if (verifyToken) {
      authService
        .verifyEmail(verifyToken)
        .then((res) => {
          setVerifyNotice({
            type: 'success',
            message: res.message || 'Your email has been verified. Please sign in.',
          });
        })
        .catch((err) => {
          setVerifyNotice({
            type: 'error',
            message: err.message || 'Verification token is invalid or has expired.',
          });
        });
    }
  }, [verifyToken]);

  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();

    const result = await login({ email, password });
    if (result.success) {
      navigate('/account');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-20">
      <div className="text-center mb-8">
        <span className="text-[11px] uppercase tracking-widest text-urban-teal font-semibold">
          Customer Portal
        </span>
        <h1 className="font-serif text-3xl font-light text-urban-black mt-1">
          Sign In
        </h1>
        <p className="text-xs text-urban-warm-grey mt-2">
          Access your personal curation, order timeline, and atelier privileges.
        </p>
      </div>

      <div className="bg-urban-light-grey/60 border border-urban-border p-6 sm:p-8">
        {/* Email Verification Banner */}
        {verifyNotice && (
          <div
            className={`p-3.5 mb-5 flex items-start space-x-2 text-xs border ${
              verifyNotice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {verifyNotice.type === 'success' ? (
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
            )}
            <span>{verifyNotice.message}</span>
          </div>
        )}

        {/* Auth Error Banner */}
        {authError && (
          <div className="p-3 mb-5 bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2 text-xs">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 text-xs">
          <div>
            <label className="block uppercase tracking-widest text-[10px] text-urban-warm-grey mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (authError) clearError();
                }}
                placeholder="elena@example.com"
                className="w-full bg-white border border-urban-border pl-9 pr-3 py-2.5 focus:outline-none focus:border-urban-teal text-urban-black"
              />
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-urban-warm-grey" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="uppercase tracking-widest text-[10px] text-urban-warm-grey">
                Password
              </label>
              <Link to="/forgot-password" className="text-urban-teal text-[11px] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (authError) clearError();
                }}
                placeholder="Enter your password"
                className="w-full bg-white border border-urban-border pl-9 pr-3 py-2.5 focus:outline-none focus:border-urban-teal text-urban-black"
              />
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-urban-warm-grey" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-urban-black hover:bg-urban-teal disabled:opacity-50 text-white text-xs uppercase tracking-editorial font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In To Account'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-urban-border text-center text-xs text-urban-warm-grey">
          <span>New to Urban Check? </span>
          <Link to="/register" className="text-urban-teal font-medium hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
