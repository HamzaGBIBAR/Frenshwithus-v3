import { Router } from 'express';
import prisma from '../lib/db.js';
import { sendMail, getContactEmail } from '../lib/mailer.js';

const router = Router();

const DIAL_CODES = { MA: '+212', FR: '+33', DZ: '+213', US: '+1', GB: '+44', DE: '+49', BE: '+32', CA: '+1', ES: '+34', IT: '+39', CH: '+41', AE: '+971', SA: '+966', EG: '+20', TN: '+216', LB: '+961', JO: '+962', TR: '+90', CN: '+86', JP: '+81', BR: '+55', IN: '+91', QA: '+974', KW: '+965' };
const COUNTRY_NAMES = { MA: 'Maroc', FR: 'France', US: 'États-Unis', GB: 'Royaume-Uni', CA: 'Canada', DE: 'Allemagne', ES: 'Espagne', IT: 'Italie', BE: 'Belgique', CH: 'Suisse', DZ: 'Algérie', TN: 'Tunisie', EG: 'Égypte', SA: 'Arabie Saoudite', AE: 'Émirats arabes unis', QA: 'Qatar', KW: 'Koweït', LB: 'Liban', JO: 'Jordanie', TR: 'Turquie', CN: 'Chine', JP: 'Japon', KR: 'Corée du Sud', IN: 'Inde', BR: 'Brésil', MX: 'Mexique', AU: 'Australie', NZ: 'Nouvelle-Zélande', SN: 'Sénégal', CI: "Côte d'Ivoire", CM: 'Cameroun', CD: 'RD Congo', NG: 'Nigeria', GH: 'Ghana' };
const PACK_NAMES = { individuel: 'Individuel', groups: 'Groupes', preparation: 'Préparation' };

function buildNotificationEmail(r) {
  const dial = DIAL_CODES[r.phoneCountry] || `+${r.phoneCountry}`;
  const phone = `${dial} ${r.phoneNumber}`;
  const audienceLabel = r.audience === 'adults' ? '👨‍💼 Adulte' : r.audience === 'children' ? '👶 Enfant' : '—';
  const countryName = COUNTRY_NAMES[r.country] || r.country || '—';
  const packName = PACK_NAMES[r.pack] || r.pack || '—';
  const date = new Date(r.createdAt).toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const row = (icon, label, value) => `
    <tr>
      <td style="padding:10px 16px;color:#888;font-size:13px;white-space:nowrap;vertical-align:top;">${icon} ${label}</td>
      <td style="padding:10px 16px;color:#1F1F1F;font-size:14px;font-weight:500;">${value}</td>
    </tr>`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f0f0;font-family:'Nunito Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(231,84,128,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#E75480 0%,#C2185B 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">French With Us</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Nouvelle demande de réservation</p>
          </td>
        </tr>

        <!-- Audience badge -->
        <tr>
          <td style="padding:24px 40px 0;text-align:center;">
            <span style="display:inline-block;padding:6px 20px;border-radius:20px;background:#FADADD;color:#E75480;font-size:13px;font-weight:600;">${audienceLabel}</span>
          </td>
        </tr>

        <!-- Name -->
        <tr>
          <td style="padding:20px 40px 4px;text-align:center;">
            <h2 style="margin:0;color:#1F1F1F;font-size:24px;font-weight:700;">${r.firstName} ${r.lastName}</h2>
          </td>
        </tr>

        <!-- Details -->
        <tr>
          <td style="padding:16px 40px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr><td colspan="2" style="padding:0 0 8px;border-bottom:1px solid #f0e8e8;"></td></tr>
              ${row('📧', 'Email', `<a href="mailto:${r.email}" style="color:#E75480;text-decoration:none;">${r.email}</a>`)}
              <tr><td colspan="2" style="border-bottom:1px solid #f8f4f4;"></td></tr>
              ${row('📱', 'Téléphone', phone)}
              <tr><td colspan="2" style="border-bottom:1px solid #f8f4f4;"></td></tr>
              ${row('🌍', 'Pays', countryName)}
              <tr><td colspan="2" style="border-bottom:1px solid #f8f4f4;"></td></tr>
              ${r.age ? row('🎂', 'Âge', r.age) + '<tr><td colspan="2" style="border-bottom:1px solid #f8f4f4;"></td></tr>' : ''}
              ${row('📦', 'Pack', packName)}
              <tr><td colspan="2" style="border-bottom:1px solid #f8f4f4;"></td></tr>
              ${row('🕐', 'Reçu le', date)}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <a href="https://frenchwithus.up.railway.app/admin/reservations" style="display:inline-block;padding:12px 32px;border-radius:10px;background:#E75480;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">Voir dans le dashboard</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#faf7f7;padding:20px 40px;text-align:center;border-top:1px solid #f0e8e8;">
            <p style="margin:0;color:#aaa;font-size:11px;">French With Us — frenchwithus.up.railway.app</p>
            <p style="margin:4px 0 0;color:#ccc;font-size:10px;">Email envoyé automatiquement. Ne pas répondre.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// POST /api/reservation – public, enregistre une demande de réservation
router.post('/reservation', async (req, res) => {
  const { firstName, lastName, email, phoneCountry, phoneNumber, age, pack, audience, country: countryOfResidence } = req.body;
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Prénom, nom et email requis' });
  }
  const country = String(phoneCountry || 'FR').trim().slice(0, 10);
  const number = String(phoneNumber || '').trim().replace(/\D/g, '').slice(0, 20);
  if (!number) return res.status(400).json({ error: 'Numéro de téléphone requis' });
  const audienceVal = audience === 'adults' || audience === 'children' ? audience : null;

  const reservation = await prisma.reservation.create({
    data: {
      firstName: firstName.trim().slice(0, 100),
      lastName: lastName.trim().slice(0, 100),
      email: email.trim().slice(0, 255),
      phoneCountry: country,
      phoneNumber: number,
      age: age != null && String(age).trim() ? String(age).trim().slice(0, 20) : null,
      pack: pack != null && String(pack).trim() ? String(pack).trim().slice(0, 50) : null,
      audience: audienceVal,
      country: countryOfResidence != null && String(countryOfResidence).trim() ? String(countryOfResidence).trim().slice(0, 10) : null,
    },
  });

  const contactEmail = getContactEmail();
  if (contactEmail) {
    sendMail({
      to: contactEmail,
      subject: `[Réservation] ${reservation.firstName} ${reservation.lastName}`,
      html: buildNotificationEmail(reservation),
      text: `Nouvelle réservation de ${reservation.firstName} ${reservation.lastName} (${reservation.email})`,
    }).catch((err) => console.error('Failed to send reservation email:', err.message));
  }

  res.status(201).json(reservation);
});

export default router;
