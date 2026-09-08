import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, Zap, User } from 'lucide-react';
import { ScientificDisclaimer } from '../components/common/ScientificDisclaimer';

export const LoginPage: React.FC = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-100/60 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md industrial-card p-8 border border-slate-200 shadow-xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20 mx-auto">
            <Shield className="w-7 h-7 font-bold" />
          </div>

          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            H₂S DOSIMETER SAFETY PORTAL
          </h1>
          <p className="text-xs text-slate-500 font-sans">
            Smart India Hackathon 2026 • Worker Mail ID & Device Assignment
          </p>
        </div>

        {/* 1-Click Login Shortcuts for Assigned Worker Accounts */}
        <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs text-sky-900 font-bold">
            <Zap className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Assigned Worker Account Quick Login</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Rajesh Kumar */}
            <button
              type="button"
              onClick={() => login('rajesh.kumar@industrial-safety.org', 'demo123', 'Supervisor')}
              className="w-full p-2.5 rounded-xl bg-white border border-sky-200 hover:border-sky-400 text-slate-800 transition-all text-left flex items-center justify-between shadow-2xs group"
            >
              <div>
                <div className="font-bold text-slate-900 group-hover:text-sky-700">Rajesh Kumar</div>
                <div className="text-[11px] text-slate-500">rajesh.kumar@industrial-safety.org</div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold">
                DEV-0081
              </span>
            </button>

            {/* Ananya Sharma */}
            <button
              type="button"
              onClick={() => login('ananya.sharma@industrial-safety.org', 'demo123', 'Supervisor')}
              className="w-full p-2.5 rounded-xl bg-white border border-sky-200 hover:border-sky-400 text-slate-800 transition-all text-left flex items-center justify-between shadow-2xs group"
            >
              <div>
                <div className="font-bold text-slate-900 group-hover:text-sky-700">Ananya Sharma</div>
                <div className="text-[11px] text-slate-500">ananya.sharma@industrial-safety.org</div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold">
                DEV-0082
              </span>
            </button>

            {/* Plant Supervisor */}
            <button
              type="button"
              onClick={() => login('supervisor@industrial-safety.org', 'demo123', 'Admin')}
              className="w-full p-2.5 rounded-xl bg-amber-50 border border-amber-200 hover:border-amber-400 text-slate-800 transition-all text-left flex items-center justify-between shadow-2xs group"
            >
              <div>
                <div className="font-bold text-amber-900">Plant Supervisor</div>
                <div className="text-[11px] text-amber-700">supervisor@industrial-safety.org</div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-bold">
                ALL UNITS
              </span>
            </button>
          </div>
        </div>

        {/* Email Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-sky-600" />
              <span>Assigned Worker Mail ID</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="worker@industrial-safety.org"
              className="industrial-input w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-sky-600" />
              <span>Password</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="industrial-input w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="industrial-button-primary w-full py-2.5 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to View Assigned Device'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <ScientificDisclaimer compact />
      </div>
    </div>
  );
};
