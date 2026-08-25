import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Bell,
  GraduationCap,
  CheckCircle2,
  LogOut,
  Menu,
  User as UserIcon,
  ChevronDown,
  IdCard,
  ShieldCheck,
  Bot,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/apiClient.ts';
import { UserProfileModal } from './UserProfileModal.tsx';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenVerifyModal?: () => void;
  onOpenProfile?: () => void;
  onOpenGemini?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenVerifyModal,
  onOpenProfile,
  onOpenGemini,
}) => {
  const { currentUser, activeRole, logout, unreadCount, refreshProfile } = useAuth();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    }
  };

  useEffect(() => {
    if (showNotifMenu) {
      fetchNotifs();
    }
  }, [showNotifMenu]);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-read', {});
      await refreshProfile();
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenProfileModal = () => {
    setShowProfileMenu(false);
    setShowProfileModal(true);
    if (onOpenProfile) onOpenProfile();
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">Apex Institute of Technology</span>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded">
                  Fall 2025
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Accredited A++ • Enterprise Campus Portal</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Certificate Verification Quick Button */}
          {onOpenVerifyModal && (
            <button
              onClick={onOpenVerifyModal}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200/60"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Verify Certificate</span>
            </button>
          )}

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowProfileMenu(false);
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse ring-2 ring-white"></span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-xs text-center text-slate-400">No new notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs transition-colors ${
                          n.isRead ? 'bg-white text-slate-600' : 'bg-indigo-50/40 text-slate-900 font-medium'
                        }`}
                      >
                        <p className="font-semibold text-slate-900">{n.title}</p>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Profile Dropdown Option */}
          <div className="relative pl-1 sm:pl-2 border-l border-slate-200">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-left"
              title="Profile & Account Settings"
            >
              <img
                src={
                  currentUser?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                }
                alt={currentUser?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shadow-2xs"
              />
              <div className="hidden md:block text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser?.name || 'Academic User'}
                  </p>
                  <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded">
                    Profile
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px] font-mono">
                  {currentUser?.email || 'user@aitm.edu'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block ml-0.5" />
            </button>

            {/* Profile Menu Dropdown */}
            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setShowProfileMenu(false)}
              >
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
                  <img
                    src={
                      currentUser?.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                    }
                    alt={currentUser?.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser?.name || 'Academic User'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {currentUser?.email || 'user@aitm.edu'}
                    </p>
                    <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Active • Verified
                    </span>
                  </div>
                </div>

                <div className="mt-1 space-y-0.5">
                  <button
                    onClick={handleOpenProfileModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-lg transition-colors text-left"
                  >
                    <UserIcon className="w-4 h-4 text-indigo-500" />
                    <span>My Profile & ID Card</span>
                  </button>

                  <button
                    onClick={handleOpenProfileModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-lg transition-colors text-left"
                  >
                    <IdCard className="w-4 h-4 text-slate-400" />
                    <span>Academic Credentials</span>
                  </button>

                  <button
                    onClick={handleOpenProfileModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-lg transition-colors text-left"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Account & Security</span>
                  </button>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Full Institutional Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
};
