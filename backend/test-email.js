require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('\n📧 TEST D\'ENVOI D\'EMAIL\n');
  console.log('Configuration SMTP:');
  console.log(`  Host: ${process.env.SMTP_HOST}`);
  console.log(`  Port: ${process.env.SMTP_PORT}`);
  console.log(`  User: ${process.env.SMTP_USER}`);
  console.log(`  Pass: ${process.env.SMTP_PASS ? '✅ Configuré' : '❌ Non configuré'}\n`);

  if (!process.env.SMTP_PASS || process.env.SMTP_PASS === 'VOTRE_MOT_DE_PASSE_APP_ICI') {
    console.log('❌ ERREUR: Mot de passe SMTP non configuré!\n');
    console.log('📋 INSTRUCTIONS:');
    console.log('1. Allez sur: https://myaccount.google.com/apppasswords');
    console.log('2. Créez un mot de passe d\'application pour "RentFlow"');
    console.log('3. Copiez le code généré (16 caractères)');
    console.log('4. Collez-le dans .env à la place de "VOTRE_MOT_DE_PASSE_APP_ICI"\n');
    process.exit(1);
  }

  console.log('⏳ Envoi du mail de test...\n');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    const info = await transporter.sendMail({
      from: `"RentFlow Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Envoyer à vous-même
      subject: '✅ Test SMTP RentFlow - Configuration réussie!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ff6b35;">🎉 Bravo !</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            Votre configuration SMTP fonctionne parfaitement !
          </p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Serveur SMTP :</strong> ${process.env.SMTP_HOST}</p>
            <p><strong>Adresse email :</strong> ${process.env.SMTP_USER}</p>
            <p><strong>Port :</strong> ${process.env.SMTP_PORT}</p>
          </div>
          <p style="color: #666;">
            Les emails de vérification, réinitialisation de mot de passe et notifications 
            seront maintenant envoyés automatiquement.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">
            Cet email a été envoyé automatiquement par RentFlow pour tester la configuration SMTP.
          </p>
        </div>
      `
    });

    console.log('✅ EMAIL ENVOYÉ AVEC SUCCÈS!\n');
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`📧 Vérifiez votre boîte mail: ${process.env.SMTP_USER}\n`);
    console.log('🎉 La configuration SMTP est opérationnelle!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERREUR lors de l\'envoi:\n');
    console.error(error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 SOLUTION:');
      console.log('Le mot de passe d\'application est incorrect.');
      console.log('1. Vérifiez que vous avez copié le code complet (16 caractères)');
      console.log('2. Supprimez les espaces dans le mot de passe');
      console.log('3. Générez un nouveau mot de passe si nécessaire\n');
    }
    
    process.exit(1);
  }
}

testEmail();
