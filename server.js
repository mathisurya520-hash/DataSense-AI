require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large JSON files for CSV content upload
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/datasets', require('./routes/datasets'));
app.use('/api/sql', require('./routes/sql'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));

// Serve static assets in production/development
app.use(express.static('public'));

// Fallback for SPA routing/redirects
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
