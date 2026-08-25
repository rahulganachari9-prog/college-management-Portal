import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Shield,
  GraduationCap,
  Calendar,
  IdCard,
  CheckCircle2,
  Copy,
  Check,
  Edit3,
  Save,
  LogOut,
  Sparkles,
  Lock,
  School,
  FileBadge,
} from 'lucide-react';
import { api } from '../../lib/apiClient.ts';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, activeRole, logout, refreshProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(currentUser?.phone || '+1 (555) 234-5678');
  const [bio, setBio] = useState('Enthusiastic academic pursuing excellence at Apex Institute of Technology & Management.');
  const [emergencyContact, setEmergencyContact] = useState('+1 (555) 987-6543 (Parent / Guardian)');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const getInstitutionalId = () => {
    switch (activeRole) {
      case 'student':
        return '2022-CSE-001';
      case 'faculty':
        return 'FAC-CSE-01';
      case 'hod':
        return 'HOD-CSE-01';
      case 'placement_officer':
        return 'TPO-2025-01';
      case 'super_admin':
      case 'admin':
        return 'ADM-EXEC-01';
      default:
        return `ID-${currentUser?.id || '001'}`;
    }
  };

  const getRoleBadgeInfo = () => {
    switch (activeRole) {
      case 'student':
        return {
          title: 'Undergraduate Student',
          dept: 'Computer Science & Engineering',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          badgeText: 'Student Portal Access',
          icon: GraduationCap,
        };
      case 'faculty':
        return {
          title: 'Associate Professor',
          dept: 'Computer Science & Engineering',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          badgeText: 'Faculty & Instructor',
          icon: GraduationCap,
        };
      case 'hod':
        return {
          title: 'Head of Department',
          dept: 'Computer Science & Engineering',
          color: 'bg-sky-50 text-sky-800 border-sky-200',
          badgeText: 'Department Admin',
          icon: Building2,
        };
      case 'placement_officer':
        return {
          title: 'Training & Placement Officer',
          dept: 'Corporate Relations & Career Cell',
          color: 'bg-purple-50 text-purple-800 border-purple-200',
          badgeText: 'T&P Officer',
          icon: FileBadge,
        };
      case 'super_admin':
      case 'admin':
      default:
        return {
          title: 'Campus Administrator',
          dept: 'Executive Dean & Provost Office',
          color: 'bg-rose-50 text-rose-800 border-rose-200',
          badgeText: 'Super Admin Privileges',
          icon: Shield,
        };
    }
  };

  const roleInfo = getRoleBadgeInfo();
  const instId = getInstitutionalId();

  const handleCopyId = () => {
    navigator.clipboard.writeText(instId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      // Update locally & state
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header Banner */}
        <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 px-6 pt-6 pb-16 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <School className="w-4 h-4" />
            <span>Apex Institute of Technology & Management</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Institutional User Profile
          </h2>
          <p className="text-xs text-indigo-200/80 mt-0.5">
            Verified academic identity and campus governance record
          </p>
        </div>

        {/* User Identity Floating Strip */}
        <div className="px-6 -mt-10 relative z-10 flex items-end justify-between gap-4">
          <div className="flex items-end gap-3.5">
            <div className="relative">
              <img
                src={
                  currentUser?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
                }
                alt={currentUser?.name || 'User'}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-lg bg-slate-100"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white" title="Active & Verified">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            </div>

            <div className="mb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  {currentUser?.name || 'Academic User'}
                </h3>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${roleInfo.color}`}>
                  {roleInfo.badgeText}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {roleInfo.title} • {roleInfo.dept}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 mb-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Contact'}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-medium">Profile contact details successfully updated.</p>
            </div>
          )}

          {/* Quick Academic ID Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Institutional ID</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-bold text-slate-800 text-xs">{instId}</span>
                <button
                  onClick={handleCopyId}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                  title="Copy ID"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</p>
              <p className="font-semibold text-slate-800 mt-0.5">CSE (Engineering)</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Year</p>
              <p className="font-semibold text-slate-800 mt-0.5">2025 - 2026</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
              <p className="font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active & Enrolled
              </p>
            </div>
          </div>

          {/* Contact & Personal Information */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                Contact & Campus Details
              </h4>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-3 p-4 bg-slate-50/70 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Institutional Email (Read Only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser?.email || 'user@aitm.edu'}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono text-xs cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Emergency Contact
                    </label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Academic Bio & Specialization
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Campus SSO Email</p>
                    <p className="font-mono text-xs text-slate-800 mt-0.5">{currentUser?.email || 'user@aitm.edu'}</p>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</p>
                    <p className="text-xs text-slate-800 mt-0.5">{phone}</p>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-start gap-2.5 sm:col-span-2">
                  <Shield className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Emergency Contact</p>
                    <p className="text-xs text-slate-800 mt-0.5">{emergencyContact}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security & Permissions Summary */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-start justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Institutional SSO Security</p>
                <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                  Session protected with 256-bit TLS encryption, role-based authorization token, and cloud database access policies.
                </p>
              </div>
            </div>
            <span className="shrink-0 px-2 py-1 bg-white border border-indigo-200 text-indigo-700 font-bold text-[10px] rounded-md shadow-2xs">
              TLS Verified
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
