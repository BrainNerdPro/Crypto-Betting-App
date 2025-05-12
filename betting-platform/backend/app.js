// app.js
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', require('./routes/userRoutes'));
app.use('/api', require('./routes/dailyLineRoutes'));
app.use('/api', require('./routes/adminRoutes'));
app.use('/api', require('./routes/betVolumeRoutes'));

module.exports = app;
