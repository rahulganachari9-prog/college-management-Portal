import React, { useEffect, useState } from 'react';
import { StatCard } from '../../components/common/StatCard.tsx';
import { api } from '../../lib/apiClient.ts';
import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  Briefcase,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Megaphone,
  LifeBuoy,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge.tsx';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/stats');
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (e) {
        console.error('Failed to load dashboard stats:', e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const overview = stats?.overview || {
    students: 1420,
    faculty: 84,
    departments: 6,
    courses: 14,
    activePlacements: 18,
    upcomingEvents: 5,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Institutional Administration Portal
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Apex Institute of Technology & Management</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Live Centralized Control Plane — Real-time tracking of academic operations, faculty allocations, student progression, and career placements.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('admin-helpdesk')}
            className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <LifeBuoy className="w-4 h-4" /> Help Desk & Support
          </button>
          <button
            onClick={() => onNavigate('admin-students')}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-xs"
          >
            Manage Students
          </button>
          <button
            onClick={() => onNavigate('admin-timetables')}
            className="px-4 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
          >
            Class Timetables
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Enrolled Students"
          value={loading ? '...' : overview.students.toLocaleString()}
          subtitle="Across 6 Academic Depts"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          trend={{ value: '+8.4% YOY', isPositive: true }}
          onClick={() => onNavigate('admin-students')}
        />
        <StatCard
          title="Faculty & Scholars"
          value={loading ? '...' : overview.faculty.toLocaleString()}
          subtitle="98% Ph.D / Master Certified"
          icon={GraduationCap}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          trend={{ value: '14:1 Ratio', isPositive: true }}
          onClick={() => onNavigate('admin-faculty')}
        />
        <StatCard
          title="Active Placement Drives"
          value={loading ? '...' : overview.activePlacements.toLocaleString()}
          subtitle="Tier-1 & Core Tech Recruiters"
          icon={Briefcase}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ value: 'Avg $12.4 LPA', isPositive: true }}
          onClick={() => onNavigate('admin-placements')}
        />
        <StatCard
          title="Academic Departments"
          value={loading ? '...' : overview.departments.toLocaleString()}
          subtitle="14 Degree Programs"
          icon={Building2}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          onClick={() => onNavigate('admin-departments')}
        />
      </div>

      {/* Quick Launch & Recent Notices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Institutional Actions */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Fast Action Shortcuts</h3>
          <div className="space-y-2">
            {[
              { label: 'Review Help Desk & Support Inquiries', tab: 'admin-helpdesk', desc: 'Resolve student & faculty service tickets' },
              { label: 'Register New Student Admission', tab: 'admin-students', desc: 'Add candidate & generate roll number' },
              { label: 'Publish College Circular / Notice', tab: 'admin-notices', desc: 'Broadcast emergency or academic bulletin' },
              { label: 'Configure Semester Timetable', tab: 'admin-timetables', desc: 'Allocate classrooms & teacher slots' },
              { label: 'Publish Exam Grade Cards', tab: 'admin-exams', desc: 'Release semester marks & GPA' },
              { label: 'Post Placement Opening', tab: 'admin-placements', desc: 'Add new hiring partner drive' },
              { label: 'Audit Security Logins', tab: 'admin-audit', desc: 'View IP & administrative activity log' },
            ].map((act, i) => (
              <button
                key={i}
                onClick={() => onNavigate(act.tab)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 text-left transition-colors group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600">{act.label}</p>
                  <p className="text-[11px] text-slate-500">{act.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Official Circulars & Notices */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Active Campus Circulars</h3>
              </div>
              <button
                onClick={() => onNavigate('admin-notices')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Manage All
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {(stats?.recentNotices || []).length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">No active circulars found</p>
              ) : (
                stats?.recentNotices?.map((n: any) => (
                  <div key={n.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{n.title}</span>
                        <Badge
                          variant={n.priority === 'urgent' ? 'danger' : n.priority === 'important' ? 'warning' : 'neutral'}
                        >
                          {n.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{n.content}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Target: {(n.targetRole || 'all').toUpperCase()} • Published {new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> System is operating with active Cloud SQL PostgreSQL replication
            </span>
            <span className="font-mono text-[11px] text-slate-500">Region: asia-southeast1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
