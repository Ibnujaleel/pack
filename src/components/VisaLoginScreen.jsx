import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Phone, MessageSquare } from 'lucide-react';
import VisaGuyLogo from './VisaGuyLogo';
import { DEMO_CREDENTIALS, mockLogin } from '../data/mockAuth';

export default function VisaLoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Quick fill helper for demo evaluation
  const handleFillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await mockLogin(email, password);
      if (result.success) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-white relative overflow-x-hidden">
      {/* Background Decorative Gold Waves & Subtle Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-200/40 via-amber-100/20 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-gradient-to-tr from-amber-300/30 via-amber-100/20 to-transparent rounded-full blur-3xl pointer-events-none -ml-20" />

      {/* Top Header Bar */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <VisaGuyLogo size="md" />

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700">
            <span>Menu</span>
            <span className="text-[10px] text-slate-400">▾</span>
          </div>
        </div>
      </header>

      {/* Main Container: Mobile-First Card */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-md mx-auto z-10">
        {/* Trust Badges matching visaguy.ae */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="px-3 py-1 rounded-full bg-white border border-slate-200/80 text-[11px] font-semibold text-slate-700 shadow-xs">
            80k+ Visas Processed
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-slate-200/80 text-[11px] font-semibold text-slate-700 shadow-xs">
            75+ Countries
          </span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Consider your visa <span className="font-serif italic font-normal text-amber-600">problems</span> halfway solved.
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-xs mx-auto">
            Sign in to access your sanctioned travel dashboard and prepare your luggage with Layover.
          </p>
        </div>

        {/* Main Authentication Card */}
        <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          {/* Subtle Golden Glow Accent inside Card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full blur-2xl pointer-events-none" />

          {/* Card Header & Status */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">Client Portal</span>
                <span className="text-[10px] text-emerald-600 font-medium">Demo Access Ready</span>
              </div>
            </div>

            {/* Demo Quick Fill Chip */}
            <button
              type="button"
              onClick={handleFillDemo}
              title="Click to fill credentials for Mr. Alfaz"
              className="text-[10px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/60 px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Fill Demo User
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2 animate-shake">
                <span className="font-bold shrink-0">!</span>
                <span className="leading-tight">{errorMessage}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 pl-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alfaz@visaguy.ae"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 pl-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Demo Credential Reminder Box */}
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 flex items-center justify-between">
              <div>
                <span className="font-semibold block text-[10px] text-amber-700">Demo Login Details:</span>
                <span className="font-mono text-[10px]">alfaz@visaguy.ae / layover2026</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 ml-2" />
            </div>

            {/* Sign In Primary Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-6 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Travel Portal</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Expert Online Badge inside login */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">Visa Expert Online</span>
            </div>
            <span className="text-slate-400 text-[10px]">Live UAE Support</span>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Consultation Bar matching visaguy.ae */}
      <footer className="w-full bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2.5">
          {/* Phone Call Icon Pill */}
          <a
            href="tel:+971501234567"
            title="Call The Visa Guy"
            className="w-11 h-11 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center text-slate-800 shadow-md hover:bg-amber-50 transition-colors shrink-0"
          >
            <Phone className="w-4 h-4 text-slate-900" />
          </a>

          {/* WhatsApp / Consultation Pill Button with Golden Outer Glow */}
          <div className="flex-1 p-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-md">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-full bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold transition-all"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Get Free Consultation</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
