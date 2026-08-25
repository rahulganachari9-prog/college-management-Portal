import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { StatCard } from '../../components/common/StatCard.tsx';
import { BookOpen, CheckCircle, Clock, Award, AlertCircle, Sparkles, FileText, Briefcase, ArrowRight, ShieldCheck, LifeBuoy } from 'lucide-react';
import { Badge } from '../../components/common/Badge.tsx';

interface Props {
  onNavigate: (tab: string) => void;
}

export const StudentDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [sRes, aRes, nRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/assignments'),
          api.get('/notices'),
        ]);
        if (sRes.success) setStats(sRes.data);
        if (aRes.success) setAssignments(aRes.data || []);
        if (nRes.success) setNotices(nRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const attendancePct = parseFloat(stats?.studentStats?.overallAttendancePercentage || '88.5');
  const isAttendanceShort = attendancePct < 75;

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Student Academic Workspace
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {stats?.studentStats?.studentName ? `Welcome, ${stats.studentStats.studentName}` : 'Welcome, Alex Chen'}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Roll No: <span className="font-mono text-white font-bold">{stats?.studentStats?.rollNo || '2022-CSE-001'}</span> • B.Tech Computer Science & Engineering (Semester 6)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('student-helpdesk')}
            className="px-3.5 py-2 text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <LifeBuoy className="w-4 h-4" /> Help Desk
          </button>
          <button
            onClick={() => onNavigate('student-certificates')}
            className="px-3.5 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Credentials
          </button>
        </div>
      </div>

      {/* Attendance Warning if below 75% */}
      {isAttendanceShort && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>
            <strong>Attendance Warning:</strong> Your overall attendance is currently at {attendancePct}%, which is below the mandatory 75% university eligibility requirement.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${attendancePct}%`}
          subtitle={isAttendanceShort ? 'Below Threshold' : 'Eligible for Exams'}
          icon={CheckCircle}
          iconBg={isAttendanceShort ? 'bg-rose-50' : 'bg-emerald-50'}
          iconColor={isAttendanceShort ? 'text-rose-600' : 'text-emerald-600'}
          onClick={() => onNavigate('student-attendance')}
        />
        <StatCard
          title="Cumulative CGPA"
          value={stats?.studentStats?.cgpa || '8.92'}
          subtitle="Top 5% of Class"
          icon={Award}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          onClick={() => onNavigate('student-results')}
        />
        <StatCard
          title="Pending Tasks"
          value={stats?.studentStats?.pendingAssignmentsCount || 2}
          subtitle="Assignments Due This Week"
          icon={FileText}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          onClick={() => onNavigate('student-assignments')}
        />
        <StatCard
          title="Placement Drives"
          value={stats?.studentStats?.activeJobOpeningsCount || 6}
          subtitle="Eligible Open Opportunities"
          icon={Briefcase}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          onClick={() => onNavigate('student-placements')}
        />
      </div>

      {/* Main Grid: Deadlines & Circulars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coursework Deadlines */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Upcoming Coursework Deadlines</h3>
            <button
              onClick={() => onNavigate('student-assignments')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All Tasks →
            </button>
          </div>

          <div className="space-y-2.5">
            {assignments.slice(0, 3).map((assign) => (
              <div
                key={assign.id}
                className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {assign.subjectCode}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{assign.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-rose-500" /> Due by {assign.dueDate} • Max Points: {assign.maxMarks}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('student-assignments')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-2xs self-start sm:self-center"
                >
                  Submit Solution
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Official Campus Bulletins */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Notice Board</h3>
            <span className="text-xs font-medium text-slate-500">Live</span>
          </div>

          <div className="space-y-3">
            {notices.slice(0, 3).map((n) => (
              <div key={n.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <Badge variant={n.priority === 'urgent' ? 'danger' : 'neutral'}>
                    {(n.priority || 'normal').toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-1.5">{n.title}</h4>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
