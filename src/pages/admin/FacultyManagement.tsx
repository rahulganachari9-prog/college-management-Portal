import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../../components/common/DataTable.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { Badge } from '../../components/common/Badge.tsx';
import { api } from '../../lib/apiClient.ts';
import { FacultyMember, Department } from '../../types.ts';
import { Plus, UserPlus, Mail, Phone, Building, GraduationCap, Edit2, Trash2 } from 'lucide-react';

export const FacultyManagement: React.FC = () => {
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    designation: 'Assistant Professor',
    departmentId: '',
    qualification: 'Ph.D. in Computer Science',
    specialization: 'Artificial Intelligence & Distributed Systems',
    officeRoom: 'Tech Block 402',
    joiningDate: '2023-08-01',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facRes, deptRes] = await Promise.all([
        api.get('/faculty'),
        api.get('/departments'),
      ]);
      if (facRes.success) setFacultyList(facRes.data || []);
      if (deptRes.success) setDepartments(deptRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/faculty', formData);
      if (res.success) {
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          employeeId: '',
          designation: 'Assistant Professor',
          departmentId: '',
          qualification: 'Ph.D. in Computer Science',
          specialization: 'Artificial Intelligence & Distributed Systems',
          officeRoom: 'Tech Block 402',
          joiningDate: '2023-08-01',
        });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create faculty');
    }
  };

  const columns: Column<FacultyMember>[] = [
    {
      header: 'Faculty Member',
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
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{row.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Designation',
      accessor: 'designation',
      sortable: true,
      render: (row) => <span className="font-semibold text-xs text-slate-800">{row.designation}</span>,
    },
    {
      header: 'Department',
      accessor: 'departmentId',
      render: (row) => {
        const dept = departments.find((d) => d.id === row.departmentId);
        return <Badge variant="primary">{dept ? dept.code : 'Engineering'}</Badge>;
      },
    },
    {
      header: 'Specialization & Office',
      render: (row) => (
        <div className="text-xs text-slate-600 max-w-xs truncate">
          <p className="font-medium text-slate-800 truncate">{row.specialization || 'Computer Science'}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Room: {row.officeRoom || 'Faculty Block'}</p>
        </div>
      ),
    },
    {
      header: 'Contact',
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
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Faculty & Academic Staff</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage professors, associate scholars, designations, and department workloads</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              name: '',
              email: '',
              phone: '',
              employeeId: `EMP-FAC-${Math.floor(1000 + Math.random() * 9000)}`,
              designation: 'Assistant Professor',
              departmentId: departments[0]?.id ? String(departments[0].id) : '1',
              qualification: 'Ph.D. / M.Tech',
              specialization: 'Cloud Computing & Distributed Systems',
              officeRoom: 'Block B-302',
              joiningDate: '2024-01-15',
            });
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={facultyList}
        isLoading={loading}
        title="Faculty"
        searchPlaceholder="Search faculty by name, employee ID, specialization, or email..."
        searchField={(f) => `${f.name} ${f.employeeId} ${f.email} ${f.specialization}`}
      />

      {/* ADD FACULTY MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Faculty Member"
        subtitle="Create academic scholar profile with employee credentials"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateFaculty} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dr. Alan Turing"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Institutional Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="alan.turing@aitm.edu"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Designation</label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Adjunct Lecturer">Adjunct Lecturer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Office Room</label>
              <input
                type="text"
                value={formData.officeRoom}
                onChange={(e) => setFormData({ ...formData, officeRoom: e.target.value })}
                placeholder="Tech Complex 304"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Research Specialization</label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="e.g. Distributed Consensus, Neural Networks"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
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
              Register Faculty
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
