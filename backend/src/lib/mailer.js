/**
 * Mailer – sends notifications via Resend HTTP API + optional Telegram bot.
 * Uses native fetch (no SMTP, no DNS issues on Railway).
 *
 * Email (Resend):
 *   RESEND_API_KEY  – from resend.com dashboard
 *   CONTACT_EMAIL   – destination email for notifications
 *
 * Telegram (optional, instant phone notifications):
 *   TELEGRAM_BOT_TOKEN – from @BotFather on Telegram
 *   TELEGRAM_CHAT_ID   – your chat ID (from @userinfobot)
 */

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

  if (process.env.RESEND_API_KEY) {
    try {
      const r = await sendResend({ to, subject, html, text });
      if (r) results.push('resend');
    } catch (err) {
      console.error('[Mailer] Resend failed:', err.message);
    }
  }

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
    console.warn('[Mailer] No notification channel configured (RESEND_API_KEY or TELEGRAM_BOT_TOKEN+TELEGRAM_CHAT_ID).');
  }
  return results;
}

export function getContactEmail() {
  return process.env.CONTACT_EMAIL || null;
}
