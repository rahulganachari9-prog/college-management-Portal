import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { JobOpportunity, JobApplication } from '../../types.ts';
import { Briefcase, Building2, MapPin, DollarSign, Award, Clock, CheckCircle, Send } from 'lucide-react';
import { Modal } from '../../components/common/Modal.tsx';
import { Badge } from '../../components/common/Badge.tsx';

export const StudentPlacementsView: React.FC = () => {
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('https://storage.googleapis.com/aitm-resumes/alex_chen_cv.pdf');
  const [applying, setApplying] = useState(false);

  const studentCgpa = 8.92;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jRes, aRes] = await Promise.all([
        api.get('/placements/jobs'),
        api.get('/placements/applications'),
      ]);
      if (jRes.success) setJobs(jRes.data || []);
      if (aRes.success) setMyApplications(aRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    try {
      setApplying(true);
      const res = await api.post(`/placements/jobs/${selectedJob.id}/apply`, {
        resumeUrl,
      });
      if (res.success) {
        setIsApplyModalOpen(false);
        alert('Application submitted successfully to corporate recruiters!');
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Application failed');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Corporate Campus Placements & Recruitment</h2>
        <p className="text-xs text-slate-500 mt-0.5">Explore university hiring drives, verify CGPA eligibility, and submit job applications</p>
      </div>

      {/* Applied Opportunities Tracker */}
      {myApplications.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Your Active Recruitment Applications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myApplications.map((app) => (
              <div key={app.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{app.jobTitle}</h4>
                  <p className="text-[11px] text-indigo-600 font-semibold">{app.companyName} • {app.salaryPackage}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Stage: {app.currentStage || 'Application Submitted'}</p>
                </div>
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job Openings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {jobs.map((job) => {
          const minCgpaNum = parseFloat(job.minCgpa || '0');
          const isEligible = studentCgpa >= minCgpaNum;
          const hasApplied = myApplications.some((a) => (a.jobOpportunityId || a.jobId) === job.id);

          return (
            <div
              key={job.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-indigo-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {job.companyName}
                  </span>
                  <Badge variant="success">{job.salaryPackage}</Badge>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-3">{job.jobTitle}</h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{job.description || 'Full-time campus graduate hiring program.'}</p>

                <div className="mt-3 space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}</p>
                  <p className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400" /> Min CGPA: {job.minCgpa} (Your CGPA: {studentCgpa})
                  </p>
                  <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-rose-500" /> Deadline: {job.deadline}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                {hasApplied ? (
                  <button
                    disabled
                    className="w-full py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 cursor-default"
                  >
                    ✓ Applied
                  </button>
                ) : isEligible ? (
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setIsApplyModalOpen(true);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Apply for Opening
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed"
                  >
                    Ineligible (CGPA &lt; {job.minCgpa})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* APPLY MODAL */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={selectedJob ? `Apply to ${selectedJob.companyName} (${selectedJob.jobTitle})` : 'Job Application'}
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-200 text-xs">
            <p className="font-bold text-indigo-900">Eligibility Verified</p>
            <p className="text-indigo-700 mt-0.5">
              Your CGPA ({studentCgpa}) satisfies the minimum threshold requirement ({selectedJob?.minCgpa}) for this opening.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resume / CV Document URL *</label>
            <input
              type="text"
              required
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              placeholder="https://storage.googleapis.com/..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applying}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              {applying ? 'Submitting Application...' : 'Confirm & Submit Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
