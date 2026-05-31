// server.js
require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const { initDB }   = require('./db/database');

const authRoutes   = require('./routes/auth');
const voteRoutes   = require('./routes/vote');
const adminRoutes  = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Serve uploaded candidate images
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth',       authRoutes);
app.use('/api/vote',       voteRoutes);
app.use('/api/candidates', voteRoutes);   // GET /api/candidates hits vote.js GET /
app.use('/api/admin',      adminRoutes);

// Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// 404
app.use((req, res) =>
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` })
);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

// Init DB then start server
initDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`✅ Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ Failed to initialise database:', err);
    process.exit(1);
  });
