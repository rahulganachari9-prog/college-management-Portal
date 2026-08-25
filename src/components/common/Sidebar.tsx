import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  Clock,
  ClipboardCheck,
  FileText,
  FileSpreadsheet,
  Award,
  Briefcase,
  Megaphone,
  Sparkles,
  ShieldCheck,
  Settings,
  X,
  FileCode,
  UserCheck,
  CheckCircle2,
  LifeBuoy,
  LogOut,
  Bot,
} from 'lucide-react';

interface SidebarProps {
  currentTab?: string;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeTab,
  onSelectTab,
  setActiveTab,
  isOpen = false,
  onClose,
}) => {
  const { activeRole, currentUser, logout } = useAuth();
  const selectedTab = currentTab || activeTab || 'admin-dashboard';

  const handleTabClick = (tabId: string) => {
    if (typeof onSelectTab === 'function') {
      onSelectTab(tabId);
    } else if (typeof setActiveTab === 'function') {
      setActiveTab(tabId);
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Define Navigation Items based on Role
  const getNavItems = () => {
    switch (activeRole) {
      case 'super_admin':
      case 'admin':
        return [
          { id: 'admin-dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
          { id: 'gemini-chat', label: 'Apex AI Copilot (Gemini)', icon: Bot, isSpecial: true },
          { id: 'admin-helpdesk', label: 'Help Desk & Support', icon: LifeBuoy },
          { id: 'admin-students', label: 'Student Directory', icon: Users },
          { id: 'admin-faculty', label: 'Faculty Directory', icon: GraduationCap },
          { id: 'admin-departments', label: 'Departments & Courses', icon: Building2 },
          { id: 'admin-timetables', label: 'Classes & Timetables', icon: Clock },
          { id: 'admin-exams', label: 'Examinations & Marks', icon: FileSpreadsheet },
          { id: 'admin-notices', label: 'Notices & Events', icon: Megaphone },
          { id: 'admin-placements', label: 'Placement Drives', icon: Briefcase },
          { id: 'admin-placement-analytics', label: 'Placement Analytics', icon: FileSpreadsheet },
          { id: 'admin-certificates', label: 'Certificates Registry', icon: Award },
          { id: 'admin-audit', label: 'Security Audit Logs', icon: ShieldCheck },
          { id: 'admin-settings', label: 'System Settings', icon: Settings },
        ];

      case 'hod':
        return [
          { id: 'hod-dashboard', label: 'Department Overview', icon: LayoutDashboard },
          { id: 'gemini-chat', label: 'Apex AI Copilot (Gemini)', icon: Bot, isSpecial: true },
          { id: 'hod-helpdesk', label: 'Help Desk / Support', icon: LifeBuoy },
          { id: 'hod-students', label: 'Department Students', icon: Users },
          { id: 'hod-faculty', label: 'Department Faculty', icon: GraduationCap },
          { id: 'hod-curriculum', label: 'Subjects & Curriculum', icon: BookOpen },
          { id: 'hod-attendance', label: 'Attendance Tracking', icon: ClipboardCheck },
          { id: 'hod-placements', label: 'Placement Analytics', icon: FileSpreadsheet },
          { id: 'hod-notices', label: 'Notices & Circulars', icon: Megaphone },
        ];

      case 'faculty':
        return [
          { id: 'faculty-dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
          { id: 'gemini-chat', label: 'Apex AI Copilot (Gemini)', icon: Bot, isSpecial: true },
          { id: 'faculty-helpdesk', label: 'Help Desk / Support', icon: LifeBuoy },
          { id: 'faculty-attendance', label: 'Mark Attendance', icon: ClipboardCheck },
          { id: 'faculty-assignments', label: 'Assignments & Grading', icon: FileText },
          { id: 'faculty-materials', label: 'Upload Study Materials', icon: BookOpen },
          { id: 'faculty-marks', label: 'Exam Marks Entry', icon: FileSpreadsheet },
          { id: 'faculty-timetable', label: 'My Class Schedule', icon: Clock },
          { id: 'faculty-notices', label: 'Academic Notices', icon: Megaphone },
        ];

      case 'student':
        return [
          { id: 'student-dashboard', label: 'My Dashboard', icon: LayoutDashboard },
          { id: 'gemini-chat', label: 'Apex AI Copilot (Gemini)', icon: Bot, isSpecial: true },
          { id: 'student-helpdesk', label: 'Help Desk / Support', icon: LifeBuoy },
          { id: 'student-profile', label: 'Academic Profile & ID', icon: UserCheck },
          { id: 'student-timetable', label: 'Class Timetable', icon: Clock },
          { id: 'student-attendance', label: 'Attendance Report', icon: ClipboardCheck },
          { id: 'student-assignments', label: 'Assignments & Tasks', icon: FileText },
          { id: 'student-materials', label: 'Study Materials & Notes', icon: BookOpen },
          { id: 'student-results', label: 'Grade Card & Results', icon: FileSpreadsheet },
          { id: 'student-events', label: 'Events & Workshops', icon: Calendar },
          { id: 'student-certificates', label: 'Verified Certificates', icon: Award },
          { id: 'student-placements', label: 'Career & Placements', icon: Briefcase },
        ];

      case 'placement_officer':
        return [
          { id: 'placement-dashboard', label: 'Placement Dashboard', icon: LayoutDashboard },
          { id: 'gemini-chat', label: 'Apex AI Copilot (Gemini)', icon: Bot, isSpecial: true },
          { id: 'placement-helpdesk', label: 'Help Desk / Support', icon: LifeBuoy },
          { id: 'placement-companies', label: 'Partner Companies', icon: Building2 },
          { id: 'placement-reports', label: 'Placement Analytics', icon: FileSpreadsheet },
        ];

      default:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'gemini-chat', label: 'Apex AI Copilot (Gemini)', icon: Bot, isSpecial: true },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:z-0`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wide text-sm">AITM PORTAL</span>
              <p className="text-[10px] text-slate-400 font-medium">Campus Enterprise</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Banner */}
        <div className="px-4 py-3 mx-3 my-3 rounded-lg bg-slate-800/80 border border-slate-700/60">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Authenticated Role</p>
          <p className="text-xs font-bold text-white mt-0.5 capitalize flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {activeRole.replace('_', ' ')}
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = selectedTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="p-3 border-t border-slate-800/90 bg-slate-950/30">
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch / Sign Out</span>
          </button>
        </div>

        {/* System Meta footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span>Database Status</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              PostgreSQL Active
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">REST API v1.0 • TLS Secured</p>
        </div>
      </aside>
    </>
  );
};
