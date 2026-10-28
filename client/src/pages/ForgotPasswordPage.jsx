import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Mail, Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('resetToken');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset password form state (when resetToken is present)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Request password reset link
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Unable to dispatch reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit new password using resetToken
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        token: resetToken,
        newPassword,
      });
      setResetSuccess(true);
    } catch (err) {
      setError(err.message || 'Password reset token is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-20">
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl font-light text-urban-black">
          {resetToken ? 'Establish New Password' : 'Reset Password'}
        </h1>
        <p className="text-xs text-urban-warm-grey mt-2">
          {resetToken
            ? 'Enter your new credentials below to restore atelier access.'
            : 'Enter the email associated with your account and we will dispatch a reset link.'}
        </p>
      </div>

      <div className="bg-urban-light-grey/60 border border-urban-border p-6 sm:p-8">
        {/* Error Alert */}
        {error && (
          <div className="p-3 mb-5 bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2 text-xs">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {resetToken ? (
          // Password Reset Form
          resetSuccess ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 size={44} className="text-urban-teal mx-auto" />
              <h3 className="font-serif text-xl font-light text-urban-black">
                Password Successfully Reset
              </h3>
              <p className="text-xs text-urban-warm-grey">
                Your credentials have been securely updated. You may now sign in with your new
                password.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full mt-4 py-3 bg-urban-black hover:bg-urban-teal text-white text-xs uppercase tracking-editorial font-semibold transition-colors"
              >
                Sign In With New Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-widest text-[10px] text-urban-warm-grey mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-white border border-urban-border pl-9 pr-3 py-2.5 focus:outline-none focus:border-urban-teal"
                  />
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-urban-warm-grey" />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-widest text-[10px] text-urban-warm-grey mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full bg-white border border-urban-border pl-9 pr-3 py-2.5 focus:outline-none focus:border-urban-teal"
                  />
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-urban-warm-grey" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-urban-teal hover:bg-urban-teal-dark disabled:opacity-50 text-white text-xs uppercase tracking-editorial font-medium transition-colors"
              >
                {loading ? 'Updating Credentials...' : 'Save New Password'}
              </button>
            </form>
          )
        ) : (
          // Forgot Password Request Form
          sent ? (
            <div className="text-center py-4">
              <CheckCircle2 size={40} className="text-urban-teal mx-auto mb-3" />
              <p className="text-xs text-urban-black font-medium">Reset instructions dispatched!</p>
              <p className="text-[11px] text-urban-warm-grey mt-1">
                Please check your inbox at <strong className="text-urban-black">{email}</strong>.
              </p>
              <Link
                to="/login"
                className="inline-block mt-6 text-xs uppercase tracking-widest text-urban-teal font-medium hover:underline"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-5 text-xs">
              <div>
                <label className="block uppercase tracking-widest text-[10px] text-urban-warm-grey mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="elena@example.com"
                    className="w-full bg-white border border-urban-border pl-9 pr-3 py-2.5 focus:outline-none focus:border-urban-teal"
                  />
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-urban-warm-grey" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-urban-black hover:bg-urban-teal disabled:opacity-50 text-white text-xs uppercase tracking-editorial font-medium transition-colors"
              >
                {loading ? 'Dispatching Link...' : 'Send Reset Link'}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs text-urban-warm-grey hover:text-urban-black"
                >
                  <ArrowLeft size={14} className="mr-1" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )
        )}
      </div>
    </div>
  );
};
