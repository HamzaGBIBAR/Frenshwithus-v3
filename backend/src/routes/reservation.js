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

// Email de confirmation pour l'utilisateur
function buildUserConfirmationEmail(r) {
  const PACK_NAMES = { individuel: 'Individuel', groups: 'Groupes', preparation: 'Préparation' };
  const packName = PACK_NAMES[r.pack] || r.pack || 'Non spécifié';
  const audienceLabel = r.audience === 'adults' ? 'Adulte' : r.audience === 'children' ? 'Enfant' : '';
  const date = new Date(r.createdAt).toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de réservation - French With Us</title>
</head>
<body style="margin:0;padding:0;background:#f5f0f0;font-family:'Nunito Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(231,84,128,0.08);">

        <!-- Header avec logo -->
        <tr>
          <td style="background:linear-gradient(135deg,#E75480 0%,#C2185B 100%);padding:40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:0.5px;">French With Us</h1>
            <p style="margin:12px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Votre partenaire pour apprendre le français</p>
          </td>
        </tr>

        <!-- Message de bienvenue -->
        <tr>
          <td style="padding:40px 40px 24px;text-align:center;">
            <div style="width:64px;height:64px;margin:0 auto 20px;background:#FADADD;border-radius:50%;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:28px;">✓</span>
            </div>
            <h2 style="margin:0 0 12px;color:#1F1F1F;font-size:24px;font-weight:700;">Merci pour votre demande, ${r.firstName} !</h2>
            <p style="margin:0;color:#666;font-size:15px;line-height:1.6;">
              Nous avons bien reçu votre demande de réservation.<br>
              Notre équipe vous contactera très prochainement.
            </p>
          </td>
        </tr>

        <!-- Récapitulatif -->
        <tr>
          <td style="padding:0 40px 32px;">
            <div style="background:#faf7f7;border-radius:12px;padding:24px;border:1px solid #f0e8e8;">
              <h3 style="margin:0 0 16px;color:#E75480;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Récapitulatif de votre demande</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;color:#888;font-size:13px;">Nom complet</td>
                  <td style="padding:8px 0;color:#1F1F1F;font-size:14px;font-weight:500;text-align:right;">${r.firstName} ${r.lastName}</td>
                </tr>
                <tr><td colspan="2" style="border-bottom:1px solid #f0e8e8;"></td></tr>
                <tr>
                  <td style="padding:8px 0;color:#888;font-size:13px;">Email</td>
                  <td style="padding:8px 0;color:#1F1F1F;font-size:14px;font-weight:500;text-align:right;">${r.email}</td>
                </tr>
                <tr><td colspan="2" style="border-bottom:1px solid #f0e8e8;"></td></tr>
                <tr>
                  <td style="padding:8px 0;color:#888;font-size:13px;">Pack choisi</td>
                  <td style="padding:8px 0;color:#E75480;font-size:14px;font-weight:600;text-align:right;">${packName}</td>
                </tr>
                ${audienceLabel ? `
                <tr><td colspan="2" style="border-bottom:1px solid #f0e8e8;"></td></tr>
                <tr>
                  <td style="padding:8px 0;color:#888;font-size:13px;">Type</td>
                  <td style="padding:8px 0;color:#1F1F1F;font-size:14px;font-weight:500;text-align:right;">${audienceLabel}</td>
                </tr>
                ` : ''}
                <tr><td colspan="2" style="border-bottom:1px solid #f0e8e8;"></td></tr>
                <tr>
                  <td style="padding:8px 0;color:#888;font-size:13px;">Date de demande</td>
                  <td style="padding:8px 0;color:#1F1F1F;font-size:14px;font-weight:500;text-align:right;">${date}</td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- Prochaines étapes -->
        <tr>
          <td style="padding:0 40px 32px;">
            <h3 style="margin:0 0 16px;color:#1F1F1F;font-size:16px;font-weight:600;">Prochaines étapes</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:12px 0;vertical-align:top;width:32px;">
                  <div style="width:24px;height:24px;background:#E75480;border-radius:50%;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;">1</div>
                </td>
                <td style="padding:12px 0 12px 12px;color:#555;font-size:14px;line-height:1.5;">
                  <strong style="color:#1F1F1F;">Confirmation par téléphone</strong><br>
                  Un membre de notre équipe vous appellera pour discuter de vos objectifs.
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;vertical-align:top;width:32px;">
                  <div style="width:24px;height:24px;background:#E75480;border-radius:50%;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;">2</div>
                </td>
                <td style="padding:12px 0 12px 12px;color:#555;font-size:14px;line-height:1.5;">
                  <strong style="color:#1F1F1F;">Planification de votre cours</strong><br>
                  Nous définirons ensemble un horaire adapté à votre disponibilité.
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;vertical-align:top;width:32px;">
                  <div style="width:24px;height:24px;background:#E75480;border-radius:50%;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;">3</div>
                </td>
                <td style="padding:12px 0 12px 12px;color:#555;font-size:14px;line-height:1.5;">
                  <strong style="color:#1F1F1F;">Début de votre aventure</strong><br>
                  Commencez vos cours de français avec nos professeurs qualifiés !
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Contact -->
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <p style="margin:0 0 16px;color:#666;font-size:14px;">Des questions ? Contactez-nous :</p>
            <a href="mailto:frenchwithus.edu@gmail.com" style="display:inline-block;padding:12px 28px;border-radius:10px;background:#E75480;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">frenchwithus.edu@gmail.com</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#faf7f7;padding:24px 40px;text-align:center;border-top:1px solid #f0e8e8;">
            <p style="margin:0 0 8px;color:#E75480;font-size:14px;font-weight:600;">French With Us</p>
            <p style="margin:0 0 12px;color:#888;font-size:12px;">Apprenez le français avec passion</p>
            <p style="margin:0;color:#bbb;font-size:11px;">
              <a href="https://frenchwithus.up.railway.app" style="color:#E75480;text-decoration:none;">frenchwithus.up.railway.app</a>
            </p>
            <p style="margin:12px 0 0;color:#ccc;font-size:10px;">
              Cet email a été envoyé suite à votre demande de réservation.<br>
              Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer ce message.
            </p>
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

  // 1. Email de notification à l'admin (French With Us)
  const contactEmail = getContactEmail();
  if (contactEmail) {
    sendMail({
      to: contactEmail,
      subject: `[Réservation] ${reservation.firstName} ${reservation.lastName}`,
      html: buildNotificationEmail(reservation),
      text: `Nouvelle réservation de ${reservation.firstName} ${reservation.lastName} (${reservation.email})`,
    }).catch((err) => console.error('Failed to send admin notification email:', err.message));
  }

  // 2. Email de confirmation à l'utilisateur
  if (reservation.email) {
    sendMail({
      to: reservation.email,
      subject: `Confirmation de votre demande - French With Us`,
      html: buildUserConfirmationEmail(reservation),
      text: `Bonjour ${reservation.firstName},\n\nMerci pour votre demande de réservation chez French With Us.\n\nNous avons bien reçu votre demande et notre équipe vous contactera très prochainement.\n\nRécapitulatif:\n- Nom: ${reservation.firstName} ${reservation.lastName}\n- Pack: ${reservation.pack || 'Non spécifié'}\n\nÀ bientôt,\nL'équipe French With Us`,
    }).catch((err) => console.error('Failed to send user confirmation email:', err.message));
  }

  res.status(201).json(reservation);
});

export default router;
