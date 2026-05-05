const express = require('express');
const http = require('http');
const app = express();
const PORT = 3001;

// --- 1. SETUP BASIC SERVER ---
// We wrap express in an http server because Socket.IO needs it
const httpServer = http.createServer(app);

app.get('/', (req, res) => {
  res.send('Pulse-Post Backend is alive! 🚀');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
