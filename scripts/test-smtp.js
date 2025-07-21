// scripts/test-smtp.js
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env' });

async function testSMTP() {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  try {
    await transporter.verify();
    console.log('SMTP connection successful');
    process.exit(0);
  } catch (err) {
    console.error('SMTP connection failed:', err);
    process.exit(1);
  }
}

testSMTP(); 