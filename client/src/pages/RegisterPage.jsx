import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { User, Mail, Phone, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const authError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const navigate = useNavigate();

  // Password strength check
  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isPasswordStrong = hasMinLength && hasLetter && hasNumber;

  const handleRegister = async (e) => {
    e.preventDefault();
    clearError();

    if (!isPasswordStrong) return;

    const result = await register({
      name,
      email,
      phone,
      password,
    });

    if (result.success) {
      setRegisteredEmail(email);
      setRegisteredSuccess(true);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-20">
      <div className="text-center mb-8">
        <span className="text-[11px] uppercase tracking-widest text-urban-teal font-semibold">
          Privilege Membership
        </span>
        <h1 className="font-serif text-3xl font-light text-urban-black mt-1">
          Create an Account
        </h1>
        <p className="text-xs text-urban-warm-grey mt-2">
          Join the Urban Check atelier for early drop invitations and complimentary courier service.
        </p>
      </div>

      <div className="bg-urban-light-grey/60 border border-urban-border p-6 sm:p-8">
        {registeredSuccess ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 size={44} className="text-urban-teal mx-auto" />
            <h3 className="font-serif text-2xl font-light text-urban-black">
              Welcome to Urban Check
            </h3>
            <p className="text-xs text-urban-warm-grey leading-relaxed">
              Your account has been registered. An activation verification dispatch has been sent to{' '}
              <strong className="text-urban-black font-semibold">{registeredEmail}</strong>.
            </p>
            <div className="pt-4 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/account')}
                className="w-full py-3 bg-urban-black hover:bg-urban-teal text-white text-xs uppercase tracking-editorial font-semibold transition-colors"
              >
                Go to My Account
              </button>
              <Link
                to="/shop"
                className="text-xs text-urban-warm-grey hover:text-urban-black uppercase tracking-wider py-1 font-medium"
              >
                Continue Browsing Catalog
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            {/* Error Banner */}
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2 text-xs">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block uppercase tracking-widest text-[10px] text-urban-warm-grey mb-1">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (authError) clearError();
                  }}
                  placeholder="Elena Rostova"
                  className="w-full bg-white border border-urban-border pl-9 pr-3 py-2.5 focus:outline-none focus:border-urban-teal"
                />
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-urban-warm-grey" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block uppercase tracking-widest text-[10px] text-urban-warm-grey mb-1">
                Email Address *
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
                  className="w-full bg-white border border-urban-border pl-9 pr-3 py-2.5 focus:outline-none focus:border-urban-teal"
                />
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-urban-warm-grey" />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block uppercase tracking-widest text-[10px] text-urban-warm-grey mb-1">
                Contact Phone *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (authError) clearError();
                  }}
                  placeholder="+91 98765 43210"
                  className="w-full bg-white border border-urban-border pl-9 pr-3 py-2.5 focus:outline-none focus:border-urban-teal"
                />
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-urban-warm-grey" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block uppercase tracking-widest text-[10px] text-urban-warm-grey mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (authError) clearError();
                  }}
                  placeholder="Minimum 8 characters with letters & numbers"
                  className="w-full bg-white border border-urban-border pl-9 pr-3 py-2.5 focus:outline-none focus:border-urban-teal"
                />
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-urban-warm-grey" />
              </div>

              {/* Password strength checklist */}
              {password && (
                <div className="mt-2 space-y-1 text-[11px]">
                  <div
                    className={`flex items-center space-x-1.5 ${
                      hasMinLength ? 'text-emerald-700 font-medium' : 'text-urban-warm-grey'
                    }`}
                  >
                    <span>{hasMinLength ? '✓' : '•'}</span>
                    <span>At least 8 characters</span>
                  </div>
                  <div
                    className={`flex items-center space-x-1.5 ${
                      hasLetter && hasNumber ? 'text-emerald-700 font-medium' : 'text-urban-warm-grey'
                    }`}
                  >
                    <span>{hasLetter && hasNumber ? '✓' : '•'}</span>
                    <span>Contains letters and at least one number</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || (password && !isPasswordStrong)}
              className="w-full py-3.5 bg-urban-teal hover:bg-urban-teal-dark disabled:opacity-50 text-white text-xs uppercase tracking-editorial font-medium flex items-center justify-center space-x-2 transition-colors mt-2"
            >
              <span>{isLoading ? 'Creating Account...' : 'Register Account'}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-urban-border text-center text-xs text-urban-warm-grey">
          <span>Already registered? </span>
          <Link to="/login" className="text-urban-teal font-medium hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
