import { INCIDENT_TYPES, INCIDENT_SEVERITY } from '../models/Incident.js';

const KEYWORDS = {
  [INCIDENT_TYPES.THEFT]: [
    'theft', 'stolen', 'steal', 'stole', 'pickpocket', 'robbery', 'robber', 'mugged', 'purse', 'wallet', 'thief', 'snatched',
  ],
  [INCIDENT_TYPES.ASSAULT]: [
    'assault', 'attack', 'attacked', 'beaten', 'hit', 'punched', 'violence', 'violent', 'stabbed', 'weapon', 'knife', 'gun',
  ],
  [INCIDENT_TYPES.HARRASSMENT]: [
    'harass', 'harassed', 'harassment', 'unwanted', 'creepy', 'followed', 'stalking', 'stalked', 'catcalling', 'molest',
  ],
  [INCIDENT_TYPES.SCAM]: [
    'scam', 'fraud', 'fake', 'counterfeit', 'overcharged', 'cheated', 'tourist trap', 'phishing', 'money', 'charged',
  ],
  [INCIDENT_TYPES.MEDICAL]: [
    'medical', 'emergency', 'hospital', 'sick', 'ill', 'injury', 'injured', 'hurt', 'fever', 'heart', 'breathing', 'allergic', 'unconscious', 'accident',
  ],
  [INCIDENT_TYPES.FIRE]: [
    'fire', 'burning', 'smoke', 'flames', 'burn', 'blaze',
  ],
  [INCIDENT_TYPES.TRAFFIC]: [
    'traffic', 'car crash', 'collision', 'hit by car', 'vehicle', 'road', 'accident', 'bus',
  ],
  [INCIDENT_TYPES.NATURAL_DISASTER]: [
    'earthquake', 'flood', 'flooding', 'storm', 'tsunami', 'landslide', 'volcano', 'wildfire', 'hurricane', 'tornado',
  ],
  [INCIDENT_TYPES.LOST_PERSON]: [
    'lost', 'missing', 'disappeared', 'can\'t find', 'cannot find', 'wander', 'gone', 'vanished',
  ],
};

const SEVERITY_KEYWORDS = {
  [INCIDENT_SEVERITY.CRITICAL]: [
    'gun', 'weapon', 'unconscious', 'bleeding', 'bleeding heavily', 'not breathing', 'knife', 'stabbed', 'fire', 'life threatening', 'critical', 'terrorist', 'hostage',
  ],
  [INCIDENT_SEVERITY.HIGH]: [
    'assault', 'attack', 'robbery', 'theft', 'mugged', 'broken', 'fracture', 'severe', 'serious', 'violence', 'violent', 'medical', 'emergency',
  ],
  [INCIDENT_SEVERITY.MEDIUM]: [
    'scam', 'harass', 'stolen', 'pickpocket', 'traffic', 'accident', 'injury', 'hurt',
  ],
  [INCIDENT_SEVERITY.LOW]: [
    'overcharged', 'crowded', 'discomfort', 'minor', 'small', 'lost', 'confused',
  ],
};

const normalize = (text = '') => text.toLowerCase().trim();

const countMatches = (text, words) => words.filter((w) => text.includes(w)).length;

// Deterministic pseudo-confidence based on text length and match strength.
export const classifyIncident = (title, description = '') => {
  const text = normalize(`${title} ${description}`);
  let bestType = INCIDENT_TYPES.OTHER;
  let bestScore = 0;

  for (const [type, words] of Object.entries(KEYWORDS)) {
    const score = countMatches(text, words);
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  let severity = INCIDENT_SEVERITY.MEDIUM;
  let severityScore = 0;
  for (const [sev, words] of Object.entries(SEVERITY_KEYWORDS)) {
    const score = countMatches(text, words);
    if (score > severityScore) {
      severityScore = score;
      severity = sev;
    }
  }

  const confidence = Math.min(0.99, 0.3 + (bestScore * 0.25) + (severityScore * 0.1) + Math.min(0.2, text.length / 600));

  return {
    type: bestType,
    severity,
    confidence: Number(confidence.toFixed(3)),
    keywordsFound: bestScore + severityScore,
  };
};

export default { classifyIncident };
