/**
 * Mailer – sends emails via Gmail SMTP (primary) or Resend API (fallback).
 * Also supports optional Telegram notifications.
 *
 * Gmail SMTP (Recommended - works with any Gmail account):
 *   GMAIL_USER      – your Gmail address (e.g., frenchwithus.edu@gmail.com)
 *   GMAIL_APP_PASS  – 16-character App Password from Google Account
 *
 * Resend (Alternative):
 *   RESEND_API_KEY  – from resend.com dashboard
 *   RESEND_FROM     – verified sender email
 *
 * General:
 *   CONTACT_EMAIL   – destination email for admin notifications
 *
 * Telegram (optional):
 *   TELEGRAM_BOT_TOKEN – from @BotFather on Telegram
 *   TELEGRAM_CHAT_ID   – your chat ID (from @userinfobot)
 */

import nodemailer from 'nodemailer';

let gmailTransporter = null;

function getGmailTransporter() {
  if (gmailTransporter) return gmailTransporter;
  
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASS;
  
  if (!user || !pass) return null;
  
  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  
  return gmailTransporter;
}

async function sendGmail({ to, subject, html, text }) {
  const transporter = getGmailTransporter();
  if (!transporter) return null;
  
  const from = `French With Us <${process.env.GMAIL_USER}>`;
  console.log('[Mailer] Sending email via Gmail SMTP to:', to);
  
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
    });
    console.log('[Mailer] Email sent via Gmail:', info.messageId);
    return { id: info.messageId, provider: 'gmail' };
  } catch (err) {
    console.error('[Mailer] Gmail SMTP error:', err.message);
    throw err;
  }
}

async function sendResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  const from = process.env.RESEND_FROM || 'French With Us <onboarding@resend.dev>';
  console.log('[Mailer] Sending email via Resend to:', to);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('[Mailer] Resend error:', JSON.stringify(data));
    throw new Error(data.message || 'Resend API error');
  }
  console.log('[Mailer] Email sent via Resend:', data.id);
  return data;
}

async function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null;
  console.log('[Mailer] Sending Telegram notification...');
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error('[Mailer] Telegram error:', JSON.stringify(data));
  } else {
    console.log('[Mailer] Telegram notification sent.');
  }
  return data;
}

export async function sendMail({ to, subject, html, text }) {
  const results = [];

  // Priority 1: Gmail SMTP (most reliable for sending to any email)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    try {
      const r = await sendGmail({ to, subject, html, text });
      if (r) {
        results.push('gmail');
        console.log('[Mailer] ✓ Email delivered via Gmail SMTP');
      }
    } catch (err) {
      console.error('[Mailer] Gmail failed:', err.message);
    }
  }

  // Priority 2: Resend API (fallback if Gmail not configured)
  if (results.length === 0 && process.env.RESEND_API_KEY) {
    try {
      const r = await sendResend({ to, subject, html, text });
      if (r) {
        results.push('resend');
        console.log('[Mailer] ✓ Email delivered via Resend');
      }
    } catch (err) {
      console.error('[Mailer] Resend failed:', err.message);
    }
  }

  // Optional: Telegram notification (in addition to email)
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      const telegramText = `📩 <b>${subject}</b>\n\n${text}`;
      await sendTelegram(telegramText);
      results.push('telegram');
    } catch (err) {
      console.error('[Mailer] Telegram failed:', err.message);
    }
  }

  if (results.length === 0) {
    console.warn('[Mailer] ⚠ No email sent! Configure GMAIL_USER + GMAIL_APP_PASS or RESEND_API_KEY');
  }
  
  return results;
}

export function getContactEmail() {
  return process.env.CONTACT_EMAIL || null;
}
