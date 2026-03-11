import nodemailer from 'nodemailer';

/**
 * Mailer – sends email via SMTP (Gmail app password recommended).
 *
 * Required env vars:
 *   SMTP_HOST    – e.g. smtp.gmail.com
 *   SMTP_PORT    – e.g. 587
 *   SMTP_USER    – e.g. frenchwithus.noreply@gmail.com
 *   SMTP_PASS    – app password (not your normal password)
 *   CONTACT_EMAIL – destination email for notifications (defaults to SMTP_USER)
 */

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.warn('Mailer not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing). Skipping email.');
    return null;
  }
  const from = `"French With Us" <${process.env.SMTP_USER}>`;
  return t.sendMail({ from, to, subject, html, text });
}

export function getContactEmail() {
  return process.env.CONTACT_EMAIL || process.env.SMTP_USER || null;
}
