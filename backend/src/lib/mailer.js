import nodemailer from 'nodemailer';
import { Resolver } from 'dns';

const googleDns = new Resolver();
googleDns.setServers(['8.8.8.8', '8.8.4.4']);

/**
 * Mailer – sends email via SMTP (Gmail app password recommended).
 * Uses Google Public DNS (8.8.8.8) to resolve SMTP hostnames,
 * bypassing Railway container DNS issues.
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
    dnsLookup: (hostname, options, callback) => {
      console.log('[Mailer] Resolving', hostname, 'via Google DNS (8.8.8.8)...');
      googleDns.resolve4(hostname, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          console.error('[Mailer] Google DNS resolve4 failed:', err?.message || 'no addresses');
          return callback(err || new Error('No addresses found'));
        }
        console.log('[Mailer] Resolved', hostname, '->', addresses[0]);
        callback(null, addresses[0], 4);
      });
    },
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
