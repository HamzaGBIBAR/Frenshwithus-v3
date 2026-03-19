/**
 * Mailer – sends emails via Resend API.
 *
 * Resend (resend.com):
 *   RESEND_API_KEY  – from resend.com dashboard
 *   CONTACT_EMAIL   – admin email (must be verified on Resend for sandbox mode)
 *
 * Note: Without a verified domain, Resend only sends to the account owner's email.
 * User confirmation emails will be skipped in sandbox mode.
 */

async function sendResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('[Mailer] No RESEND_API_KEY configured');
    return null;
  }
  
  const from = 'French With Us <onboarding@resend.dev>';
  console.log('[Mailer] Sending email via Resend to:', to);
  
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error('[Mailer] Resend error:', JSON.stringify(data));
      throw new Error(data.message || 'Resend API error');
    }
    
    console.log('[Mailer] ✓ Email sent via Resend:', data.id);
    return { id: data.id, provider: 'resend' };
  } catch (err) {
    console.error('[Mailer] Resend failed:', err.message);
    throw err;
  }
}

export async function sendMail({ to, subject, html, text }) {
  const results = [];
  const errors = [];

  console.log('[Mailer] === SENDING EMAIL ===');
  console.log('[Mailer] To:', to);
  console.log('[Mailer] Subject:', subject);
  console.log('[Mailer] RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY);

  if (process.env.RESEND_API_KEY) {
    try {
      const r = await sendResend({ to, subject, html, text });
      if (r) {
        results.push('resend');
      }
    } catch (err) {
      console.error('[Mailer] ✗ Resend failed:', err.message);
      errors.push({ provider: 'resend', error: err.message });
    }
  } else {
    console.log('[Mailer] No RESEND_API_KEY - email not sent');
    errors.push({ provider: 'resend', error: 'RESEND_API_KEY not configured' });
  }

  if (results.length === 0) {
    console.error('[Mailer] ⚠ NO EMAIL SENT!');
  }

  console.log('[Mailer] === EMAIL RESULT ===');
  console.log('[Mailer] Sent via:', results.join(', ') || 'NONE');
  
  return { results, errors };
}

export function getContactEmail() {
  return process.env.CONTACT_EMAIL || null;
}
