import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { INCIDENT_TYPE_LABELS } from '../constants.js';

const toCSV = (headers, rows) => {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) lines.push(row.map(escape).join(','));
  return lines.join('\r\n');
};

const download = (filename, content) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const Reports = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/analytics');
        setAnalytics(data.analytics);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const exportIncidents = async () => {
    const { data } = await api.get('/incidents?limit=500');
    const rows = data.incidents.map((i) => [
      i._id,
      new Date(i.createdAt).toLocaleString(),
      i.reporter?.name || '',
      i.reporter?.touristId || '',
      INCIDENT_TYPE_LABELS[i.type] || i.type,
      i.severity,
      i.status,
      i.title,
      i.description,
      i.aiConfidence || '',
      i.zoneLevelAtIncident || '',
      i.location?.coordinates?.[1] || '',
      i.location?.coordinates?.[0] || '',
    ]);
    download(
      `incidents-${new Date().toISOString().slice(0, 10)}.csv`,
      toCSV(['ID', 'Reported', 'Reporter', 'Tourist ID', 'Type', 'Severity', 'Status', 'Title', 'Description', 'AI Confidence', 'Zone Level', 'Lat', 'Lng'], rows)
    );
  };

  const exportRequests = async () => {
    const { data } = await api.get('/requests?limit=500');
    const rows = data.requests.map((r) => [
      r._id,
      new Date(r.createdAt).toLocaleString(),
      r.user?.name || '',
      r.user?.touristId || '',
      r.type,
      r.priority,
      r.status,
      r.subject,
      r.description,
      r.adminNote || '',
    ]);
    download(
      `requests-${new Date().toISOString().slice(0, 10)}.csv`,
      toCSV(['ID', 'Submitted', 'User', 'Tourist ID', 'Type', 'Priority', 'Status', 'Subject', 'Description', 'Admin Note'], rows)
    );
  };

  const exportSOSLogs = async () => {
    const { data } = await api.get('/sos/logs?limit=500');
    const rows = data.logs.map((l) => [
      l.sosId,
      new Date(l.createdAt).toLocaleString(),
      l.tourist?.name || '',
      l.tourist?.touristId || '',
      l.tourist?.phone || '',
      l.status,
      l.acknowledgedBy?.name || '',
      l.resolvedBy?.name || '',
      l.notes || '',
      l.lat,
      l.lng,
    ]);
    download(
      `sos-logs-${new Date().toISOString().slice(0, 10)}.csv`,
      toCSV(['SOS ID', 'Triggered', 'Tourist', 'Tourist ID', 'Phone', 'Status', 'Acknowledged By', 'Resolved By', 'Notes', 'Lat', 'Lng'], rows)
    );
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  const t = analytics?.totals || {};

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <h1 className="mb-1">📄 Reports & Exports</h1>
      <p className="text-muted mb-3">Download operational data as CSV for analysis and record-keeping.</p>

      <div className="grid grid-4 mb-3">
        <div className="card stat"><div className="value">{t.incidents}</div><div className="label">Incidents</div></div>
        <div className="card stat"><div className="value">{t.tourists}</div><div className="label">Tourists</div></div>
        <div className="card stat"><div className="value">{t.activeSOS}</div><div className="label">SOS Active</div></div>
        <div className="card stat"><div className="value">{t.avgResolutionHours ?? 0}h</div><div className="label">Avg Resolution</div></div>
      </div>

      <div className="grid grid-3">
        <div className="card">
          <h3 className="mb-1">🚨 Incidents</h3>
          <p className="text-sm text-muted mb-2">All incident reports with severity, status and AI classification.</p>
          <button className="btn btn-block" onClick={exportIncidents}>⬇️ Export Incidents (CSV)</button>
        </div>
        <div className="card">
          <h3 className="mb-1">🎫 Help Requests</h3>
          <p className="text-sm text-muted mb-2">All user help requests and admin responses.</p>
          <button className="btn btn-block" onClick={exportRequests}>⬇️ Export Requests (CSV)</button>
        </div>
        <div className="card">
          <h3 className="mb-1">🚨 SOS Logs</h3>
          <p className="text-sm text-muted mb-2">Complete SOS history with acknowledgment and resolution records.</p>
          <button className="btn btn-block" onClick={exportSOSLogs}>⬇️ Export SOS Logs (CSV)</button>
        </div>
      </div>
    </div>
  );
};

export default Reports;