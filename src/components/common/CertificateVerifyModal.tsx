import React, { useState } from 'react';
import { Modal } from './Modal.tsx';
import { api } from '../../lib/apiClient.ts';
import { Search, CheckCircle2, AlertCircle, ShieldCheck, Award, Calendar, User, Building } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const CertificateVerifyModal: React.FC<Props> = ({ isOpen, onClose, initialCode = '' }) => {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await api.get(`/certificates/verify/${encodeURIComponent(code.trim())}`);
      if (res.success && res.data) {
        setResult(res.data);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } else {
        setError(res.message || 'No valid certificate record found for this identifier.');
      }
    } catch (err: any) {
      setError(err.message || 'Certificate verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Instant Public Certificate Verification"
      subtitle="Verify authenticity and institutional validity against PostgreSQL registry"
      maxWidth="lg"
    >
      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Verification Code or Certificate #
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. VERIF-AITM-88219-X9 or CERT-2025-88219"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Now'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Verification Unsuccessful</p>
              <p className="text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-emerald-600 text-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Valid & Verified Document</h4>
                  <p className="text-[11px] text-emerald-700 font-mono">{result.verificationCode}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded-md uppercase">
                Tamper-Proof Record
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-800">
              <div>
                <p className="text-slate-500 font-semibold">Title of Award:</p>
                <p className="font-bold text-slate-900 text-sm">{result.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 bg-white/80 rounded-lg border border-emerald-100">
                  <p className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-emerald-600" /> Recipient Name
                  </p>
                  <p className="font-bold text-slate-900 mt-0.5">{result.studentName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Roll: {result.studentRollNo || '—'}</p>
                </div>
                <div className="p-2.5 bg-white/80 rounded-lg border border-emerald-100">
                  <p className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Date of Issuance
                  </p>
                  <p className="font-bold text-slate-900 mt-0.5">{result.issueDate}</p>
                  <p className="text-[11px] text-slate-500">{(result.type || result.certificateType || 'ACADEMIC').toUpperCase()} CERTIFICATION</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-slate-500 font-medium">Official Citation:</p>
                <p className="text-slate-700 italic bg-white/70 p-2.5 rounded-lg border border-emerald-100 mt-1">
                  "{result.description}"
                </p>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Issuing Authority: {result.institution}</span>
                <span>DB Timestamp: {new Date(result.verifiedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
