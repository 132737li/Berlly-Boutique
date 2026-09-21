const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { verifyToken } = require('../middleware/verifyToken');
const sendResetEmail = require('../utils/sendEmail');

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
        phone: utilisateur.phone,
        role: utilisateur.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

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

// Demander une réinitialisation de mot de passe
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const utilisateur = await User.findOne({ email });

    // On répond pareil que l'email existe ou non (sécurité)
    if (!utilisateur) {
      return res.json({ message: 'Si ce compte existe, un email a été envoyé.' });
    }

    const token = crypto.randomBytes(32).toString('hex');

    utilisateur.resetToken = token;
    utilisateur.resetTokenExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await utilisateur.save();

    const resetLink = `${process.env.FRONTEND_URL}/nouveau-mot-de-passe.html?token=${token}`;

    await sendResetEmail(utilisateur.email, resetLink);

    res.json({ message: 'Si ce compte existe, un email a été envoyé.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Réinitialiser le mot de passe avec le token reçu par email
router.post('/reset-password', async (req, res) => {
  try {
    const { token, motDePasse } = req.body;

    const utilisateur = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!utilisateur) {
      return res.status(400).json({ message: 'Lien invalide ou expiré.' });
    }

    utilisateur.motDePasse = await bcrypt.hash(motDePasse, 10);
    utilisateur.resetToken = null;
    utilisateur.resetTokenExpires = null;
    await utilisateur.save();

    res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;