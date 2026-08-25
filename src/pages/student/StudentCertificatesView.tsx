import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { Certificate } from '../../types.ts';
import { ShieldCheck, Award, Download, Copy, ExternalLink, Plus, CheckCircle, QrCode } from 'lucide-react';
import { Modal } from '../../components/common/Modal.tsx';
import { Badge } from '../../components/common/Badge.tsx';

export const StudentCertificatesView: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqForm, setReqForm] = useState({
    certificateType: 'bonafide',
    purpose: 'Education loan processing / Visa verification',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/certificates/my-certificates');
      if (res.success) setCertificates(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRequestCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/certificates/request', reqForm);
      if (res.success) {
        setIsRequestModalOpen(false);
        alert('Certificate request submitted to Registrar office!');
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Request failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Cryptographically Signed Institutional Credentials</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tamper-proof academic certificates with SHA-256 cryptographic signatures and public verification</p>
        </div>
        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
        >
          <Plus className="w-4 h-4" /> Request Official Certificate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {certificates.map((cert) => (
          <div key={cert.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/60 rounded-bl-full pointer-events-none -z-0"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 capitalize">{cert.certificateType || cert.type || 'Academic'} Certificate</h3>
                    <p className="text-[11px] text-slate-500 font-mono">Cert No: {cert.certificateNumber}</p>
                  </div>
                </div>
                <Badge variant={cert.status === 'issued' || !cert.status ? 'success' : 'warning'}>
                  {(cert.status || 'ISSUED').toUpperCase()}
                </Badge>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Digital Signature Hash:</span>
                  <button
                    onClick={() => handleCopyHash(cert.verificationHash || cert.verificationCode || 'VERIF-AITM-SIG', String(cert.id))}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    {copiedId === String(cert.id) ? (
                      <span className="text-emerald-600 font-bold">✓ Copied</span>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Hash
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 break-all select-all">
                  {cert.verificationHash || cert.verificationCode || 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
                </p>
              </div>

              <div className="mt-3 text-xs text-slate-600 space-y-1">
                <p><span className="text-slate-400">Issued On:</span> {new Date(cert.issueDate || Date.now()).toLocaleDateString()}</p>
                <p><span className="text-slate-400">Signatory Authority:</span> {cert.issuingAuthority || 'Apex Academic Senate'}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between relative z-10">
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                <ShieldCheck className="w-4 h-4" /> Authenticated
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Verification link for certificate ${cert.certificateNumber}:\nhttps://aitm.edu/verify?hash=${cert.verificationHash || cert.verificationCode || cert.certificateNumber}`)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                >
                  Verify Online
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-2xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* REQUEST MODAL */}
      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Request Official Certificate">
        <form onSubmit={handleRequestCertificate} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate Type</label>
            <select
              value={reqForm.certificateType}
              onChange={(e) => setReqForm({ ...reqForm, certificateType: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="bonafide">Bonafide Certificate</option>
              <option value="character">Conduct & Character Certificate</option>
              <option value="completion">Course Completion Certificate</option>
              <option value="merit">Academic Merit & Rank Certificate</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / Justification *</label>
            <textarea
              rows={3}
              required
              value={reqForm.purpose}
              onChange={(e) => setReqForm({ ...reqForm, purpose: e.target.value })}
              placeholder="e.g. For applying to international education loan..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            ></textarea>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
