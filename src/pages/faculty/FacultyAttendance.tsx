import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { ClassSection, Subject, Student, AttendanceSession } from '../../types.ts';
import { ClipboardCheck, CheckCircle2, XCircle, Clock, AlertCircle, Save, Calendar, BookOpen, Users } from 'lucide-react';
import { Badge } from '../../components/common/Badge.tsx';

export const FacultyAttendance: React.FC = () => {
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('1');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('1');
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState<string>('09:00 - 10:00 AM');
  const [topicCovered, setTopicCovered] = useState<string>('Introduction to Parallel Computing & Thread Scheduling');

  // Attendance Status Map: studentId -> 'present' | 'absent' | 'late' | 'excused'
  const [attendanceMap, setAttendanceMap] = useState<Record<number, 'present' | 'absent' | 'late' | 'excused'>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [cRes, sRes, stuRes, sesRes] = await Promise.all([
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/students?limit=100'),
        api.get('/attendance/sessions'),
      ]);

      if (cRes.success) setClasses(cRes.data || []);
      if (sRes.success) {
        setSubjects(sRes.data || []);
        if (sRes.data?.length > 0) setSelectedSubjectId(String(sRes.data[0].id));
      }
      if (stuRes.success) {
        setStudents(stuRes.data || []);
        const initMap: Record<number, 'present' | 'absent' | 'late' | 'excused'> = {};
        (stuRes.data || []).forEach((st: Student) => {
          initMap[st.id] = 'present';
        });
        setAttendanceMap(initMap);
      }
      if (sesRes.success) setSessions(sesRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkAll = (status: 'present' | 'absent') => {
    const updated: Record<number, 'present' | 'absent' | 'late' | 'excused'> = {};
    students.forEach((st) => {
      updated[st.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleToggleStatus = (studentId: number, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSuccessMessage(null);

      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId: Number(studentId),
        status,
      }));

      const res = await api.post('/attendance/mark', {
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        date: sessionDate,
        timeSlot,
        topicCovered,
        records,
      });

      if (res.success) {
        setSuccessMessage(`Attendance successfully recorded for ${records.length} students in PostgreSQL!`);
        setTimeout(() => setSuccessMessage(null), 4000);
        const sesRes = await api.get('/attendance/sessions');
        if (sesRes.success) setSessions(sesRes.data || []);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'absent').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Lecture Attendance Register</h2>
        <p className="text-xs text-slate-500 mt-0.5">Take live period roll call with instant compliance calculation against the 75% threshold</p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Session Metadata Configuration Form */}
      <form onSubmit={handleSubmitAttendance} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" /> Class Session Parameters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class & Section</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} (Section {c.section})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Module</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lecture Date</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Period Time Slot</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="09:00 - 10:00 AM">09:00 - 10:00 AM</option>
                <option value="10:00 - 11:00 AM">10:00 - 11:00 AM</option>
                <option value="11:15 - 12:15 PM">11:15 - 12:15 PM</option>
                <option value="01:30 - 02:30 PM">01:30 - 02:30 PM</option>
                <option value="02:30 - 03:30 PM">02:30 - 03:30 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Curriculum Topic Covered *</label>
            <input
              type="text"
              required
              value={topicCovered}
              onChange={(e) => setTopicCovered(e.target.value)}
              placeholder="e.g. Chapter 4: Relational Algebra and Normalization Forms"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
        </div>

        {/* Student Roll Call Matrix */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" /> Student Roll Call ({students.length} Enrolled)
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {presentCount} Present
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                  {absentCount} Absent
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll('present')}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('absent')}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {students.map((st) => {
              const status = attendanceMap[st.id] || 'present';
              return (
                <div
                  key={st.id}
                  className="p-3 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={st.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={st.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">{st.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">Roll: {st.rollNo} • ID: {st.studentIdNum}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(st.id, 'present')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        status === 'present'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(st.id, 'absent')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        status === 'absent'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(st.id, 'late')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        status === 'late'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Late
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Audit log will record attendance submission by your authenticated faculty UID
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving to Database...' : 'Submit & Commit Attendance'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
