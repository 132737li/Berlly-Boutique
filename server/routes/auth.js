const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { nom, email, motDePasse, role } = req.body;

    const existant = await User.findOne({ email });
    if (existant) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    const motDePasseHache = await bcrypt.hash(motDePasse, 10);

    const nouvelUtilisateur = new User({
      nom,
      email,
      motDePasse: motDePasseHache,
      role: role === 'admin' ? 'admin' : 'utilisateur'
    });

    await nouvelUtilisateur.save();
    res.status(201).json({ message: 'Compte créé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    const utilisateur = await User.findOne({ email });
    if (!utilisateur) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!motDePasseValide) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: utilisateur._id, role: utilisateur.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      utilisateur: {
        id: utilisateur._id,
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: utilisateur.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});
const { verifyToken } = require('../middleware/verifyToken');

// Modifier son propre profil
router.patch('/me', verifyToken, async (req, res) => {
  try {
    const { nom, phone } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { nom, phone },
      { new: true }
    ).select('-motDePasse');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;