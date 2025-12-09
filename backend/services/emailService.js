const nodemailer = require('nodemailer');

// Configuration du transporteur email
// Note: À configurer avec vos vraies credentials SMTP en production
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true pour port 465, false pour autres ports
  auth: {
    user: process.env.SMTP_USER || 'votre-email@gmail.com',
    pass: process.env.SMTP_PASS || 'votre-mot-de-passe-app'
  }
});

// Vérifier la connexion SMTP au démarrage
transporter.verify((error, success) => {
  if (error) {
    console.log('⚠️  Erreur configuration email SMTP:', error.message);
    console.log('📧 Configurez les variables SMTP_HOST, SMTP_USER, SMTP_PASS dans .env');
  } else {
    console.log('✅ Service email prêt');
  }
});

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Envoyer un email de vérification lors de l'inscription
 */
const sendVerificationEmail = async (email, firstName, verificationToken) => {
  const verificationLink = `${BASE_URL}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: `"RentFlow" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '🚗 Vérifiez votre adresse email - RentFlow',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #ff6b35; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 Bienvenue sur RentFlow !</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${firstName}</strong>,</p>
            <p>Merci de vous être inscrit sur RentFlow. Pour activer votre compte et commencer à réserver des véhicules, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
            <center>
              <a href="${verificationLink}" class="button">✅ Vérifier mon email</a>
            </center>
            <p>Ou copiez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${verificationLink}</p>
            <p><strong>Ce lien expire dans 24 heures.</strong></p>
            <p>Si vous n'avez pas créé de compte RentFlow, ignorez cet email.</p>
          </div>
          <div class="footer">
            <p>© 2025 RentFlow - Plateforme de location de véhicules</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de vérification envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email vérification:', error);
    throw error;
  }
};

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
const sendPasswordResetEmail = async (email, firstName, resetToken) => {
  const resetLink = `${BASE_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"RentFlow" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '🔒 Réinitialisation de votre mot de passe - RentFlow',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Réinitialisation du mot de passe</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${firstName}</strong>,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe RentFlow. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            <center>
              <a href="${resetLink}" class="button">🔑 Réinitialiser mon mot de passe</a>
            </center>
            <p>Ou copiez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${resetLink}</p>
            <div class="warning">
              <p style="margin: 0;"><strong>⚠️ Important :</strong></p>
              <ul style="margin: 10px 0;">
                <li>Ce lien expire dans <strong>1 heure</strong></li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                <li>Votre mot de passe actuel reste valide tant que vous n'en créez pas un nouveau</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 RentFlow - Plateforme de location de véhicules</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de réinitialisation envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email réinitialisation:', error);
    throw error;
  }
};

/**
 * Envoyer un email de confirmation après réinitialisation
 */
const sendPasswordResetConfirmation = async (email, firstName) => {
  const mailOptions = {
    from: `"RentFlow" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '✅ Votre mot de passe a été modifié - RentFlow',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00b09b 0%, #96c93d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info { background: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Mot de passe modifié</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${firstName}</strong>,</p>
            <p>Votre mot de passe RentFlow a été modifié avec succès.</p>
            <div class="info">
              <p style="margin: 0;"><strong>ℹ️ Informations :</strong></p>
              <ul style="margin: 10px 0;">
                <li>Date : ${new Date().toLocaleString('fr-FR')}</li>
                <li>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe</li>
              </ul>
            </div>
            <p><strong>⚠️ Si vous n'avez pas effectué cette modification, contactez-nous immédiatement !</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 RentFlow - Plateforme de location de véhicules</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de confirmation envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email confirmation:', error);
    throw error;
  }
};

/**
 * Envoyer un email pour activation 2FA
 */
const send2FAEnabledEmail = async (email, firstName) => {
  const mailOptions = {
    from: `"RentFlow" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '🔐 Authentification à deux facteurs activée - RentFlow',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 2FA Activé</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${firstName}</strong>,</p>
            <div class="success">
              <p style="margin: 0;"><strong>✅ L'authentification à deux facteurs a été activée sur votre compte RentFlow.</strong></p>
            </div>
            <p>Votre compte est maintenant mieux protégé. À chaque connexion, vous devrez :</p>
            <ol>
              <li>Entrer votre email et mot de passe</li>
              <li>Fournir un code de vérification depuis votre application d'authentification</li>
            </ol>
            <p><strong>⚠️ Conservez vos codes de secours en lieu sûr !</strong></p>
            <p>Si vous n'avez pas activé la 2FA, contactez-nous immédiatement.</p>
          </div>
          <div class="footer">
            <p>© 2025 RentFlow - Plateforme de location de véhicules</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email 2FA envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email 2FA:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  send2FAEnabledEmail
};
