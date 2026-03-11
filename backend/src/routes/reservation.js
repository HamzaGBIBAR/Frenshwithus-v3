import { Router } from 'express';
import prisma from '../lib/db.js';
import { sendMail, getContactEmail } from '../lib/mailer.js';

const router = Router();

const DIAL_CODES = { MA: '+212', FR: '+33', DZ: '+213', US: '+1', GB: '+44', DE: '+49', BE: '+32', CA: '+1', ES: '+34', IT: '+39', AE: '+971', SA: '+966', EG: '+20', TN: '+216', LB: '+961', JO: '+962', TR: '+90', CN: '+86', JP: '+81', BR: '+55', IN: '+91' };

function buildNotificationEmail(r) {
  const dial = DIAL_CODES[r.phoneCountry] || `+${r.phoneCountry}`;
  const audienceLabel = r.audience === 'adults' ? 'Adultes' : r.audience === 'children' ? 'Enfants' : '—';
  const lines = [
    `<h2 style="color:#E75480;">Nouvelle réservation</h2>`,
    `<table style="border-collapse:collapse;font-family:sans-serif;">`,
    `<tr><td style="padding:4px 12px;font-weight:bold;">Prénom</td><td style="padding:4px 12px;">${r.firstName}</td></tr>`,
    `<tr><td style="padding:4px 12px;font-weight:bold;">Nom</td><td style="padding:4px 12px;">${r.lastName}</td></tr>`,
    `<tr><td style="padding:4px 12px;font-weight:bold;">Email</td><td style="padding:4px 12px;"><a href="mailto:${r.email}">${r.email}</a></td></tr>`,
    `<tr><td style="padding:4px 12px;font-weight:bold;">Téléphone</td><td style="padding:4px 12px;">${dial} ${r.phoneNumber}</td></tr>`,
    r.country ? `<tr><td style="padding:4px 12px;font-weight:bold;">Pays</td><td style="padding:4px 12px;">${r.country}</td></tr>` : '',
    `<tr><td style="padding:4px 12px;font-weight:bold;">Public</td><td style="padding:4px 12px;">${audienceLabel}</td></tr>`,
    r.age ? `<tr><td style="padding:4px 12px;font-weight:bold;">Âge</td><td style="padding:4px 12px;">${r.age}</td></tr>` : '',
    r.pack ? `<tr><td style="padding:4px 12px;font-weight:bold;">Pack</td><td style="padding:4px 12px;">${r.pack}</td></tr>` : '',
    `</table>`,
    `<p style="color:#888;font-size:12px;margin-top:16px;">Envoyé automatiquement par French With Us.</p>`,
  ];
  return lines.filter(Boolean).join('\n');
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
