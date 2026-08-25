import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { Assignment, AssignmentSubmission, Subject, ClassSection } from '../../types.ts';
import { FileText, Plus, CheckCircle, Clock, Award, Paperclip, Eye, Send, ArrowRight } from 'lucide-react';
import { Modal } from '../../components/common/Modal.tsx';
import { Badge } from '../../components/common/Badge.tsx';

export const FacultyAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<AssignmentSubmission | null>(null);

  // Forms
  const [assignForm, setAssignForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    dueDate: '2025-11-20',
    maxMarks: '100',
    attachmentUrl: 'https://storage.googleapis.com/aitm-materials/assignment_spec.pdf',
    attachmentName: 'Assignment_Specification.pdf',
  });

  const [gradeForm, setGradeForm] = useState({
    marksObtained: '85',
    grade: 'A',
    feedback: 'Well-structured codebase with comprehensive test coverage and documentation.',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aRes, sRes, cRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/subjects'),
        api.get('/classes'),
      ]);
      if (aRes.success) {
        setAssignments(aRes.data || []);
        if (aRes.data?.length > 0 && !selectedAssignment) {
          setSelectedAssignment(aRes.data[0]);
        }
      }
      if (sRes.success) {
        setSubjects(sRes.data || []);
        if (sRes.data?.length > 0) setAssignForm((f) => ({ ...f, subjectId: String(sRes.data[0].id) }));
      }
      if (cRes.success) {
        setClasses(cRes.data || []);
        if (cRes.data?.length > 0) setAssignForm((f) => ({ ...f, classId: String(cRes.data[0].id) }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (assignmentId: number) => {
    try {
      const res = await api.get(`/assignments/${assignmentId}/submissions`);
      if (res.success) setSubmissions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissions(selectedAssignment.id);
    }
  }, [selectedAssignment]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/assignments', assignForm);
      if (res.success) {
        setIsCreateModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    try {
      const res = await api.post(`/assignments/grade/${selectedSub.id}`, gradeForm);
      if (res.success) {
        setIsGradeModalOpen(false);
        if (selectedAssignment) fetchSubmissions(selectedAssignment.id);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Coursework Assignments & Submissions</h2>
          <p className="text-xs text-slate-500 mt-0.5">Publish coding problem sets, laboratory tasks, and evaluate student work</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
        >
          <Plus className="w-4 h-4" /> Create New Assignment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assignments List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Coursework</h3>
          <div className="space-y-2.5">
            {assignments.map((assign) => {
              const isSelected = selectedAssignment?.id === assign.id;
              return (
                <div
                  key={assign.id}
                  onClick={() => setSelectedAssignment(assign)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {assign.subjectCode}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">Max {assign.maxMarks} Pts</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">{assign.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{assign.description}</p>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-rose-500" /> Due: {assign.dueDate}</span>
                    <span className="text-indigo-600 font-semibold">Review →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Submissions Review */}
        <div className="lg:col-span-2 space-y-4">
          {selectedAssignment ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <span className="text-xs font-bold text-indigo-600">{selectedAssignment.subjectName}</span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedAssignment.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Due Date: {selectedAssignment.dueDate} • Maximum Marks: {selectedAssignment.maxMarks}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-md text-slate-700">
                    {submissions.length} Submissions Received
                  </span>
                </div>
              </div>

              {/* Submissions List */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Student</th>
                      <th className="px-4 py-2.5">Submitted On</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Score</th>
                      <th className="px-4 py-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          No student submissions received for this assignment yet.
                        </td>
                      </tr>
                    ) : (
                      submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{sub.studentName}</p>
                            <p className="text-[11px] text-slate-500 font-mono">Roll: {sub.rollNo}</p>
                          </td>
                          <td className="px-4 py-3">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <Badge variant={sub.status === 'graded' ? 'success' : 'warning'}>
                              {(sub.status || 'submitted').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {sub.marksObtained ? (
                              <span className="font-bold text-emerald-700">{sub.marksObtained} / {selectedAssignment.maxMarks} ({sub.grade})</span>
                            ) : (
                              <span className="text-slate-400">Not graded</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setSelectedSub(sub);
                                setGradeForm({
                                  marksObtained: sub.marksObtained || '90',
                                  grade: sub.grade || 'A',
                                  feedback: sub.feedback || 'Excellent implementation and clean documentation.',
                                });
                                setIsGradeModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200"
                            >
                              {sub.status === 'graded' ? 'Edit Grade' : 'Grade Now'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              Select an assignment on the left to review student submissions
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE ASSIGNMENT */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Coursework Assignment">
        <form onSubmit={handleCreateAssignment} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Module</label>
              <select
                value={assignForm.subjectId}
                onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class Section</label>
              <select
                value={assignForm.classId}
                onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} (Sec {c.section})</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Title *</label>
            <input
              type="text"
              required
              value={assignForm.title}
              onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
              placeholder="e.g. Lab Exercise 4: Query Optimization & Indexing in PostgreSQL"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Task Instructions & Rubric</label>
            <textarea
              rows={3}
              value={assignForm.description}
              onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            ></textarea>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={assignForm.dueDate}
                onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Points</label>
              <input
                type="number"
                value={assignForm.maxMarks}
                onChange={(e) => setAssignForm({ ...assignForm, maxMarks: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs">Publish Assignment</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: GRADE SUBMISSION */}
      <Modal isOpen={isGradeModalOpen} onClose={() => setIsGradeModalOpen(false)} title="Grade Student Submission">
        <form onSubmit={handleGradeSubmission} className="space-y-3">
          {selectedSub && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <p className="font-bold text-slate-900">{selectedSub.studentName} ({selectedSub.rollNo})</p>
              <p className="text-slate-600 mt-1 italic">"{selectedSub.submissionText || 'Attached project source files and PDF documentation.'}"</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Marks Awarded</label>
              <input
                type="number"
                required
                value={gradeForm.marksObtained}
                onChange={(e) => setGradeForm({ ...gradeForm, marksObtained: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Letter Grade</label>
              <select
                value={gradeForm.grade}
                onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="O">O (Outstanding - 10.0)</option>
                <option value="A+">A+ (Excellent - 9.0)</option>
                <option value="A">A (Very Good - 8.0)</option>
                <option value="B+">B+ (Good - 7.0)</option>
                <option value="B">B (Above Average - 6.0)</option>
                <option value="C">C (Pass - 5.0)</option>
                <option value="F">F (Fail - 0.0)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Written Feedback to Student</label>
            <textarea
              rows={3}
              value={gradeForm.feedback}
              onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
              placeholder="Constructive feedback on code structure, algorithmic efficiency, etc."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            ></textarea>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsGradeModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs">Commit Grade</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
