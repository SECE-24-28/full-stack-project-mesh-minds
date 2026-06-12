'use client';

import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const tooltipStyle = {
  backgroundColor: '#1E293B',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  color: '#F8FAFC',
  fontSize: 12,
};

const axisStyle = { fontSize: 11, fill: '#64748B' };

const STATUS_COLORS: Record<string, string> = {
  PENDING_FACULTY_APPROVAL: '#F59E0B',
  PENDING_ADMIN_APPROVAL: '#3B82F6',
  ACCEPTED: '#10B981',
  REJECTED: '#EF4444',
  COMPLETED: '#94A3B8',
};

interface Props {
  categoryData: { name: string; value: number; color: string }[];
  fundingChartData: { name: string; amount: number }[];
  statusData: { name: string; value: number }[];
}

export function AnalyticsCharts({ categoryData, fundingChartData, statusData }: Props) {
  const hasFunding = fundingChartData.length > 0;
  const hasCategories = categoryData.length > 0;
  const hasStatus = statusData.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Category distribution */}
      <div className="role-card rounded-2xl p-6">
        <p className="font-semibold text-white">Proposals by Category</p>
        <p className="mb-5 text-xs text-slate-500">How proposals are spread across event types</p>
        {!hasCategories ? (
          <EmptyChart />
        ) : (
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="55%" height={180}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryData.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="text-xs text-slate-400">{c.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-300">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Funding by category */}
      <div className="role-card rounded-2xl p-6">
        <p className="font-semibold text-white">Funding by Category</p>
        <p className="mb-5 text-xs text-slate-500">Total contributions grouped by event category</p>
        {!hasFunding ? (
          <EmptyChart message="No funding contributions yet." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fundingChartData} barSize={28}>
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Funding']}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {fundingChartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4'][i % 6]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Status breakdown */}
      <div className="role-card rounded-2xl p-6 lg:col-span-2">
        <p className="font-semibold text-white">Proposals by Status</p>
        <p className="mb-5 text-xs text-slate-500">Current pipeline breakdown across all proposal stages</p>
        {!hasStatus ? (
          <EmptyChart />
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            <ResponsiveContainer width={220} height={180}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={3}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] ?? '#64748B'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ background: STATUS_COLORS[s.name] ?? '#64748B' }}
                  />
                  <div>
                    <p className="text-xs text-slate-400">{s.name.replace('_', ' ')}</p>
                    <p className="text-sm font-semibold text-slate-200">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChart({ message = 'No data yet.' }: { message?: string }) {
  return (
    <div className="flex h-40 items-center justify-center">
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}
