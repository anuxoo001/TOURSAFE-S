import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Tooltip, useMap } from 'react-leaflet';
import { ZONE_LEVEL_LABELS, INCIDENT_TYPE_LABELS, SERVICE_TYPE_LABELS } from '../constants.js';

const makeIcon = (color, label, pulse = false) =>
  L.divIcon({
    className: 'ts-marker',
    html: `<div class="ts-marker-inner ${pulse ? 'pulse' : ''}" style="background:${color}">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });

const ZONE_COLORS = { red: '#ef4444', yellow: '#f59e0b', green: '#22c55e' };
const SEVERITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e' };

const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length) {
      const bounds = L.latLngBounds(positions.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [positions, map]);
  return null;
};

const ZoneLayer = ({ zones }) =>
  (zones || []).map((z) => {
    const color = ZONE_COLORS[z.level] || '#94a3b8';
    const label = z.level.toUpperCase().charAt(0);
    if (z.geometry?.type === 'Polygon') {
      const positions = (z.geometry.coordinates[0] || []).map(([lng, lat]) => [lat, lng]);
      return (
        <Polygon key={z._id} positions={positions} pathOptions={{ color, fillColor: color, fillOpacity: 0.25, weight: 2 }}>
          <Tooltip>
            <strong>{z.name}</strong>
            <br />
            {ZONE_LEVEL_LABELS[z.level]} zone
          </Tooltip>
        </Polygon>
      );
    }
    const center = z.geometry?.coordinates || [0, 0];
    const [lng, lat] = center;
    const radius = z.radius || 500;
    return (
      <div key={z._id}>
        <Circle
          center={[lat, lng]}
          radius={radius}
          pathOptions={{ color, fillColor: color, fillOpacity: 0.2, weight: 2 }}
        >
          <Tooltip>
            <strong>{z.name}</strong>
            <br />
            {ZONE_LEVEL_LABELS[z.level]} zone
          </Tooltip>
        </Circle>
        <Marker position={[lat, lng]} icon={makeIcon(color, label)}>
          <Popup>
            <strong>{z.name}</strong>
            <br />
            <span className="badge badge-red" style={{ background: `${color}22`, color }}>{ZONE_LEVEL_LABELS[z.level]}</span>
          </Popup>
        </Marker>
      </div>
    );
  });

const IncidentLayer = ({ incidents, onClick }) =>
  (incidents || []).map((inc) => {
    const lng = inc.location?.coordinates?.[0];
    const lat = inc.location?.coordinates?.[1];
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    const color = SEVERITY_COLORS[inc.severity] || '#64748b';
    const severity = typeof inc.severity === 'string' ? inc.severity : 'medium';
    return (
      <Marker
        key={inc._id}
        position={[lat, lng]}
        icon={makeIcon(color, severity.toUpperCase().charAt(0))}
        eventHandlers={onClick ? { click: () => onClick(inc) } : undefined}
      >
        <Popup>
          <strong>{inc.title}</strong>
          <br />
          <span>{INCIDENT_TYPE_LABELS[inc.type] || inc.type}</span> · <span>{severity.toUpperCase()}</span>
          <br />
          <span className="text-muted text-sm">{inc.address}</span>
        </Popup>
      </Marker>
    );
  });

const ServiceLayer = ({ services }) =>
  (services || []).map((s) => {
    const lng = s.location?.coordinates?.[0];
    const lat = s.location?.coordinates?.[1];
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    return (
      <Marker key={s._id} position={[lat, lng]} icon={makeIcon('#0ea5e9', 'H')}>
        <Popup>
          <strong>{s.name}</strong>
          <br />
          <span>{SERVICE_TYPE_LABELS[s.type] || s.type}</span>
          {s.distance !== undefined && (
            <>
              <br />
              <span>{s.distance} m away</span>
            </>
          )}
          {s.phone && (
            <>
              <br />
              <a href={`tel:${s.phone}`}>{s.phone}</a>
            </>
          )}
        </Popup>
      </Marker>
    );
  });

const TouristLayer = ({ tourists }) =>
  (tourists || []).map((t) => {
    if (typeof t.lat !== 'number' || typeof t.lng !== 'number') return null;
    const color = t.sosActive ? '#ef4444' : t.isOnline ? '#3b82f6' : '#94a3b8';
    return (
      <Marker key={t.userId || t._id} position={[t.lat, t.lng]} icon={makeIcon(color, t.sosActive ? 'S' : 'T', t.sosActive)}>
        <Popup>
          <strong>{t.name}</strong>
          <br />
          {t.sosActive && <span className="badge badge-red">🚨 SOS ACTIVE</span>}
          {t.touristId && <div className="text-sm text-muted">{t.touristId}</div>}
          {t.distance !== undefined && <div className="text-sm text-muted">{t.distance} m away</div>}
        </Popup>
      </Marker>
    );
  });

const ClickCatcher = ({ onPick }) => {
  const map = useMap();
  useEffect(() => {
    if (!onPick) return;
    const handler = (e) => onPick([e.latlng.lat, e.latlng.lng]);
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [map, onPick]);
  return null;
};

const SafetyMap = ({
  center,
  zoom = 13,
  zones = [],
  incidents = [],
  tourists = [],
  services = [],
  picked = null,
  onPick = null,
  fitBoundsPositions = null,
  height = '100%',
}) => {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height, width: '100%' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoneLayer zones={zones} />
      <IncidentLayer incidents={incidents} />
      <ServiceLayer services={services} />
      <TouristLayer tourists={tourists} />
      <ClickCatcher onPick={onPick} />
      {picked && <Marker position={picked} icon={makeIcon('#1e3a8a', 'P')} />}
      {fitBoundsPositions && <FitBounds positions={fitBoundsPositions} />}
    </MapContainer>
  );
};

export default SafetyMap;