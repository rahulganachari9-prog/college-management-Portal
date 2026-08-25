import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { Assignment, AssignmentSubmission } from '../../types.ts';
import { FileText, Clock, CheckCircle2, Award, Upload, Send, MessageSquare } from 'lucide-react';
import { Modal } from '../../components/common/Modal.tsx';
import { Badge } from '../../components/common/Badge.tsx';

export const StudentAssignmentsView: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState('https://github.com/alexchen/cs405-lab-exercise');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      if (res.success) setAssignments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/assignments/${selectedAssignment.id}/submit`, {
        submissionText,
        fileUrl,
        fileName: 'Submission_Code_Repository.url',
      });
      if (res.success) {
        setIsSubmitModalOpen(false);
        setSubmissionText('');
        alert('Assignment submitted successfully for faculty review!');
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Coursework Assignments & Submissions</h2>
        <p className="text-xs text-slate-500 mt-0.5">Submit homework, lab problems, and view faculty grading rubrics and feedback</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {assignments.map((assign) => (
          <div key={assign.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {assign.subjectCode}
                </span>
                <span className="text-xs font-bold text-slate-700">Max {assign.maxMarks} Points</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-3">{assign.title}</h3>
              <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">{assign.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-rose-500" /> Due: {assign.dueDate}</span>
                <span className="font-medium text-slate-600">{assign.subjectName}</span>
              </div>

              <button
                onClick={() => {
                  setSelectedAssignment(assign);
                  setIsSubmitModalOpen(true);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Submit Work
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SUBMISSION MODAL */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={selectedAssignment ? `Submit Work: ${selectedAssignment.title}` : 'Submit Assignment'}
      >
        <form onSubmit={handleSubmitHomework} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Submission Text / Solution Description *
            </label>
            <textarea
              rows={4}
              required
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Describe your solution approach, algorithmic time complexity, or provide explanation..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Code Repository / Cloud Drive Link (Optional)
            </label>
            <input
              type="text"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://github.com/your-username/repo-name"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              {submitting ? 'Submitting...' : 'Upload & Confirm Submission'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
