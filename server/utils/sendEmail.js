const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendResetEmail(to, resetLink) {

  await transporter.sendMail({
    from: `"Berlly Boutique" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Berlly Boutique</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien expire dans 30 minutes.</p>
        <a href="${resetLink}" style="display:inline-block; padding:12px 24px; background:#e63946; color:#fff; text-decoration:none; border-radius:8px; margin:15px 0;">
          Réinitialiser mon mot de passe
        </a>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>
    `
  });

}

module.exports = sendResetEmail;