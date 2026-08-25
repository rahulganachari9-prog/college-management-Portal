import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { CheckCircle, AlertTriangle, XCircle, Calendar, BookOpen, Clock } from 'lucide-react';
import { Badge } from '../../components/common/Badge.tsx';

export const StudentAttendanceView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await api.get('/attendance/my-summary');
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const overall = parseFloat(data?.overallPercentage || '88.5');
  const isShortage = overall < 75;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Attendance Register & Eligibility Tracker</h2>
          <p className="text-xs text-slate-500 mt-0.5">Subject-wise lecture attendance, percentage breakdown, and exam hall ticket clearance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Overall Attendance:</span>
            <span className={`text-base font-black ${isShortage ? 'text-rose-600' : 'text-emerald-600'}`}>
              {overall}%
            </span>
            <Badge variant={isShortage ? 'danger' : 'success'}>
              {isShortage ? 'Shortage Alert' : 'Hall Ticket Eligible'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress Bar Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
          <span>Institutional Threshold Progress</span>
          <span>Target: 75.0% Mandatory Minimum</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 ${
              overall >= 75 ? 'bg-emerald-500' : overall >= 65 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(overall, 100)}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
          <span>0%</span>
          <span className="text-rose-500 font-bold font-mono">| 75% Cutoff</span>
          <span>100%</span>
        </div>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Subject-Wise Lecture Attendance Summary
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-white border-b border-slate-200 font-semibold text-slate-700 uppercase">
              <tr>
                <th className="px-5 py-3">Subject Code</th>
                <th className="px-5 py-3">Subject Name</th>
                <th className="px-5 py-3 text-center">Total Held</th>
                <th className="px-5 py-3 text-center">Attended</th>
                <th className="px-5 py-3 text-center">Absent</th>
                <th className="px-5 py-3 text-center">Percentage</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.subjects || []).map((sub: any, idx: number) => {
                const pct = parseFloat(sub.percentage);
                const isSubShort = pct < 75;
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-700">{sub.subjectCode}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{sub.subjectName}</td>
                    <td className="px-5 py-3.5 text-center font-mono font-medium text-slate-700">{sub.totalLectures}</td>
                    <td className="px-5 py-3.5 text-center font-mono font-bold text-emerald-700">{sub.attended}</td>
                    <td className="px-5 py-3.5 text-center font-mono font-bold text-rose-600">{sub.absent}</td>
                    <td className="px-5 py-3.5 text-center font-mono font-black text-sm">
                      <span className={pct >= 75 ? 'text-emerald-600' : 'text-rose-600'}>
                        {pct}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge variant={isSubShort ? 'danger' : 'success'}>
                        {isSubShort ? 'Shortage' : 'Compliant'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
