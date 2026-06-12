'use client';

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const tooltipStyle = {
  backgroundColor: '#1E293B',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  color: '#F8FAFC',
  fontSize: 12,
};
const axisStyle = { fontSize: 11, fill: '#64748B' };
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];

function Empty({ msg = 'No data yet.' }: { msg?: string }) {
  return <div className="flex h-40 items-center justify-center"><p className="text-sm text-slate-600">{msg}</p></div>;
}

export function EngagementBarChart({ data, dataKey, nameKey = 'name', color = '#3B82F6', label }: {
  data: Record<string, unknown>[];
  dataKey: string;
  nameKey?: string;
  color?: string;
  label?: string;
}) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={28}>
        <XAxis dataKey={nameKey} tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} name={label ?? dataKey} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EngagementPieChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return <Empty />;
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width="50%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-xs text-slate-400">{d.name}</span>
            </div>
            <span className="text-xs font-semibold text-slate-300">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EngagementLineChart({ data, dataKey, nameKey = 'month', label }: {
  data: Record<string, unknown>[];
  dataKey: string;
  nameKey?: string;
  label?: string;
}) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <XAxis dataKey={nameKey} tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#64748B' }} />
        <Line type="monotone" dataKey={dataKey} stroke="#3B82F6" strokeWidth={2} dot={false} name={label ?? dataKey} />
      </LineChart>
    </ResponsiveContainer>
  );
}
