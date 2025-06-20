const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const https = require('https');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Routes
app.use('/api/users', require('./routes/users'));

// Default root route to handle self-ping
app.get('/', (req, res) => {
  res.send('Server is awake!');
});

// Self-ping to prevent server sleep
const url = `https://backend-v9kl.onrender.com`; // Replace with your Render URL
const interval = 840000; // 14 minute interval

function reloadWebsite() {
  https.get(url, (res) => {
    console.log(`Ping at ${new Date().toISOString()}: Status Code ${res.statusCode}`);
  }).on('error', (error) => {
    console.error(`Ping error at ${new Date().toISOString()}: ${error.message}`);
  });
}

// Ping the URL every 14 minute to keep server active
setInterval(reloadWebsite, interval);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
