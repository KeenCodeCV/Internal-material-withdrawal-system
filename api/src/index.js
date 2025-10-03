// apps/api/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

const PORT   = process.env.API_PORT || 4000;
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// ---- CORS: รองรับ credentials + PATCH/DELETE และ preflight ----
const corsOpts = {
  origin: ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOpts));
app.options('*', cors(corsOpts)); // preflight

// ---- Parsers ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---- Logger ----
app.use(morgan('dev'));

app.use('/api/admin', require('./routes/admin'));

app.use('/api/profile', require('./routes/profile'));

// ---- Static uploads ----
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ---- Health check ----
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---- Routes ----
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/requisitions', require('./routes/requisitions'));

// ---- Root test ----
app.get('/', (req, res) => {
  res.json({ message: 'MaterialFlow API running' });
});

// ---- Not found handler ----
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// ---- Error handler ----
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  const code = err.status || 500;
  res.status(code).json({
    message: err.message || 'Server error',
    code,
    details: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

// ---- Start ----
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`CORS origin: ${ORIGIN}`);
});
