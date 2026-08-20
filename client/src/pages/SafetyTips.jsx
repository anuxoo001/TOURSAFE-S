import { useState } from 'react';

const TIPS = [
  {
    category: 'Before You Go',
    icon: '🧳',
    color: 'blue',
    items: [
      'Register your travel plans with TOURSAFE and share your Tourist ID with family.',
      'Save local emergency numbers (police, ambulance, fire) in your phone.',
      'Download offline maps and note your hotel address in the local language.',
      'Share your itinerary and live location with a trusted contact.',
    ],
  },
  {
    category: 'Street Safety',
    icon: '🚶',
    color: 'yellow',
    items: [
      'Stay aware of your surroundings; avoid using your phone while walking in crowded areas.',
      'Keep valuables out of sight and split cash between pockets.',
      'Use well-lit, populated streets at night and avoid shortcuts.',
      'If you feel followed, cross the road, enter a busy shop, or press SOS.',
    ],
  },
  {
    category: 'Scam Awareness',
    icon: '🕵️',
    color: 'red',
    items: [
      'Agree taxi fares in advance or insist on the meter.',
      'Do not accept food, drinks, or "free" gifts from strangers.',
      'Never share your passport, cards, or OTPs with anyone.',
      'Beware of fake tourist police or "official" helpers demanding fees.',
    ],
  },
  {
    category: 'Medical & Health',
    icon: '🏥',
    color: 'green',
    items: [
      'Carry a small first-aid kit and any prescription medicines in original packaging.',
      'Drink bottled water and avoid street food if you have a sensitive stomach.',
      'Know the location of the nearest hospital and embassy.',
      'Keep your emergency contact details updated in your profile.',
    ],
  },
  {
    category: 'Using TOURSAFE SOS',
    icon: '🚨',
    color: 'red',
    items: [
      'Press SOS if you are in immediate danger — your location is shared with admins instantly.',
      'After SOS, stay where you are and keep your phone on.',
      'Cancel SOS only when you are safe, so admins can stand down.',
      'Submit a Help Request for non-emergency assistance (lost passport, guidance, etc.).',
    ],
  },
  {
    category: 'Zone Awareness',
    icon: '🗺️',
    color: 'yellow',
    items: [
      '🟢 GREEN zones are safe and well-patrolled — enjoy freely.',
      '🟡 YELLOW zones need caution — stay alert in crowded markets.',
      '🔴 RED zones are high-risk — avoid them, especially after dark.',
      'Check the Safety Map before planning your route for the day.',
    ],
  },
];

const SafetyTips = () => {
  const [open, setOpen] = useState(0);

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <h1 className="mb-1">💡 Tourist Safety Tips</h1>
      <p className="text-muted mb-3">Proven advice to keep your journey safe and enjoyable.</p>

      <div className="grid grid-2 mb-3">
        <div className="card alert-blue" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '2rem' }}>📞</span>
          <div>
            <strong>Emergency numbers</strong>
            <div className="text-sm">Police 100 · Fire 101 · Ambulance 102 · Tourist Helpline 1363</div>
          </div>
        </div>
        <div className="card alert-green" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '2rem' }}>🪪</span>
          <div>
            <strong>Carry your Tourist ID</strong>
            <div className="text-sm">Use the QR code on your ID for quick identity verification.</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {TIPS.map((tip, i) => (
          <div className="card" key={tip.category} style={{ padding: 0, overflow: 'hidden' }}>
            <button
              className="flex-between"
              style={{ width: '100%', padding: '1rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => setOpen(open === i ? -1 : i)}
            >
              <span className="flex gap-1" style={{ alignItems: 'center' }}>
                <span style={{ fontSize: '1.4rem' }}>{tip.icon}</span>
                <strong>{tip.category}</strong>
              </span>
              <span>{open === i ? '▾' : '▸'}</span>
            </button>
            {open === i && (
              <ul style={{ padding: '0 1.25rem 1.25rem 2.5rem', display: 'grid', gap: '0.4rem' }}>
                {tip.items.map((item) => (
                  <li key={item} className="text-sm">{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SafetyTips;