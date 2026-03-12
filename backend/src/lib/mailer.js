import { Resend } from 'resend';

/**
 * Mailer – sends email via Resend HTTP API.
 * Works on Railway (no SMTP, no DNS issues).
 *
 * Required env vars:
 *   RESEND_API_KEY  – from resend.com dashboard
 *   CONTACT_EMAIL   – destination email for notifications
 */

let resendClient = null;

function getResend() {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  resendClient = new Resend(apiKey);
  return resendClient;
}

export async function sendMail({ to, subject, html, text }) {
  console.log('[Mailer] Attempting to send email to:', to);
  const r = getResend();
  if (!r) {
    console.warn('[Mailer] RESEND_API_KEY not set. Skipping email.');
    return null;
  }
  const from = process.env.RESEND_FROM || 'French With Us <onboarding@resend.dev>';
  try {
    const result = await r.emails.send({ from, to, subject, html, text });
    console.log('[Mailer] Email sent successfully:', JSON.stringify(result));
    return result;
  } catch (err) {
    console.error('[Mailer] Failed to send:', err.message || JSON.stringify(err));
    throw err;
  }
}

export function getContactEmail() {
  return process.env.CONTACT_EMAIL || null;
}
