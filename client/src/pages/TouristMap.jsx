import { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';
import SafetyMap from '../components/SafetyMap.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants.js';

const TouristMap = () => {
  const { triggerSOS, cancelSOS, emitLocation, livePositions, sosAlerts } = useSocket();
  const { user } = useAuth();
  const [zones, setZones] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [services, setServices] = useState([]);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [myPos, setMyPos] = useState(null);
  const mySos = sosAlerts.find((a) => a.userId === String(user._id));
  const watchRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [z, i, s] = await Promise.all([
          api.get('/zones'),
          api.get('/incidents?limit=50'),
          api.get('/emergency-services?radius=50000&limit=30'),
        ]);
        setZones(z.data.zones);
        setIncidents(i.data.incidents);
        setServices(s.data.services);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      const watch = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setMyPos({ lat, lng });
          setCenter([lat, lng]);
          emitLocation(lat, lng);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
      watchRef.current = watch;
      return () => navigator.geolocation.clearWatch(watchRef.current);
    }
  }, [emitLocation]);

  const sos = () => {
    if (mySos) {
      cancelSOS();
    } else {
      triggerSOS(myPos?.lat, myPos?.lng);
    }
  };

  const myLive = myPos
    ? { userId: String(user._id), name: 'You', lat: myPos.lat, lng: myPos.lng, isOnline: true, sosActive: !!mySos }
    : null;

  const liveTourists = Object.values(livePositions).filter((p) => p.userId !== String(user._id));

  return (
    <div className="map-container">
      <div className="zone-legend">
        <strong>Legend</strong>
        <div style={{ display: 'grid', gap: '0.3rem', marginTop: '0.4rem' }}>
          <span><span className="status-dot red" /> Danger zone</span>
          <span><span className="status-dot yellow" /> Caution zone</span>
          <span><span className="status-dot green" /> Safe zone</span>
          <span><span style={{ background: '#ef4444' }} className="status-dot" /> SOS active</span>
          <span><span style={{ background: '#3b82f6' }} className="status-dot" /> Tourist</span>
          <span><span style={{ background: '#0ea5e9' }} className="status-dot" /> Service</span>
        </div>
      </div>

      <div className="sos-overlay">
        <button
          className={`btn btn-lg ${mySos ? 'btn-outline' : 'btn-danger btn-pulse'}`}
          onClick={sos}
        >
          {mySos ? '✅ SOS Sent — Cancel' : '🚨 SOS'}
        </button>
        {mySos && (
          <p className="text-sm" style={{ textAlign: 'center', color: '#fff', marginTop: '0.4rem', textShadow: '0 1px 2px #000' }}>
            Authorities notified
          </p>
        )}
      </div>

      <SafetyMap
        center={center}
        zoom={DEFAULT_ZOOM}
        zones={zones}
        incidents={incidents}
        services={services}
        tourists={myLive ? [myLive, ...liveTourists] : liveTourists}
      />
    </div>
  );
};

export default TouristMap;