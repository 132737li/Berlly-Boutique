require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch((err) => console.error('❌ Erreur MongoDB :', err));

// Route de test
app.get('/', (req, res) => {
  res.send('Serveur de Berlly-Boutique est en ligne ');
});

// Routes d'authentification
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));