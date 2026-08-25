import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { StatCard } from '../../components/common/StatCard.tsx';
import { BookOpen, Users, ClipboardCheck, FileText, Clock, ArrowRight, Sparkles, LifeBuoy } from 'lucide-react';
import { Badge } from '../../components/common/Badge.tsx';

interface Props {
  onNavigate: (tab: string) => void;
}

export const FacultyDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [stRes, subRes, timeRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/subjects'),
          api.get('/timetables'),
        ]);
        if (stRes.success) setStats(stRes.data);
        if (subRes.success) setSubjects(subRes.data || []);
        if (timeRes.success) setTimetables(timeRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Faculty & Academic Instruction Suite
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome, Professor</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Record session attendances, distribute curriculum notes, publish coursework assignments, and grade student submissions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('faculty-helpdesk')}
            className="px-3.5 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20 flex items-center gap-1.5"
          >
            <LifeBuoy className="w-4 h-4 text-indigo-300" /> Help Desk
          </button>
          <button
            onClick={() => onNavigate('faculty-attendance')}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <ClipboardCheck className="w-4 h-4" /> Mark Attendance
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Syllabi"
          value={subjects.length || 4}
          subtitle="Theoretical & Lab Modules"
          icon={BookOpen}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          title="Active Students"
          value={128}
          subtitle="Enrolled Across Your Classes"
          icon={Users}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Pending Submissions"
          value={stats?.facultyStats?.submissionsToGradeCount || 3}
          subtitle="Awaiting Assessment & Marks"
          icon={FileText}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          onClick={() => onNavigate('faculty-assignments')}
        />
        <StatCard
          title="Weekly Periods"
          value={timetables.length || 8}
          subtitle="Scheduled Teaching Hours"
          icon={Clock}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          onClick={() => onNavigate('faculty-timetable')}
        />
      </div>

      {/* Quick Launch & Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fast Action Shortcuts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Take Live Class Attendance', tab: 'faculty-attendance', desc: 'Instant student roster roll-call' },
              { label: 'Post New Assignment / Project', tab: 'faculty-assignments', desc: 'Set due date and attach rubric' },
              { label: 'Upload Lecture Slides & Notes', tab: 'faculty-materials', desc: 'Share PDFs and learning resources' },
              { label: 'Enter Midterm / Exam Marks', tab: 'faculty-marks', desc: 'Record scores against max marks' },
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

        {/* Assigned Subjects Overview */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Your Assigned Curricula</h3>
            <span className="text-xs text-slate-500 font-medium">{subjects.length} Subjects Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {subjects.map((sub) => (
              <div key={sub.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {sub.code}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{sub.credits} Credits</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-2">{sub.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Semester {sub.semesterNumber} • {(sub.type || 'theory').toUpperCase()}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onNavigate('faculty-attendance')}
                    className="text-indigo-600 font-semibold hover:text-indigo-800 text-[11px]"
                  >
                    Attendance →
                  </button>
                  <button
                    onClick={() => onNavigate('faculty-materials')}
                    className="text-slate-600 font-semibold hover:text-slate-900 text-[11px]"
                  >
                    Materials →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
