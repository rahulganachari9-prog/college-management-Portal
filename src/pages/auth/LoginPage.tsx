import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';
import {
  GraduationCap,
  Briefcase,
  Shield,
  UserCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2,
  BookOpen,
  Award,
  HelpCircle,
  Laptop,
  Check,
  AlertCircle,
  ChevronRight,
  School,
  KeyRound,
  FileCheck2,
} from 'lucide-react';

interface LoginPageProps {
  onOpenVerifyModal?: () => void;
}

interface RoleConfig {
  role: UserRole;
  label: string;
  subLabel: string;
  badge: string;
  icon: any;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    accent: string;
    gradient: string;
  };
  defaultEmail: string;
  defaultId: string;
  personaName: string;
  personaTitle: string;
  sampleAvatar: string;
  features: string[];
}

const ROLES: RoleConfig[] = [
  {
    role: 'student',
    label: 'Student Portal',
    subLabel: 'Enrolled Undergrads & Postgrads',
    badge: 'Student Access',
    icon: GraduationCap,
    colorScheme: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeText: 'text-emerald-700',
      accent: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
      gradient: 'from-emerald-600 to-teal-700',
    },
    defaultEmail: 'alex.chen@student.aitm.edu',
    defaultId: '2022-CSE-001',
    personaName: 'Alex Chen',
    personaTitle: 'B.Tech CSE - 5th Semester',
    sampleAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    features: ['Attendance & Timetables', 'Course Materials & LMS', 'Assignment Submissions', 'Placement Drives & Results'],
  },
  {
    role: 'faculty',
    label: 'Faculty & Professors',
    subLabel: 'Academic Staff & Instructors',
    badge: 'Teaching Faculty',
    icon: BookOpen,
    colorScheme: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-800',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeText: 'text-amber-800',
      accent: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
      gradient: 'from-amber-600 to-orange-700',
    },
    defaultEmail: 'sarah.connor@aitm.edu',
    defaultId: 'FAC-CSE-01',
    personaName: 'Prof. Sarah Connor',
    personaTitle: 'Associate Professor, Dept. of CSE',
    sampleAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    features: ['Class Attendance Marker', 'Assignment Evaluation', 'Curriculum Syllabus Manager', 'Student Performance Analytics'],
  },
  {
    role: 'hod',
    label: 'Head of Department',
    subLabel: 'Department Leadership (HOD)',
    badge: 'Department Admin',
    icon: UserCheck,
    colorScheme: {
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/30',
      text: 'text-sky-800',
      badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
      badgeText: 'text-sky-800',
      accent: 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500',
      gradient: 'from-sky-600 to-cyan-700',
    },
    defaultEmail: 'hod.cse@aitm.edu',
    defaultId: 'HOD-CSE-01',
    personaName: 'Dr. Robert Jenkins',
    personaTitle: 'HOD - Computer Science & Engg.',
    sampleAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    features: ['Faculty Workload Allocation', 'Department Curriculum Oversight', 'Course Allocation & Timetables', 'Academic Audit Reports'],
  },
  {
    role: 'placement_officer',
    label: 'Placement & T&P Cell',
    subLabel: 'Career & Corporate Relations',
    badge: 'T&P Officer',
    icon: Briefcase,
    colorScheme: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-800',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      badgeText: 'text-purple-800',
      accent: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
      gradient: 'from-purple-600 to-indigo-700',
    },
    defaultEmail: 'placement@aitm.edu',
    defaultId: 'TPO-2025-01',
    personaName: 'Marcus Sterling',
    personaTitle: 'Head - Training & Placement Cell',
    sampleAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    features: ['Company Recruitment Drives', 'Job Openings & Eligibility', 'Application Pipeline Review', 'Campus Placement Analytics'],
  },
  {
    role: 'super_admin',
    label: 'System & Campus Admin',
    subLabel: 'Super Admin & Executive Office',
    badge: 'Super Admin',
    icon: Shield,
    colorScheme: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-800',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      badgeText: 'text-rose-800',
      accent: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
      gradient: 'from-rose-600 to-slate-900',
    },
    defaultEmail: 'superadmin@aitm.edu',
    defaultId: 'ADM-EXEC-01',
    personaName: 'Dr. Arthur Vance',
    personaTitle: 'Chief Administrator & Dean',
    sampleAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    features: ['Global System Configuration', 'Student & Faculty Provisioning', 'Audit Logs & Governance', 'Cloud Database & Security'],
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenVerifyModal }) => {
  const { login, loginWithGoogle, switchDemoRole } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [identifier, setIdentifier] = useState<string>('alex.chen@student.aitm.edu');
  const [password, setPassword] = useState<string>('aitm@2025');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetStatus, setResetStatus] = useState<string>('');

  const activeConfig = ROLES.find((r) => r.role === selectedRole) || ROLES[0];
  const IconComponent = activeConfig.icon;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const target = ROLES.find((r) => r.role === role);
    if (target) {
      setIdentifier(target.defaultEmail);
      setPassword('aitm@2025');
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter your institutional email, Roll Number, or Employee ID.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');
      await login({
        role: selectedRole,
        identifier: identifier.trim(),
        email: identifier.includes('@') ? identifier.trim() : undefined,
        password,
      });
      setSuccessMsg(`Authenticated as ${activeConfig.personaName}. Launching dashboard...`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to authenticate credentials. Please try demo 1-click login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (config: RoleConfig) => {
    try {
      setIsSubmitting(true);
      setSelectedRole(config.role);
      setIdentifier(config.defaultEmail);
      await switchDemoRole(config.role, config.defaultEmail);
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed or cancelled the popup - no error message needed
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setErrorMsg('The browser blocked the sign-in popup. Please allow popups or use the 1-Click Demo login below.');
        return;
      }
      if (err?.code === 'auth/unauthorized-domain') {
        setErrorMsg('This domain is not in the authorized OAuth list. Please use the 1-Click Demo login below.');
        return;
      }
      setErrorMsg(err?.message || 'Google SSO verification cancelled or unavailable in preview.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetStatus(`Password reset link dispatched to ${resetEmail}. Check your university inbox.`);
    setTimeout(() => {
      setShowForgotModal(false);
      setResetStatus('');
      setResetEmail('');
    }, 2800);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-base sm:text-lg">Apex Institute of Technology</span>
              <span className="hidden md:inline-flex px-2 py-0.5 text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Enterprise CMS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Campus Academic & Governance Management Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenVerifyModal && (
            <button
              onClick={onOpenVerifyModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-colors shadow-2xs"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Verify Certificate</span>
            </button>
          )}

          <button
            onClick={() => setShowDemoModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/50 rounded-lg transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Role Directory</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Role Selector & Campus Info */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full mb-3">
                  <School className="w-3.5 h-3.5" />
                  Academic Year 2025-26
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Institutional Single Sign-On
                </h1>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Select your campus designation to access role-tailored academic tools, administrative controls, and student records.
                </p>
              </div>

              {/* Role Selection Tabs */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Select Campus Persona
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {ROLES.map((cfg) => {
                    const RoleIcon = cfg.icon;
                    const isSelected = selectedRole === cfg.role;
                    return (
                      <button
                        key={cfg.role}
                        type="button"
                        onClick={() => handleRoleSelect(cfg.role)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                            : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? cfg.colorScheme.bg + ' ' + cfg.colorScheme.text : 'bg-slate-800 text-slate-400'
                          }`}>
                            <RoleIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                              {cfg.label}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {cfg.subLabel}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Campus Highlights Badge */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  Campus Infrastructure
                </span>
                <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  All Systems Operational
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/60 text-center">
                <div className="p-1.5 bg-slate-900/60 rounded-lg">
                  <p className="text-xs font-bold text-white">3,250+</p>
                  <p className="text-[10px] text-slate-400">Students</p>
                </div>
                <div className="p-1.5 bg-slate-900/60 rounded-lg">
                  <p className="text-xs font-bold text-white">180+</p>
                  <p className="text-[10px] text-slate-400">Faculty</p>
                </div>
                <div className="p-1.5 bg-slate-900/60 rounded-lg">
                  <p className="text-xs font-bold text-emerald-400">94.8%</p>
                  <p className="text-[10px] text-slate-400">Placements</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Portal Login Form */}
          <div className="lg:col-span-7">
            <div className="h-full bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between shadow-2xl relative overflow-hidden">
              
              {/* Dynamic Role Banner */}
              <div>
                <div className="flex items-start justify-between pb-6 border-b border-slate-800/80">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${activeConfig.colorScheme.bg} ${activeConfig.colorScheme.text} border ${activeConfig.colorScheme.border}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-bold text-white">
                          {activeConfig.label}
                        </h2>
                        <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${activeConfig.colorScheme.badgeBg}`}>
                          {activeConfig.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Secure Authentication with Institutional Role Privileges
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feedback Alerts */}
                {errorMsg && (
                  <div className="mt-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800/70 text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <p className="flex-1">{errorMsg}</p>
                  </div>
                )}
                {successMsg && (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/70 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <p className="flex-1">{successMsg}</p>
                  </div>
                )}

                {/* Credentials Form */}
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {selectedRole === 'student'
                        ? 'Institutional Email or Roll Number'
                        : selectedRole === 'faculty' || selectedRole === 'hod'
                        ? 'Faculty Email or Employee ID'
                        : 'Institutional Admin Email'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={selectedRole === 'student' ? 'e.g. 2022-CSE-001 or alex.chen@student.aitm.edu' : activeConfig.defaultEmail}
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700/90 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Portal Security Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/90 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      Remember this trusted device
                    </label>
                    <span className="text-slate-500 text-[11px]">256-Bit SSL Encrypted</span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm text-white transition-all shadow-md mt-2 ${
                      activeConfig.colorScheme.accent
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Authenticating {activeConfig.label}...
                      </span>
                    ) : (
                      <>
                        <span>Sign In to {activeConfig.label}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Google SSO Alternative */}
                <div className="mt-4 pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors shadow-2xs"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Sign in with Google Workspace SSO (@aitm.edu)</span>
                  </button>
                </div>
              </div>

              {/* 1-Click Persona Quick-Launch Bar */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Instant 1-Click Demo Evaluation
                  </span>
                  <span className="text-[11px] text-indigo-400 font-medium">Pre-loaded Profiles</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={activeConfig.sampleAvatar}
                      alt={activeConfig.personaName}
                      className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{activeConfig.personaName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{activeConfig.personaTitle}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin(activeConfig)}
                    disabled={isSubmitting}
                    className="shrink-0 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-2xs"
                  >
                    1-Click Login
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/40 py-4 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2025-2026 Apex Institute of Technology & Management. All rights reserved.</p>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-slate-400">NAAC A++ Accredited</span>
          <span>•</span>
          <span className="text-slate-400">ISO 9001:2015 Certified</span>
          <span>•</span>
          <span className="text-slate-400">NIRF Top 50 Ranked</span>
        </div>
      </footer>

      {/* Role Directory Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-400" />
                  Campus Role Directory & Demo Credentials
                </h3>
                <p className="text-xs text-slate-400">Click any persona to instantly test its dashboard and permissions</p>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {ROLES.map((cfg) => {
                const Icon = cfg.icon;
                return (
                  <div
                    key={cfg.role}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={cfg.sampleAvatar}
                        alt={cfg.personaName}
                        className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white">{cfg.personaName}</p>
                          <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${cfg.colorScheme.badgeBg}`}>
                            {cfg.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">{cfg.defaultEmail}</p>
                        <p className="text-[10px] text-slate-500">ID / Code: {cfg.defaultId}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowDemoModal(false);
                        handleQuickDemoLogin(cfg);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shrink-0"
                    >
                      Login as {cfg.badge}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowDemoModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                Institutional Password Recovery
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your registered campus email address or student roll number to receive a secure password reset token or contact the IT Helpdesk.
            </p>

            {resetStatus ? (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs rounded-lg">
                {resetStatus}
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Campus Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="e.g. yourname@aitm.edu"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  >
                    Send Recovery Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
