import nodemailer from 'nodemailer';
import { Resolver } from 'dns';
import net from 'net';

/**
 * Mailer – sends email via SMTP (Gmail app password recommended).
 * Resolves SMTP host via Google Public DNS (8.8.8.8) to bypass
 * Railway container DNS issues, then connects to the resolved IP.
 */

const googleDns = new Resolver();
googleDns.setServers(['8.8.8.8', '8.8.4.4']);

function resolveHost(hostname) {
  if (net.isIP(hostname)) return Promise.resolve(hostname);
  return new Promise((resolve, reject) => {
    googleDns.resolve4(hostname, (err, addresses) => {
      if (err || !addresses?.length) return reject(err || new Error('No addresses'));
      resolve(addresses[0]);
    });
  });
}

let cachedIp = null;

async function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  if (!cachedIp) {
    console.log('[Mailer] Resolving', host, 'via Google DNS (8.8.8.8)...');
    cachedIp = await resolveHost(host);
    console.log('[Mailer] Resolved', host, '->', cachedIp);
  }

  return nodemailer.createTransport({
    host: cachedIp,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    tls: { servername: host, rejectUnauthorized: false },
  });
}

export async function sendMail({ to, subject, html, text }) {
  console.log('[Mailer] Attempting to send email to:', to);
  console.log('[Mailer] SMTP_HOST:', process.env.SMTP_HOST || '(not set)');
  console.log('[Mailer] SMTP_USER:', process.env.SMTP_USER || '(not set)');
  console.log('[Mailer] SMTP_PASS:', process.env.SMTP_PASS ? '****' + process.env.SMTP_PASS.slice(-4) : '(not set)');

  const t = await createTransporter();
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
    cachedIp = null;
    throw err;
  }
}

export function getContactEmail() {
  return process.env.CONTACT_EMAIL || process.env.SMTP_USER || null;
}
