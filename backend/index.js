
const express = require('express');
const connectDB = require('./config/db');

const app = pp.get('/', (req, res) => {
  res.json({ message: 'Server is running', status: 'OK' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
express();
app.use(express.json());

connectDB();

// Basic route for health check
