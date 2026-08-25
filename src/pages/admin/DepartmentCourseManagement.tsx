import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { Department, Course, Subject } from '../../types.ts';
import { Building2, BookOpen, Layers, Plus, Sparkles, Mail, MapPin } from 'lucide-react';
import { Modal } from '../../components/common/Modal.tsx';
import { Badge } from '../../components/common/Badge.tsx';

export const DepartmentCourseManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'departments' | 'courses' | 'subjects'>('departments');

  // Modals
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  // Forms
  const [deptForm, setDeptForm] = useState({ code: '', name: '', description: '', building: '', contactEmail: '' });
  const [courseForm, setCourseForm] = useState({ code: '', name: '', departmentId: '', durationYears: '4', totalSemesters: '8', degreeType: 'Undergraduate' });
  const [subjectForm, setSubjectForm] = useState({ code: '', name: '', departmentId: '', courseId: '', semesterNumber: '1', credits: '4', type: 'theory' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dRes, cRes, sRes] = await Promise.all([
        api.get('/departments'),
        api.get('/courses'),
        api.get('/subjects'),
      ]);
      if (dRes.success) setDepartments(dRes.data || []);
      if (cRes.success) setCourses(cRes.data || []);
      if (sRes.success) setSubjects(sRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/departments', deptForm);
      setIsDeptModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/courses', courseForm);
      setIsCourseModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/subjects', subjectForm);
      setIsSubjectModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Academic Structure & Curricula</h2>
          <p className="text-xs text-slate-500 mt-0.5">Departments, Degree Programs, and Semester Course Syllabi</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'departments' && (
            <button
              onClick={() => setIsDeptModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Department
            </button>
          )}
          {activeTab === 'courses' && (
            <button
              onClick={() => {
                setCourseForm({ ...courseForm, departmentId: String(departments[0]?.id || '1') });
                setIsCourseModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Degree Course
            </button>
          )}
          {activeTab === 'subjects' && (
            <button
              onClick={() => {
                setSubjectForm({ ...subjectForm, departmentId: String(departments[0]?.id || '1'), courseId: String(courses[0]?.id || '1') });
                setIsSubjectModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'departments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Departments ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'courses'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Degree Programs ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'subjects'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Subjects & Syllabi ({subjects.length})
        </button>
      </div>

      {/* TAB 1: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d.id} className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                    {d.code}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Est. 2012</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{d.name}</h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{d.description || 'Center of excellence in engineering and management education.'}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{d.building || 'Main Campus Tower'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{d.contactEmail || `hod.${d.code.toLowerCase()}@aitm.edu`}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: COURSES */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <Badge variant="primary">{c.degreeType}</Badge>
                <span className="font-mono text-xs text-slate-500 font-bold">{c.code}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-2">{c.name}</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-slate-400 text-[11px]">Duration</p>
                  <p className="font-bold text-slate-800">{c.durationYears} Years</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">Semesters</p>
                  <p className="font-bold text-slate-800">{c.totalSemesters} Semesters</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600 uppercase">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Subject Name</th>
                <th className="px-6 py-3">Semester</th>
                <th className="px-6 py-3">Credits</th>
                <th className="px-6 py-3">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="px-6 py-3 font-mono font-bold text-xs text-indigo-700">{s.code}</td>
                  <td className="px-6 py-3 font-semibold text-slate-900">{s.name}</td>
                  <td className="px-6 py-3 text-xs text-slate-600">Semester {s.semesterNumber}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 rounded border border-amber-200">
                      {s.credits} Credits
                    </span>
                  </td>
                  <td className="px-6 py-3 capitalize text-xs">
                    <Badge variant={s.type === 'practical' ? 'info' : 'neutral'}>{s.type}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: ADD DEPARTMENT */}
      <Modal isOpen={isDeptModalOpen} onClose={() => setIsDeptModalOpen(false)} title="Create Department">
        <form onSubmit={handleCreateDept} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Code (e.g. CSE, ECE) *</label>
            <input
              type="text"
              required
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
            <input
              type="text"
              required
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              placeholder="e.g. Department of Mechanical Engineering"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Building Location</label>
            <input
              type="text"
              value={deptForm.building}
              onChange={(e) => setDeptForm({ ...deptForm, building: e.target.value })}
              placeholder="e.g. Block C - Innovation Wing"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
            <input
              type="email"
              value={deptForm.contactEmail}
              onChange={(e) => setDeptForm({ ...deptForm, contactEmail: e.target.value })}
              placeholder="hod.mech@aitm.edu"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsDeptModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs">Save Department</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD COURSE */}
      <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title="Create Degree Program">
        <form onSubmit={handleCreateCourse} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code *</label>
            <input
              type="text"
              required
              value={courseForm.code}
              onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
              placeholder="e.g. BTECH-AI"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Degree Title *</label>
            <input
              type="text"
              required
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              placeholder="e.g. B.Tech in Artificial Intelligence & Data Science"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Years)</label>
              <input
                type="number"
                value={courseForm.durationYears}
                onChange={(e) => setCourseForm({ ...courseForm, durationYears: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Semesters</label>
              <input
                type="number"
                value={courseForm.totalSemesters}
                onChange={(e) => setCourseForm({ ...courseForm, totalSemesters: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsCourseModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs">Save Course</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD SUBJECT */}
      <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="Create Subject / Syllabus">
        <form onSubmit={handleCreateSubject} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code *</label>
              <input
                type="text"
                required
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                placeholder="CS405"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credits</label>
              <input
                type="number"
                value={subjectForm.credits}
                onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Title *</label>
            <input
              type="text"
              required
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              placeholder="e.g. Advanced Operating Systems & Virtualization"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs">Save Subject</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
