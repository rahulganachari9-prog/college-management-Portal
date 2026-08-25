import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../../components/common/DataTable.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { Badge } from '../../components/common/Badge.tsx';
import { api } from '../../lib/apiClient.ts';
import { Student, Department, Course, ClassSection } from '../../types.ts';
import { Plus, Edit2, Trash2, Eye, UserPlus, GraduationCap, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    studentIdNum: '',
    rollNo: '',
    departmentId: '',
    courseId: '',
    classId: '',
    semesterId: '1',
    admissionYear: '2025',
    gender: 'Male',
    bloodGroup: 'O+',
    guardianName: '',
    guardianPhone: '',
    address: '',
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [stuRes, deptRes, courseRes, classRes] = await Promise.all([
        api.get('/students?limit=100'),
        api.get('/departments'),
        api.get('/courses'),
        api.get('/classes'),
      ]);

      if (stuRes.success) setStudents(stuRes.data || []);
      if (deptRes.success) setDepartments(deptRes.data || []);
      if (courseRes.success) setCourses(courseRes.data || []);
      if (classRes.success) setClasses(classRes.data || []);
    } catch (err) {
      console.error('Failed to fetch student management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/students', formData);
      if (res.success) {
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          studentIdNum: '',
          rollNo: '',
          departmentId: '',
          courseId: '',
          classId: '',
          semesterId: '1',
          admissionYear: '2025',
          gender: 'Male',
          bloodGroup: 'O+',
          guardianName: '',
          guardianPhone: '',
          address: '',
        });
        fetchAllData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create student');
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const res = await api.put(`/students/${selectedStudent.id}`, formData);
      if (res.success) {
        setIsEditModalOpen(false);
        fetchAllData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update student');
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this student record?')) return;
    try {
      await api.delete(`/students/${id}`);
      fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete student');
    }
  };

  const columns: Column<Student>[] = [
    {
      header: 'Student Info',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={row.name}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
          />
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">{row.name}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{row.studentIdNum}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Roll Number',
      accessor: 'rollNo',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-slate-700 font-semibold">{row.rollNo}</span>,
    },
    {
      header: 'Department',
      accessor: 'departmentId',
      render: (row) => {
        const dept = departments.find((d) => d.id === row.departmentId);
        return <Badge variant="primary">{dept ? dept.code : 'General'}</Badge>;
      },
    },
    {
      header: 'CGPA',
      accessor: 'cgpa',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {row.cgpa || '0.00'} / 10.0
        </span>
      ),
    },
    {
      header: 'Contact',
      accessor: 'email',
      render: (row) => (
        <div className="text-xs text-slate-600">
          <p className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {row.email}</p>
          {row.phone && <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5"><Phone className="w-3 h-3 text-slate-400" /> {row.phone}</p>}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'neutral'}>
          {row.status || 'Active'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedStudent(row);
              setIsViewModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
            title="View Academic Bio"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedStudent(row);
              setFormData({
                name: row.name || '',
                email: row.email || '',
                phone: row.phone || '',
                studentIdNum: row.studentIdNum || '',
                rollNo: row.rollNo || '',
                departmentId: String(row.departmentId || ''),
                courseId: String(row.courseId || ''),
                classId: String(row.classId || ''),
                semesterId: String(row.semesterId || '1'),
                admissionYear: row.admissionYear || '2025',
                gender: row.gender || 'Male',
                bloodGroup: row.bloodGroup || 'O+',
                guardianName: row.guardianName || '',
                guardianPhone: row.guardianPhone || '',
                address: row.address || '',
              });
              setIsEditModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Edit Profile"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteStudent(row.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Delete Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Student Directory & Admissions</h2>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive enrollment registry and individual academic profiles</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              name: '',
              email: '',
              phone: '',
              studentIdNum: `AITM25CS${Math.floor(100 + Math.random() * 900)}`,
              rollNo: `25CS${Math.floor(100 + Math.random() * 900)}`,
              departmentId: departments[0]?.id ? String(departments[0].id) : '1',
              courseId: courses[0]?.id ? String(courses[0].id) : '1',
              classId: classes[0]?.id ? String(classes[0].id) : '1',
              semesterId: '1',
              admissionYear: '2025',
              gender: 'Male',
              bloodGroup: 'O+',
              guardianName: '',
              guardianPhone: '',
              address: '',
            });
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={students}
        isLoading={loading}
        title="Students"
        searchPlaceholder="Search by name, student ID, roll number, or email..."
        searchField={(s) => `${s.name} ${s.studentIdNum} ${s.rollNo} ${s.email}`}
      />

      {/* ADD STUDENT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll New Student"
        subtitle="Create institutional user profile and allocate student identifier"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Institutional Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. rahul.sharma@student.aitm.edu"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Student ID # *</label>
              <input
                type="text"
                required
                value={formData.studentIdNum}
                onChange={(e) => setFormData({ ...formData, studentIdNum: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Roll Number *</label>
              <input
                type="text"
                required
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Academic Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Degree Course</label>
              <select
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Guardian Name</label>
              <input
                type="text"
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                placeholder="Parent / Guardian"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Guardian Phone</label>
              <input
                type="tel"
                value={formData.guardianPhone}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                placeholder="+91 9876500000"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Enroll Student
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW PROFILE MODAL */}
      {selectedStudent && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Student Academic Bio"
          subtitle={`Student ID: ${selectedStudent.studentIdNum}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src={selectedStudent.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                alt={selectedStudent.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500/30 shadow-xs"
              />
              <div>
                <h4 className="text-base font-bold text-slate-900">{selectedStudent.name}</h4>
                <p className="text-xs text-slate-500 font-mono">Roll: {selectedStudent.rollNo}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="primary">
                    {departments.find((d) => d.id === selectedStudent.departmentId)?.name || 'Computer Science'}
                  </Badge>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    CGPA: {selectedStudent.cgpa || '8.85'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-medium">Email Address</span>
                <span className="font-semibold text-slate-800 break-all">{selectedStudent.email}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-medium">Phone</span>
                <span className="font-semibold text-slate-800">{selectedStudent.phone || '—'}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-medium">Guardian Contact</span>
                <span className="font-semibold text-slate-800">{selectedStudent.guardianName || 'Parent'} ({selectedStudent.guardianPhone || '—'})</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-medium">Admission Year</span>
                <span className="font-semibold text-slate-800">{selectedStudent.admissionYear} (Batch 2025-2029)</span>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
              >
                Close Bio
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
