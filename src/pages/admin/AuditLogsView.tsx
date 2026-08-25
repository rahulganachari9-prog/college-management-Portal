import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.ts';
import { AuditLog } from '../../types.ts';
import { DataTable, Column } from '../../components/common/DataTable.tsx';
import { Badge } from '../../components/common/Badge.tsx';
import { ShieldCheck, User, Globe, Clock, Terminal } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs');
      if (res.success) setLogs(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns: Column<AuditLog>[] = [
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'User Account',
      accessor: 'userEmail',
      render: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-900">{row.userEmail || 'System Admin'}</p>
        </div>
      ),
    },
    {
      header: 'Action Taken',
      accessor: 'action',
      render: (row) => {
        const isDestructive = row.action.includes('DELETE');
        const isCreate = row.action.includes('CREATE') || row.action.includes('REGISTER');
        return (
          <Badge variant={isDestructive ? 'danger' : isCreate ? 'success' : 'primary'}>
            {row.action}
          </Badge>
        );
      },
    },
    {
      header: 'Entity & Target',
      render: (row) => (
        <div className="text-xs text-slate-700 font-mono">
          <span className="font-bold text-slate-900">{row.entity}</span>
          {row.entityId && <span className="text-slate-500"> #{row.entityId}</span>}
        </div>
      ),
    },
    {
      header: 'Details & Remarks',
      accessor: 'details',
      render: (row) => (
        <p className="text-xs text-slate-600 max-w-sm truncate">{row.details || '—'}</p>
      ),
    },
    {
      header: 'Client Origin',
      render: (row) => (
        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {row.ipAddress || '127.0.0.1'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Security & Regulatory Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">Immutable record of administrative mutations, grading edits, and user access</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
          >
            Refresh Log Stream
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={loading}
        title="Audit_Logs"
        searchPlaceholder="Filter logs by user, action, entity or IP..."
        searchField={(l) => `${l.userEmail} ${l.action} ${l.entity} ${l.details} ${l.ipAddress}`}
      />
    </div>
  );
};
