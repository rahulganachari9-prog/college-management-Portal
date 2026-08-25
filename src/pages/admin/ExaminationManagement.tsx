import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { Examination, ExamSchedule, Student } from '../../types.ts';
import { FileSpreadsheet, Plus, CheckCircle, Calendar, Sparkles, Award } from 'lucide-react';
import { Modal } from '../../components/common/Modal.tsx';
import { Badge } from '../../components/common/Badge.tsx';

export const ExaminationManagement: React.FC = () => {
  const [exams, setExams] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Examination | null>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    examType: 'midterm',
    startDate: '2025-10-15',
    endDate: '2025-10-25',
    gradingScale: 'standard_10_point',
  });

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/examinations');
      if (res.success && res.data) {
        setExams(res.data);
        if (res.data.length > 0 && !selectedExam) {
          setSelectedExam(res.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async (examId: number) => {
    try {
      const res = await api.get(`/examinations/${examId}/schedules`);
      if (res.success) setSchedules(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchSchedules(selectedExam.id);
    }
  }, [selectedExam]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/examinations', form);
      if (res.success) {
        setIsCreateModalOpen(false);
        fetchExams();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePublishResults = async (examId: number) => {
    if (!window.confirm('Are you sure you want to publish official grade cards for all students? This will make results visible in student portals.')) return;
    try {
      const res = await api.post(`/examinations/${examId}/publish-results`, {});
      if (res.success) {
        alert('Results published successfully!');
        fetchExams();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Examinations, Grading & Result Publishing</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage institutional test sessions, datesheets, and official transcript releases</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
        >
          <Plus className="w-4 h-4" /> Create Examination Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exams List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Examination Sessions</h3>
          <div className="space-y-2.5">
            {exams.map((exam) => {
              const isSelected = selectedExam?.id === exam.id;
              return (
                <div
                  key={exam.id}
                  onClick={() => setSelectedExam(exam)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={exam.isPublished ? 'success' : 'warning'}>
                      {exam.isPublished ? 'Results Published' : 'In Progress / Pending'}
                    </Badge>
                    <span className="text-[11px] font-semibold text-slate-500 capitalize">{exam.examType}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">{exam.title}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {exam.startDate} to {exam.endDate}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Exam Details & Schedule */}
        <div className="lg:col-span-2 space-y-4">
          {selectedExam ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedExam.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Scale: 10.0 CGPA Standard Absolute / Relative Grading</p>
                </div>
                {!selectedExam.isPublished ? (
                  <button
                    onClick={() => handlePublishResults(selectedExam.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Publish Results to Students
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                    <Award className="w-4 h-4" /> Official Results Active
                  </span>
                )}
              </div>

              {/* Schedules Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Datesheet & Examination Timetable ({schedules.length} Papers)
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Subject Code</th>
                        <th className="px-4 py-2.5">Subject Name</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Timing</th>
                        <th className="px-4 py-2.5">Hall</th>
                        <th className="px-4 py-2.5">Max Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schedules.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                            No subject papers scheduled yet
                          </td>
                        </tr>
                      ) : (
                        schedules.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-mono font-bold text-indigo-600">{s.subjectCode}</td>
                            <td className="px-4 py-2.5 font-semibold text-slate-900">{s.subjectName}</td>
                            <td className="px-4 py-2.5 font-medium">{s.examDate}</td>
                            <td className="px-4 py-2.5">{s.startTime} - {s.endTime}</td>
                            <td className="px-4 py-2.5 font-mono">{s.roomNumber || 'Main Exam Hall'}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-800">{s.maxMarks} (Pass: {s.passingMarks})</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              Select an examination session to view schedules and enter marks
            </div>
          )}
        </div>
      </div>

      {/* CREATE EXAM MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Examination Session">
        <form onSubmit={handleCreateExam} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Session Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. End Semester Theory Examinations - Autumn 2025"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Type</label>
            <select
              value={form.examType}
              onChange={(e) => setForm({ ...form, examType: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="midterm">Midterm Examination</option>
              <option value="final">End-Semester Final</option>
              <option value="quiz">Class Quiz / Unit Test</option>
              <option value="practical">Lab Practical & Viva</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs">Create Exam</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
