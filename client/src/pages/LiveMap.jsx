import { useEffect, useState } from 'react';
import api from '../api/client.js';
import SafetyMap from '../components/SafetyMap.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { DEFAULT_CENTER, DEFAULT_ZOOM, ZONE_LEVEL_LABELS } from '../constants.js';

const LiveMap = () => {
  const { livePositions, sosAlerts, pushToast } = useSocket();
  const [zones, setZones] = useState([]);
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [restPositions, setRestPositions] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [z, s, i, loc] = await Promise.all([
          api.get('/zones'),
          api.get('/emergency-services?radius=50000&limit=30'),
          api.get('/incidents?limit=50'),
          api.get('/location/live'),
        ]);
        setZones(z.data.zones);
        setServices(s.data.services);
        setIncidents(i.data.incidents);
        setRestPositions(loc.data.positions);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const merged = [];
  const seen = new Set();
  for (const p of Object.values(livePositions)) {
    merged.push({ userId: p.userId, name: p.name || 'Tourist', lat: p.lat, lng: p.lng, isOnline: true, sosActive: !!sosAlerts.find((a) => a.userId === p.userId) });
    seen.add(p.userId);
  }
  for (const p of restPositions) {
    if (seen.has(p.userId)) continue;
    merged.push({ ...p, sosActive: p.sosActive });
  }

  const sosTourists = sosAlerts.map((a) => ({
    userId: a.userId,
    name: a.name,
    lat: a.lat,
    lng: a.lng,
    isOnline: true,
    sosActive: true,
  }));

  const allPositions = [...merged, ...sosTourists.filter((s) => !seen.has(s.userId))];

  return (
    <div className="map-container">
      <div className="zone-legend" style={{ width: 220 }}>
        <strong>Live Tourist Tracking</strong>
        <div style={{ display: 'grid', gap: '0.3rem', marginTop: '0.4rem' }}>
          <span><span style={{ background: '#3b82f6' }} className="status-dot" /> Online tourist</span>
          <span><span style={{ background: '#ef4444' }} className="status-dot" /> SOS active</span>
          <span><span style={{ background: '#22c55e' }} className="status-dot" /> Safe zone</span>
          <span><span style={{ background: '#f59e0b' }} className="status-dot" /> Caution zone</span>
          <span><span style={{ background: '#ef4444' }} className="status-dot" /> Danger zone</span>
        </div>
        <div className="mt-2">
          <strong className="text-sm">Zones:</strong>
          {zones.slice(0, 4).map((z) => (
            <div key={z._id} className="text-sm">
              <span className={`status-dot ${z.level}`} /> {z.name} ({ZONE_LEVEL_LABELS[z.level]})
            </div>
          ))}
        </div>
      </div>

      <SafetyMap
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zones={zones}
        incidents={incidents}
        services={services}
        tourists={allPositions}
      />
    </div>
  );
};

export default LiveMap;