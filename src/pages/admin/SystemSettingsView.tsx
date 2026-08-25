import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { Settings, Save, CheckCircle, Shield, Building, Globe, Database } from 'lucide-react';

export const SystemSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    college_name: 'Apex Institute of Technology & Management (AITM)',
    college_code: 'AITM-0842',
    accreditation: 'NAAC Grade A++ (CGPA 3.82/4.00) & NBA Accredited',
    academic_year: '2025-2026',
    min_attendance_percentage: '75',
    grading_scale: 'standard_10_point',
    support_email: 'support@aitm.edu',
    campus_address: 'Knowledge City, Tech Corridor, Phase 4',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.success && res.data) {
        const map: Record<string, string> = {};
        res.data.forEach((s: any) => {
          map[s.settingKey] = s.settingValue;
        });
        setSettings((prev) => ({ ...prev, ...map }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = Object.entries(settings).map(([settingKey, settingValue]) => ({
        settingKey,
        settingValue,
      }));
      await api.put('/settings', { settings: payload });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Institutional Governance & System Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Global configuration parameters, academic thresholds, and institutional credentials</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" /> College Identity & Accreditation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Name</label>
              <input
                type="text"
                value={settings.college_name || ''}
                onChange={(e) => setSettings({ ...settings, college_name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Affiliation / College Code</label>
              <input
                type="text"
                value={settings.college_code || ''}
                onChange={(e) => setSettings({ ...settings, college_code: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Accreditation Details</label>
            <input
              type="text"
              value={settings.accreditation || ''}
              onChange={(e) => setSettings({ ...settings, accreditation: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" /> Academic Rules & Attendance Policy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mandatory Attendance Minimum (%)</label>
              <input
                type="number"
                value={settings.min_attendance_percentage || '75'}
                onChange={(e) => setSettings({ ...settings, min_attendance_percentage: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Students falling below this threshold receive automated alerts.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Grading Scale</label>
              <select
                value={settings.grading_scale || 'standard_10_point'}
                onChange={(e) => setSettings({ ...settings, grading_scale: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="standard_10_point">10.0 Absolute / Relative Scale (O, A+, A, B+, B, C, F)</option>
                <option value="4_point">4.0 US Scale (A, B, C, D, F)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {saved ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Settings updated successfully
              </span>
            ) : (
              'Changes take effect globally across all portals'
            )}
          </span>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
