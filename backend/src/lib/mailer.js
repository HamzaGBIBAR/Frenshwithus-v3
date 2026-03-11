import nodemailer from 'nodemailer';
import dns from 'dns';

// Force IPv4 DNS resolution (fixes ENOTFOUND on Railway/Docker containers)
dns.setDefaultResultOrder('ipv4first');

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
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    tls: { rejectUnauthorized: false },
  });
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  console.log('[Mailer] Attempting to send email to:', to);
  console.log('[Mailer] SMTP_HOST:', process.env.SMTP_HOST || '(not set)');
  console.log('[Mailer] SMTP_USER:', process.env.SMTP_USER || '(not set)');
  console.log('[Mailer] SMTP_PASS:', process.env.SMTP_PASS ? '****' + process.env.SMTP_PASS.slice(-4) : '(not set)');
  const t = getTransporter();
  if (!t) {
    console.warn('[Mailer] Not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing). Skipping email.');
    return null;
  }
  const from = `"French With Us" <${process.env.SMTP_USER}>`;
  try {
    const result = await t.sendMail({ from, to, subject, html, text });
    console.log('[Mailer] Email sent successfully. MessageId:', result.messageId);
    return result;
  } catch (err) {
    console.error('[Mailer] Failed to send:', err.message);
    console.error('[Mailer] Error code:', err.code);
    console.error('[Mailer] Full error:', JSON.stringify({ code: err.code, command: err.command, response: err.response }, null, 2));
    throw err;
  }
}

export function getContactEmail() {
  return process.env.CONTACT_EMAIL || process.env.SMTP_USER || null;
}
