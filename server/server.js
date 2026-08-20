import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { initSocket } from './services/socket.js';

import authRoutes from './routes/authRoutes.js';
import touristRoutes from './routes/touristRoutes.js';
import zoneRoutes from './routes/zoneRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import sosRoutes from './routes/sosRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';
import hotelRoutes from './routes/hotelRoutes.js';

dotenv.config({ override: true });

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'TOURSAFE API is running', uptime: process.uptime() }));

app.use('/api/auth', authRoutes);
app.use('/api/tourists', touristRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/emergency-services', emergencyRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/hotels', hotelRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

// Serve built React app in production
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const start = async () => {
  await connectDB();
  initSocket(server);
  server.listen(PORT, () => console.log(`🚀 TOURSAFE server running on http://localhost:${PORT}`));
};

start();