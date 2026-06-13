'use client';

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useEffect, useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  PENDING_FACULTY_APPROVAL: '#F59E0B',
  PENDING_ADMIN_APPROVAL:   '#3B9EFF',
  ACCEPTED:                 '#4DC96A',
  REJECTED:                 '#EF4444',
  COMPLETED:                '#94A3B8',
};
const STATUS_LABELS: Record<string, string> = {
  PENDING_FACULTY_APPROVAL: 'Faculty Review',
  PENDING_ADMIN_APPROVAL:   'Admin Review',
  ACCEPTED: 'Accepted', REJECTED: 'Rejected', COMPLETED: 'Completed',
};

interface Props {
  categoryData: { name: string; value: number; color: string }[];
  fundingChartData: { name: string; amount: number }[];
  statusData: { name: string; value: number }[];
}

export function AnalyticsCharts({ categoryData, fundingChartData, statusData }: Props) {
  const [accent, setAccent] = useState('#6366F1');

  useEffect(() => {
    const role = document.documentElement.getAttribute('data-role');
    if (role === 'STUDENT') setAccent('#3B9EFF');
    else if (role === 'FACULTY') setAccent('#4DC96A');
    else setAccent('#6366F1');
  }, []);

  const BAR_COLORS = [accent, '#3B9EFF', '#4DC96A', '#F59E0B', '#EC4899', '#06B6D4'];

  const tooltipStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E9ECF5',
    borderRadius: '12px',
    color: '#1E293B',
    fontSize: 12,
    boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
  };
  const axisStyle = { fontSize: 11, fill: '#94A3B8' };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Category Pie */}
      <div className="saas-card p-6">
        <p className="section-title">Proposals by Category</p>
        <p className="section-subtitle mb-5">Distribution across event types</p>
        {categoryData.length === 0 ? <EmptyChart /> : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={44} outerRadius={76} paddingAngle={3}>
                  {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 min-w-0">
              {categoryData.map((c) => (
                <div key={c.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-xs text-[#64748B] truncate">{c.name}</span>
                  </div>
                  <span className="text-xs font-bold text-[#0F172A] flex-shrink-0">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Funding Bar */}
      <div className="saas-card p-6">
        <p className="section-title">Funding by Category</p>
        <p className="section-subtitle mb-5">Total contributions per category</p>
        {fundingChartData.length === 0 ? <EmptyChart message="No funding contributions yet." /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fundingChartData} barSize={22}>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--role-soft, #F8F9FC)' }}
                formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Funding']} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {fundingChartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Status Breakdown */}
      <div className="saas-card p-6 lg:col-span-2">
        <p className="section-title">Proposals by Status</p>
        <p className="section-subtitle mb-5">Pipeline breakdown across all stages</p>
        {statusData.length === 0 ? <EmptyChart /> : (
          <div className="flex flex-wrap items-center gap-8">
            <ResponsiveContainer width={200} height={180}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {statusData.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.name] ?? '#94A3B8'} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[s.name] ?? '#94A3B8' }} />
                  <div>
                    <p className="text-xs text-[#94A3B8] leading-none">{STATUS_LABELS[s.name] ?? s.name.replace(/_/g, ' ')}</p>
                    <p className="text-xl font-bold text-[#0F172A] leading-tight">{s.value}</p>
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
    <div className="flex h-36 items-center justify-center">
      <p className="text-sm text-[#94A3B8]">{message}</p>
    </div>
  );
}
