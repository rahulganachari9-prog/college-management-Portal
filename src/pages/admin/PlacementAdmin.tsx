import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { Company, JobOpportunity, JobApplication } from '../../types.ts';
import { Briefcase, Building2, Users, Plus, CheckCircle, Clock, DollarSign, MapPin, Eye, Award } from 'lucide-react';
import { Modal } from '../../components/common/Modal.tsx';
import { Badge } from '../../components/common/Badge.tsx';

export const PlacementAdmin: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'applications' | 'jobs' | 'companies'>('applications');
  const [loading, setLoading] = useState(true);

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);

  // Forms
  const [companyForm, setCompanyForm] = useState({
    name: '',
    industry: 'Information Technology',
    website: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
  });

  const [jobForm, setJobForm] = useState({
    companyId: '',
    jobTitle: '',
    jobRole: 'Software Engineer',
    jobType: 'full_time',
    salaryPackage: '14.5 LPA',
    location: 'Bangalore / Remote',
    minCgpa: '7.5',
    eligibleDepartments: 'CSE, ECE, IT',
    deadline: '2025-11-30',
    description: '',
  });

  const [stageForm, setStageForm] = useState({
    status: 'shortlisted',
    currentStage: 'Technical Interview Round 1',
    notes: 'Shortlisted based on CGPA and coding assessment.',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, jRes, aRes] = await Promise.all([
        api.get('/placements/companies'),
        api.get('/placements/jobs'),
        api.get('/placements/applications'),
      ]);
      if (cRes.success) setCompanies(cRes.data || []);
      if (jRes.success) {
        setJobs(jRes.data || []);
        if (cRes.data?.length > 0 && !jobForm.companyId) {
          setJobForm((f) => ({ ...f, companyId: String(cRes.data[0].id) }));
        }
      }
      if (aRes.success) setApplications(aRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/placements/companies', companyForm);
      setIsCompanyModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/placements/jobs', jobForm);
      setIsJobModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateAppStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      await api.put(`/placements/applications/${selectedApp.id}/status`, stageForm);
      setIsStageModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Career Development & Corporate Placement Cell</h2>
          <p className="text-xs text-slate-500 mt-0.5">Corporate recruitment drives, job openings, and candidate shortlisting pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'companies' && (
            <button
              onClick={() => setIsCompanyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Partner Company
            </button>
          )}
          {activeTab === 'jobs' && (
            <button
              onClick={() => {
                setJobForm({ ...jobForm, companyId: String(companies[0]?.id || '1') });
                setIsJobModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              <Plus className="w-4 h-4" /> Post Job Opportunity
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'applications' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Candidate Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'jobs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Job Opportunities ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'companies' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Partner Companies ({companies.length})
        </button>
      </div>

      {/* TAB 1: APPLICATIONS PIPELINE */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600 uppercase">
              <tr>
                <th className="px-6 py-3">Applicant Student</th>
                <th className="px-6 py-3">Company & Role</th>
                <th className="px-6 py-3">Package</th>
                <th className="px-6 py-3">Current Stage</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">No applications in pipeline</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-900 text-xs">{app.studentName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">Roll: {app.rollNo} • CGPA: {app.studentCgpa}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-800 text-xs">{app.jobTitle}</p>
                      <p className="text-[11px] text-indigo-600 font-medium">{app.companyName}</p>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-xs text-emerald-700">{app.salaryPackage}</td>
                    <td className="px-6 py-3.5 text-xs text-slate-700 font-medium">{app.currentStage}</td>
                    <td className="px-6 py-3.5">
                      <Badge
                        variant={
                          app.status === 'offered' || app.status === 'accepted'
                            ? 'success'
                            : app.status === 'shortlisted' || app.status === 'interviewing'
                            ? 'primary'
                            : 'neutral'
                        }
                      >
                        {(app.status || 'applied').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setStageForm({
                            status: app.status,
                            currentStage: app.currentStage,
                            notes: app.notes || '',
                          });
                          setIsStageModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200"
                      >
                        Update Stage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: JOBS */}
      {activeTab === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {job.companyName}
                  </span>
                  <Badge variant="success">{job.salaryPackage}</Badge>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-2">{job.jobTitle}</h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{job.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}</p>
                <p className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-slate-400" /> Min CGPA: {job.minCgpa}</p>
                <p className="text-[11px] text-rose-600 font-medium pt-1">Deadline: {job.deadline}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: COMPANIES */}
      {activeTab === 'companies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((comp) => (
            <div key={comp.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <Badge variant="primary">{comp.industry}</Badge>
                <h3 className="text-base font-bold text-slate-900 mt-2">{comp.name}</h3>
                <p className="text-xs text-slate-600 mt-1">{comp.description || 'Tier-1 Technology Partner'}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <p>Contact: {comp.contactPerson || 'HR Campus Relations'}</p>
                <p className="text-slate-400 font-mono text-[11px]">{comp.contactEmail || 'campus-hiring@company.com'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: POST JOB */}
      <Modal isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)} title="Post Placement Drive / Opening">
        <form onSubmit={handleCreateJob} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
              <select
                value={jobForm.companyId}
                onChange={(e) => setJobForm({ ...jobForm, companyId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Type</label>
              <select
                value={jobForm.jobType}
                onChange={(e) => setJobForm({ ...jobForm, jobType: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="full_time">Full Time</option>
                <option value="internship">6-Month Internship</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title *</label>
            <input
              type="text"
              required
              value={jobForm.jobTitle}
              onChange={(e) => setJobForm({ ...jobForm, jobTitle: e.target.value })}
              placeholder="e.g. Graduate Cloud Engineer"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Package (CTC / Stipend)</label>
              <input
                type="text"
                value={jobForm.salaryPackage}
                onChange={(e) => setJobForm({ ...jobForm, salaryPackage: e.target.value })}
                placeholder="e.g. 18.0 LPA"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum CGPA</label>
              <input
                type="text"
                value={jobForm.minCgpa}
                onChange={(e) => setJobForm({ ...jobForm, minCgpa: e.target.value })}
                placeholder="7.5"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Application Deadline</label>
            <input
              type="date"
              value={jobForm.deadline}
              onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsJobModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs">Publish Opening</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: UPDATE STAGE */}
      <Modal isOpen={isStageModalOpen} onClose={() => setIsStageModalOpen(false)} title="Update Candidate Stage">
        <form onSubmit={handleUpdateAppStatus} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hiring Status</label>
            <select
              value={stageForm.status}
              onChange={(e) => setStageForm({ ...stageForm, status: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interviewing">Interviewing</option>
              <option value="offered">Offer Extended</option>
              <option value="accepted">Offer Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Evaluation Stage</label>
            <input
              type="text"
              value={stageForm.currentStage}
              onChange={(e) => setStageForm({ ...stageForm, currentStage: e.target.value })}
              placeholder="e.g. Technical Round 2 / HR Final"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Evaluator Notes</label>
            <textarea
              rows={3}
              value={stageForm.notes}
              onChange={(e) => setStageForm({ ...stageForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            ></textarea>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsStageModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs">Save Stage</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD COMPANY */}
      <Modal isOpen={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} title="Register Corporate Partner">
        <form onSubmit={handleCreateCompany} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={companyForm.name}
              onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              placeholder="e.g. Microsoft / Google / AWS"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Industry Sector</label>
            <input
              type="text"
              value={companyForm.industry}
              onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
              placeholder="e.g. Enterprise Cloud & AI"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
            <input
              type="email"
              value={companyForm.contactEmail}
              onChange={(e) => setCompanyForm({ ...companyForm, contactEmail: e.target.value })}
              placeholder="university-recruiting@company.com"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsCompanyModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs">Save Partner</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
