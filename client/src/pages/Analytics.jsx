import { useEffect, useState } from 'react';
import api from '../api/client.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid, LineChart, Line,
} from 'recharts';
import { INCIDENT_TYPE_LABELS } from '../constants.js';

const SEV_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
const ZONE_COLORS = { green: '#22c55e', yellow: '#f59e0b', red: '#ef4444' };

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/analytics');
        setData(data.analytics);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  const t = data.totals || {};
  const typeDist = (data.typeDist || []).map((d) => ({ name: INCIDENT_TYPE_LABELS[d._id] || d._id, value: d.count }));
  const severityDist = (data.severityDist || []).map((d) => ({ name: d._id, value: d.count }));
  const trend = data.trend || [];
  const zoneStats = [
    { name: 'Safe', value: data.zoneStats?.green || 0 },
    { name: 'Caution', value: data.zoneStats?.yellow || 0 },
    { name: 'Danger', value: data.zoneStats?.red || 0 },
  ];

  const stats = [
    { label: 'Total Incidents', value: t.incidents },
    { label: 'Open', value: t.open },
    { label: 'Critical', value: t.critical },
    { label: 'Tourists', value: t.tourists },
    { label: 'Online', value: t.online },
    { label: 'Active SOS', value: t.activeSOS },
    { label: 'Services', value: t.services },
    { label: 'Avg Resolution', value: `${t.avgResolutionHours ?? 0}h` },
  ];

  return (
    <div className="container">
      <h1 className="mb-1">📊 Safety Analytics</h1>
      <p className="text-muted mb-3">Incident trends and safety zone distribution.</p>

      <div className="grid grid-4 mb-3">
        {stats.map((s) => (
          <div className="card stat" key={s.label}>
            <div className="value">{s.value}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2 mb-3">
        <div className="card">
          <h3 className="mb-2">📈 Incidents — Last 14 Days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1e3a8a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-2">🟢🟡🔴 Safety Zones</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={zoneStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {zoneStats.map((z) => (
                  <Cell key={z.name} fill={ZONE_COLORS[z.name.toLowerCase()] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-2 mb-3">
        <div className="card">
          <h3 className="mb-2">📂 Incidents by Type</h3>
          {typeDist.length === 0 ? (
            <p className="text-muted text-sm">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={typeDist} layout="vertical">
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="name" width={130} fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="mb-2">🔥 Incidents by Severity</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={severityDist} dataKey="value" nameKey="name" outerRadius={90} label>
                {severityDist.map((d) => (
                  <Cell key={d.name} fill={SEV_COLORS[d.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;