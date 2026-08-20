import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User, { ROLES } from './models/User.js';
import SafetyZone from './models/SafetyZone.js';
import Incident, { INCIDENT_TYPES, INCIDENT_SEVERITY, INCIDENT_STATUS } from './models/Incident.js';
import EmergencyService from './models/EmergencyService.js';
import HelpRequest from './models/HelpRequest.js';
import Broadcast from './models/Broadcast.js';
import SOSLog from './models/SOSLog.js';
import Hotel from './models/Hotel.js';
import HotelBooking, { BOOKING_STATUS } from './models/HotelBooking.js';
import { createTouristId } from './services/qrService.js';
import { classifyIncident } from './services/aiClassifier.js';

dotenv.config();

// Demo city centered near a downtown area
const CENTER = [28.6139, 77.209]; // lng, lat ordering for GeoJSON

const run = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    SafetyZone.deleteMany({}),
    Incident.deleteMany({}),
    EmergencyService.deleteMany({}),
    HelpRequest.deleteMany({}),
    Broadcast.deleteMany({}),
    SOSLog.deleteMany({}),
    Hotel.deleteMany({}),
    HotelBooking.deleteMany({}),
  ]);
  try {
    await SafetyZone.collection.dropIndexes();
  } catch (e) {
    // no indexes to drop
  }
  console.log('Cleared existing data');

  // --- Users ---
  const authority = await User.create({
    name: 'Rahul Sharma',
    email: 'authority@toursafe.com',
    password: 'password123',
    role: ROLES.AUTHORITY,
    phone: '+91-1122334455',
  });
  console.log('Authority created:', authority.email, '/ password123');

  const admin = await User.create({
    name: 'TOURSAFE Admin',
    email: 'admin@toursafe.com',
    password: 'password123',
    role: ROLES.ADMIN,
  });
  console.log('Admin created:', admin.email, '/ password123');

  const tourists = [];
  const demo = [
    { name: 'Emma Wilson', email: 'emma@example.com', country: 'UK', phone: '+44-7700123456', passport: 'UK-99881122', lat: 28.6139, lng: 77.209 },
    { name: 'Luca Rossi', email: 'luca@example.com', country: 'Italy', phone: '+39-3331234567', passport: 'IT-55667788', lat: 28.6304, lng: 77.2177 },
    { name: 'Aisha Khan', email: 'aisha@example.com', country: 'UAE', phone: '+971-501234567', passport: 'AE-11223344', lat: 28.595, lng: 77.1655 },
  ];
  for (const d of demo) {
    const u = await User.create({
      name: d.name,
      email: d.email,
      password: 'password123',
      role: ROLES.TOURIST,
      country: d.country,
      phone: d.phone,
      passport: d.passport,
      lastLocation: { type: 'Point', coordinates: [d.lng, d.lat] },
      lastLocationAt: new Date(),
      isOnline: true,
      emergencyContact: { name: 'Emergency Contact', phone: '+000-0000000' },
    });
    await createTouristId(u);
    tourists.push(u);
    console.log('Tourist created:', u.email, `/ password123 (${u.touristId})`);
  }

  // --- Safety Zones ---
  const greenZone = await SafetyZone.create({
    name: 'Central Market Safe District',
    description: 'Well-lit, policed shopping area. Safe for tourists.',
    level: 'green',
    zoneType: 'safe',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [77.203, 28.606],
          [77.216, 28.606],
          [77.216, 28.622],
          [77.203, 28.622],
          [77.203, 28.606],
        ],
      ],
    },
    createdBy: authority._id,
  });

  const yellowZone = await SafetyZone.create({
    name: 'Old City Bazaar',
    description: 'Crowded historic market. Watch for pickpockets and scams.',
    level: 'yellow',
    zoneType: 'caution',
    radius: 1200,
    geometry: { type: 'Point', coordinates: [77.2353, 28.6558] },
    createdBy: authority._id,
  });

  const redZone = await SafetyZone.create({
    name: 'High-Risk Industrial Corridor',
    description: 'Known hotspot for petty crime at night. Avoid after dark.',
    level: 'red',
    zoneType: 'danger',
    radius: 800,
    geometry: { type: 'Point', coordinates: [77.1409, 28.5702] },
    createdBy: authority._id,
  });

  console.log(`Zones created: ${greenZone.name} (green), ${yellowZone.name} (yellow), ${redZone.name} (red)`);

  // --- Hotels (with zone verification demo) ---
  const hotelData = [
    {
      name: 'Grand Heritage Hotel',
      type: 'hotel',
      address: 'Central Market, Main Bazaar Road',
      description: 'Premium stay in the heart of the safe shopping district. 24/7 security and free breakfast.',
      phone: '+91-1155667788',
      pricePerNight: 4500,
      rating: 4.6,
      rooms: 12,
      amenities: ['Free WiFi', 'AC', 'Restaurant', 'Gym'],
      coordinates: [77.209, 28.6139], // inside GREEN zone polygon
    },
    {
      name: 'Sunrise Guesthouse',
      type: 'guesthouse',
      address: 'Market Lane 2',
      description: 'Cozy budget guesthouse steps away from markets and cafes. Friendly staff.',
      phone: '+91-1199887766',
      pricePerNight: 1200,
      rating: 4.1,
      rooms: 8,
      amenities: ['Free WiFi', 'Hot Water'],
      coordinates: [77.205, 28.610], // inside GREEN zone
    },
    {
      name: 'GreenView Apartments',
      type: 'apartment',
      address: 'Park Street',
      description: 'Serviced apartments with kitchenette, ideal for families.',
      phone: '+91-1166778899',
      pricePerNight: 3000,
      rating: 4.3,
      rooms: 6,
      amenities: ['Kitchenette', 'Free WiFi', 'Parking'],
      coordinates: [77.211, 28.618], // inside GREEN zone
    },
    {
      name: 'Industrial Corridor Lodge',
      type: 'hotel',
      address: 'Corridor Road, Near Heavy Industry Area',
      description: 'Basic budget lodge. Note: located in a high-risk area. Tourists are advised to choose safer options.',
      phone: '+91-1199001122',
      pricePerNight: 900,
      rating: 2.8,
      rooms: 10,
      amenities: ['Fan', 'Shared Bathroom'],
      coordinates: [77.1415, 28.5705], // inside RED zone
    },
    {
      name: 'Corridor Transit Hotel',
      type: 'hotel',
      address: 'Industrial Area 4',
      description: 'Transit hotel near the industrial corridor. Not recommended for tourists due to safety concerns.',
      phone: '+91-1199887766',
      pricePerNight: 1500,
      rating: 3.0,
      rooms: 15,
      amenities: ['AC', 'Parking'],
      coordinates: [77.14, 28.5695], // inside RED zone
    },
    {
      name: 'Old City Bazaar Inn',
      type: 'hostel',
      address: 'Old City Bazaar',
      description: 'Budget hostel in the historic bazaar. Crowded area — be cautious with belongings.',
      phone: '+91-1177889900',
      pricePerNight: 700,
      rating: 3.5,
      rooms: 20,
      amenities: ['Free WiFi', 'Shared Kitchen'],
      coordinates: [77.2353, 28.6558], // inside YELLOW zone
    },
  ];
  for (const h of hotelData) {
    await Hotel.create({
      name: h.name,
      type: h.type,
      address: h.address,
      description: h.description,
      phone: h.phone,
      pricePerNight: h.pricePerNight,
      rating: h.rating,
      rooms: h.rooms,
      amenities: h.amenities,
      location: { type: 'Point', coordinates: h.coordinates },
      createdBy: authority._id,
    });
  }
  console.log(`Created ${hotelData.length} hotels (green/red/yellow zone demos)`);

  await HotelBooking.create({
    hotel: (await Hotel.findOne({ name: 'Grand Heritage Hotel' }))._id,
    tourist: tourists[0]._id,
    checkIn: new Date(Date.now() + 2 * 24 * 3600 * 1000),
    checkOut: new Date(Date.now() + 5 * 24 * 3600 * 1000),
    guests: 2,
    nights: 3,
    totalPrice: 4500 * 3,
    status: BOOKING_STATUS.CONFIRMED,
  });
  console.log('Created 1 sample hotel booking (confirmed)');

  // --- Emergency Services ---
  const services = [
    { name: 'City General Hospital', type: 'hospital', phone: '+91-1123456789', emergencyNumber: '102', address: 'MG Road', coordinates: [77.206, 28.616] },
    { name: 'Central Police Station', type: 'police', phone: '+91-1122223333', emergencyNumber: '100', address: 'Police Lines', coordinates: [77.212, 28.605] },
    { name: 'Fire & Rescue Station', type: 'fire', phone: '+91-1123334444', emergencyNumber: '101', address: 'Fire Brigade Road', coordinates: [77.221, 28.631] },
    { name: 'Lifecare Pharmacy 24/7', type: 'pharmacy', phone: '+91-1144556677', address: 'Main Bazaar', coordinates: [77.231, 28.650] },
    { name: 'UK Embassy Office', type: 'embassy', phone: '+91-1147788000', address: 'Chanakyapuri', coordinates: [77.155, 28.582] },
    { name: 'Tourist Helpline Center', type: 'helpline', phone: '+91-1145', emergencyNumber: '1363', address: 'Connaught Place', coordinates: [77.213, 28.631] },
  ];
  for (const s of services) {
    await EmergencyService.create({
      name: s.name,
      type: s.type,
      phone: s.phone,
      emergencyNumber: s.emergencyNumber || s.phone,
      address: s.address,
      location: { type: 'Point', coordinates: s.coordinates },
    });
  }
  console.log(`Created ${services.length} emergency services`);

  // --- Incidents ---
  const incidentSamples = [
    {
      title: 'Pickpocketing near the metro station',
      description: 'Someone snatched my wallet near the metro exit. They ran toward the market. Be careful everyone!',
      lat: 28.6322,
      lng: 77.2203,
      reporter: tourists[0],
    },
    {
      title: 'Taxi overcharged me',
      description: 'A taxi driver charged me 5x the metered fare for a short trip. Scam alert for tourists in this area.',
      lat: 28.6221,
      lng: 77.2095,
      reporter: tourists[1],
    },
    {
      title: 'Man following me for several blocks',
      description: 'I am being followed. The man has been behind me for 4 blocks and does not respond when I turn around.',
      lat: 28.6502,
      lng: 77.231,
      reporter: tourists[2],
    },
    {
      title: 'Minor scooter accident',
      description: 'A scooter hit a pedestrian at the crossing. No serious injuries but traffic is disrupted.',
      lat: 28.6102,
      lng: 77.2012,
      reporter: tourists[0],
    },
    {
      title: 'Tourist feeling unwell at the food market',
      description: 'Feeling dizzy and nauseous after street food, may need medical help.',
      lat: 28.605,
      lng: 77.2095,
      reporter: tourists[1],
    },
  ];

  let t = 0;
  for (const sample of incidentSamples) {
    t += 1;
    const ai = classifyIncident(sample.title, sample.description);
    const status =
      t === 1 ? INCIDENT_STATUS.RESOLVED : t === 3 ? INCIDENT_STATUS.REVIEWING : INCIDENT_STATUS.REPORTED;
    await Incident.create({
      reporter: sample.reporter._id,
      type: ai.type,
      title: sample.title,
      description: sample.description,
      location: { type: 'Point', coordinates: [sample.lng, sample.lat] },
      status,
      severity: ai.severity,
      aiClassified: true,
      aiConfidence: ai.confidence,
      aiModel: 'rule-based-classifier',
      resolvedAt: status === INCIDENT_STATUS.RESOLVED ? new Date() : null,
    });
  }
  console.log(`Created ${incidentSamples.length} incidents (AI classified)`);

  // --- Help Requests (user -> admin tickets) ---
  const helpRequests = [
    {
      user: tourists[0],
      type: 'assistance',
      subject: 'Need help finding my hotel',
      description: 'Lost my way after visiting the market. Please help me with directions to my hotel.',
      status: 'in_progress',
      priority: 'medium',
      adminNote: 'Share your hotel name and we will guide you.',
      coordinates: [77.209, 28.6139],
    },
    {
      user: tourists[1],
      type: 'medical',
      subject: 'Allergic reaction - need pharmacy',
      description: 'I have an allergic reaction and need to find a 24/7 pharmacy urgently.',
      status: 'pending',
      priority: 'high',
      coordinates: [77.2177, 28.6304],
    },
    {
      user: tourists[2],
      type: 'feedback',
      subject: 'Great experience with TOURSAFE',
      description: 'The geofencing alerts helped me avoid a risky area. Amazing platform!',
      status: 'resolved',
      priority: 'low',
      adminNote: 'Thank you for your feedback!',
      coordinates: [77.1655, 28.595],
    },
  ];
  for (const hr of helpRequests) {
    await HelpRequest.create({
      user: hr.user._id,
      type: hr.type,
      subject: hr.subject,
      description: hr.description,
      status: hr.status,
      priority: hr.priority,
      adminNote: hr.adminNote,
      location: { type: 'Point', coordinates: hr.coordinates },
      resolvedAt: hr.status === 'resolved' ? new Date() : null,
    });
  }
  console.log(`Created ${helpRequests.length} help requests`);

  // --- Broadcasts (admin -> users) ---
  const broadcasts = [
    {
      title: '⚠️ Heavy rain expected tonight',
      body: 'Meteorological department forecasts heavy rain after 8 PM. Tourists are advised to avoid low-lying areas and carry umbrellas.',
      level: 'warning',
      audience: 'all',
    },
    {
      title: '🟢 City festival this weekend',
      body: 'A cultural festival will be held at Central Square this weekend. Extra security personnel will be deployed. Enjoy safely!',
      level: 'info',
      audience: 'all',
    },
  ];
  for (const b of broadcasts) {
    await Broadcast.create({ ...b, createdBy: authority._id });
  }
  console.log(`Created ${broadcasts.length} broadcasts`);

  // --- Sample SOS log (resolved case) ---
  await SOSLog.create({
    tourist: tourists[0]._id,
    sosId: `SOS-${Date.now()}`,
    lat: 28.6139,
    lng: 77.209,
    status: 'resolved',
    acknowledgedBy: authority._id,
    acknowledgedAt: new Date(Date.now() - 3600 * 1000),
    resolvedBy: authority._id,
    resolvedAt: new Date(),
    notes: 'Unit reached the tourist. Situation resolved, tourist safe.',
  });
  console.log('Created 1 resolved SOS log');

  console.log('\n✅ Seed complete!');
  console.log('Authorities: authority@toursafe.com / admin@toursafe.com (password123)');
  console.log('Tourists: emma@example.com, luca@example.com, aisha@example.com (password123)');
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});