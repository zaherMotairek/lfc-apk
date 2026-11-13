import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';

type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  actor: { id: string; email: string; firstName: string; lastName: string } | null;
  metadata: unknown;
};

export function AdminAuditLogPage() {
  const { accessToken } = useAuth();
  const [actionFilter, setActionFilter] = useState('');

  const logsQuery = useQuery({
    queryKey: ['admin-audit-logs', actionFilter],
    queryFn: () => {
      const q = actionFilter.trim() ? `&action=${encodeURIComponent(actionFilter.trim())}` : '';
      return apiRequest<AuditRow[]>(`/admin/audit-logs?limit=150${q}`, { token: accessToken });
    },
    enabled: Boolean(accessToken),
  });

  const rows = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Audit log"
        description="Who changed what — filter by action name (e.g. UPDATE_SITE_SETTINGS)."
      />

      <input
        className="kop-input max-w-md"
        placeholder="Filter by action…"
        value={actionFilter}
        onChange={(e) => setActionFilter(e.target.value)}
      />

      {logsQuery.isLoading ? <p className="text-black/50">Loading…</p> : null}
      {logsQuery.error ? <p className="text-lfc-red">Unable to load audit log.</p> : null}

      <div className="kop-card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-black/40">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-black/[0.04]">
                <td className="px-4 py-3 whitespace-nowrap text-xs text-black/55">
                  {new Date(row.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs">
                  {row.actor
                    ? `${row.actor.firstName} ${row.actor.lastName}`.trim() || row.actor.email
                    : 'System'}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{row.action}</td>
                <td className="px-4 py-3 text-xs text-black/55">
                  {row.entityType}
                  {row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
