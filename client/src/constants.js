export const ROLES = {
  TOURIST: 'tourist',
  AUTHORITY: 'authority',
  ADMIN: 'admin',
};

export const ZONE_LEVELS = {
  RED: 'red',
  YELLOW: 'yellow',
  GREEN: 'green',
};

export const ZONE_TYPES = {
  CAUTION: 'caution',
  DANGER: 'danger',
  SAFE: 'safe',
};

export const INCIDENT_TYPES = {
  THEFT: 'theft',
  ASSAULT: 'assault',
  HARRASSMENT: 'harassment',
  SCAM: 'scam',
  MEDICAL: 'medical',
  FIRE: 'fire',
  TRAFFIC: 'traffic',
  NATURAL_DISASTER: 'natural_disaster',
  LOST_PERSON: 'lost_person',
  OTHER: 'other',
};

export const INCIDENT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const INCIDENT_STATUS = {
  REPORTED: 'reported',
  REVIEWING: 'reviewing',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
};

export const SERVICE_TYPES = {
  HOSPITAL: 'hospital',
  CLINIC: 'clinic',
  PHARMACY: 'pharmacy',
  POLICE: 'police',
  FIRE: 'fire',
  EMBASSY: 'embassy',
  HELPLINE: 'helpline',
  OTHER: 'other',
};

export const INCIDENT_TYPE_LABELS = {
  [INCIDENT_TYPES.THEFT]: 'Theft',
  [INCIDENT_TYPES.ASSAULT]: 'Assault',
  [INCIDENT_TYPES.HARRASSMENT]: 'Harassment',
  [INCIDENT_TYPES.SCAM]: 'Scam / Fraud',
  [INCIDENT_TYPES.MEDICAL]: 'Medical Emergency',
  [INCIDENT_TYPES.FIRE]: 'Fire',
  [INCIDENT_TYPES.TRAFFIC]: 'Traffic',
  [INCIDENT_TYPES.NATURAL_DISASTER]: 'Natural Disaster',
  [INCIDENT_TYPES.LOST_PERSON]: 'Lost Person',
  [INCIDENT_TYPES.OTHER]: 'Other',
};

export const INCIDENT_SEVERITY_LABELS = {
  [INCIDENT_SEVERITY.LOW]: 'Low',
  [INCIDENT_SEVERITY.MEDIUM]: 'Medium',
  [INCIDENT_SEVERITY.HIGH]: 'High',
  [INCIDENT_SEVERITY.CRITICAL]: 'Critical',
};

export const INCIDENT_STATUS_LABELS = {
  [INCIDENT_STATUS.REPORTED]: 'Reported',
  [INCIDENT_STATUS.REVIEWING]: 'Reviewing',
  [INCIDENT_STATUS.RESOLVED]: 'Resolved',
  [INCIDENT_STATUS.DISMISSED]: 'Dismissed',
};

export const ZONE_LEVEL_LABELS = {
  [ZONE_LEVELS.RED]: 'Danger',
  [ZONE_LEVELS.YELLOW]: 'Caution',
  [ZONE_LEVELS.GREEN]: 'Safe',
};

export const ZONE_TYPE_LABELS = {
  [ZONE_TYPES.DANGER]: 'Danger',
  [ZONE_TYPES.CAUTION]: 'Caution',
  [ZONE_TYPES.SAFE]: 'Safe',
};

export const SERVICE_TYPE_LABELS = {
  [SERVICE_TYPES.HOSPITAL]: 'Hospital',
  [SERVICE_TYPES.CLINIC]: 'Clinic',
  [SERVICE_TYPES.PHARMACY]: 'Pharmacy',
  [SERVICE_TYPES.POLICE]: 'Police',
  [SERVICE_TYPES.FIRE]: 'Fire & Rescue',
  [SERVICE_TYPES.EMBASSY]: 'Embassy',
  [SERVICE_TYPES.HELPLINE]: 'Helpline',
  [SERVICE_TYPES.OTHER]: 'Other',
};

export const REQUEST_TYPES = {
  EMERGENCY: 'emergency',
  MEDICAL: 'medical',
  POLICE: 'police',
  FIRE: 'fire',
  LOST: 'lost',
  THEFT: 'theft',
  ASSISTANCE: 'assistance',
  CONTACT_ADMIN: 'contact_admin',
  FEEDBACK: 'feedback',
  OTHER: 'other',
};

export const REQUEST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const REQUEST_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const REQUEST_TYPE_LABELS = {
  [REQUEST_TYPES.EMERGENCY]: 'Emergency',
  [REQUEST_TYPES.MEDICAL]: 'Medical',
  [REQUEST_TYPES.POLICE]: 'Police',
  [REQUEST_TYPES.FIRE]: 'Fire',
  [REQUEST_TYPES.LOST]: 'Lost Item/Person',
  [REQUEST_TYPES.THEFT]: 'Theft',
  [REQUEST_TYPES.ASSISTANCE]: 'Assistance',
  [REQUEST_TYPES.CONTACT_ADMIN]: 'Contact Admin',
  [REQUEST_TYPES.FEEDBACK]: 'Feedback',
  [REQUEST_TYPES.OTHER]: 'Other',
};

export const REQUEST_STATUS_LABELS = {
  [REQUEST_STATUS.PENDING]: 'Pending',
  [REQUEST_STATUS.IN_PROGRESS]: 'In Progress',
  [REQUEST_STATUS.RESOLVED]: 'Resolved',
  [REQUEST_STATUS.CLOSED]: 'Closed',
};

export const REQUEST_PRIORITY_LABELS = {
  [REQUEST_PRIORITY.LOW]: 'Low',
  [REQUEST_PRIORITY.MEDIUM]: 'Medium',
  [REQUEST_PRIORITY.HIGH]: 'High',
  [REQUEST_PRIORITY.CRITICAL]: 'Critical',
};

export const REQUEST_STATUS_CLASS = {
  [REQUEST_STATUS.PENDING]: 'yellow',
  [REQUEST_STATUS.IN_PROGRESS]: 'blue',
  [REQUEST_STATUS.RESOLVED]: 'green',
  [REQUEST_STATUS.CLOSED]: 'gray',
};

export const REQUEST_TYPE_ICONS = {
  [REQUEST_TYPES.EMERGENCY]: '🚨',
  [REQUEST_TYPES.MEDICAL]: '🏥',
  [REQUEST_TYPES.POLICE]: '👮',
  [REQUEST_TYPES.FIRE]: '🔥',
  [REQUEST_TYPES.LOST]: '🧳',
  [REQUEST_TYPES.THEFT]: '🪪',
  [REQUEST_TYPES.ASSISTANCE]: '🤝',
  [REQUEST_TYPES.CONTACT_ADMIN]: '📨',
  [REQUEST_TYPES.FEEDBACK]: '💬',
  [REQUEST_TYPES.OTHER]: '📌',
};

export const BROADCAST_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  DANGER: 'danger',
};

export const BROADCAST_LEVEL_LABELS = {
  [BROADCAST_LEVELS.INFO]: 'Info',
  [BROADCAST_LEVELS.WARNING]: 'Warning',
  [BROADCAST_LEVELS.DANGER]: 'Danger',
};

export const SOS_STATUS_LABELS = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
};

export const ROLE_LABELS = {
  [ROLES.TOURIST]: 'Tourist',
  [ROLES.AUTHORITY]: 'Authority',
  [ROLES.ADMIN]: 'Admin',
};

export const LEVEL_CLASS = {
  [ZONE_LEVELS.RED]: 'red',
  [ZONE_LEVELS.YELLOW]: 'yellow',
  [ZONE_LEVELS.GREEN]: 'green',
};

export const SEVERITY_CLASS = {
  [INCIDENT_SEVERITY.LOW]: 'green',
  [INCIDENT_SEVERITY.MEDIUM]: 'yellow',
  [INCIDENT_SEVERITY.HIGH]: 'red',
  [INCIDENT_SEVERITY.CRITICAL]: 'red',
};

export const STATUS_CLASS = {
  [INCIDENT_STATUS.REPORTED]: 'yellow',
  [INCIDENT_STATUS.REVIEWING]: 'blue',
  [INCIDENT_STATUS.RESOLVED]: 'green',
  [INCIDENT_STATUS.DISMISSED]: 'gray',
};

export const TYPE_CLASS = {
  [INCIDENT_TYPES.THEFT]: 'yellow',
  [INCIDENT_TYPES.ASSAULT]: 'red',
  [INCIDENT_TYPES.HARRASSMENT]: 'yellow',
  [INCIDENT_TYPES.SCAM]: 'yellow',
  [INCIDENT_TYPES.MEDICAL]: 'blue',
  [INCIDENT_TYPES.FIRE]: 'red',
  [INCIDENT_TYPES.TRAFFIC]: 'blue',
  [INCIDENT_TYPES.NATURAL_DISASTER]: 'red',
  [INCIDENT_TYPES.LOST_PERSON]: 'blue',
  [INCIDENT_TYPES.OTHER]: 'gray',
};

export const DEFAULT_CENTER = [28.6139, 77.209];
export const DEFAULT_ZOOM = 13;

export const HOTEL_TYPES = {
  HOTEL: 'hotel',
  HOSTEL: 'hostel',
  GUESTHOUSE: 'guesthouse',
  RESORT: 'resort',
  APARTMENT: 'apartment',
};

export const HOTEL_TYPE_LABELS = {
  [HOTEL_TYPES.HOTEL]: 'Hotel',
  [HOTEL_TYPES.HOSTEL]: 'Hostel',
  [HOTEL_TYPES.GUESTHOUSE]: 'Guesthouse',
  [HOTEL_TYPES.RESORT]: 'Resort',
  [HOTEL_TYPES.APARTMENT]: 'Apartment',
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: 'Pending',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
};

export const BOOKING_STATUS_CLASS = {
  [BOOKING_STATUS.PENDING]: 'yellow',
  [BOOKING_STATUS.CONFIRMED]: 'green',
  [BOOKING_STATUS.CANCELLED]: 'red',
  [BOOKING_STATUS.COMPLETED]: 'blue',
};