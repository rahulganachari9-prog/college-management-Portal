import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { StudyMaterial, Subject } from '../../types.ts';
import { BookOpen, Plus, Download, FileText, Trash2, Eye, HardDrive, Layers } from 'lucide-react';
import { Modal } from '../../components/common/Modal.tsx';
import { Badge } from '../../components/common/Badge.tsx';

export const FacultyStudyMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    subjectId: '',
    title: '',
    description: '',
    fileUrl: 'https://storage.googleapis.com/aitm-curriculum/lecture_slides_unit3.pdf',
    fileName: 'Unit_3_Distributed_Computing_Slides.pdf',
    fileType: 'pdf',
    fileSize: '4.2 MB',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, sRes] = await Promise.all([
        api.get('/study-materials'),
        api.get('/subjects'),
      ]);
      if (mRes.success) setMaterials(mRes.data || []);
      if (sRes.success) {
        setSubjects(sRes.data || []);
        if (sRes.data?.length > 0 && !form.subjectId) {
          setForm((f) => ({ ...f, subjectId: String(sRes.data[0].id) }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/study-materials', form);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Curriculum Study Materials & Course Notes</h2>
          <p className="text-xs text-slate-500 mt-0.5">Distribute lecture slides, reference PDFs, and reading assignments to enrolled students</p>
        </div>
        <button
          onClick={() => {
            setForm({
              subjectId: String(subjects[0]?.id || '1'),
              title: '',
              description: '',
              fileUrl: 'https://storage.googleapis.com/aitm-curriculum/lecture_notes.pdf',
              fileName: 'Lecture_Handout_Module_2.pdf',
              fileType: 'pdf',
              fileSize: '3.5 MB',
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
        >
          <Plus className="w-4 h-4" /> Upload Study Material
        </button>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            No study materials uploaded yet. Click above to upload lecture slides or notes.
          </div>
        ) : (
          materials.map((m) => (
            <div key={m.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {m.subjectCode}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">{m.fileType || 'PDF'} • {m.fileSize || '2.4 MB'}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-2.5">{m.title}</h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{m.description || 'Lecture reading notes and practical references.'}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-2 bg-slate-50 p-1.5 rounded border border-slate-100 truncate">
                  📄 {m.fileName || 'Curriculum_Material.pdf'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">{m.downloadCount || 0} Downloads</span>
                <a
                  href={m.fileUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* UPLOAD MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Learning Resource / Handout">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Module *</label>
            <select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Material Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Unit 2: CPU Scheduling Algorithms & Gantt Charts"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Summary</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Briefly state what chapters or topics are covered..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">File Name</label>
              <input
                type="text"
                value={form.fileName}
                onChange={(e) => setForm({ ...form, fileName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Format Type</label>
              <select
                value={form.fileType}
                onChange={(e) => setForm({ ...form, fileType: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg uppercase"
              >
                <option value="pdf">PDF Document</option>
                <option value="slides">Presentation Slides</option>
                <option value="notes">Lecture Notes</option>
                <option value="zip">Source Code ZIP</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs">Publish Material</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
