import { Router } from 'express';
import prisma from '../lib/db.js';
import { sendMail, getContactEmail } from '../lib/mailer.js';

const router = Router();

const DIAL_CODES = { MA: '+212', FR: '+33', DZ: '+213', US: '+1', GB: '+44', DE: '+49', BE: '+32', CA: '+1', ES: '+34', IT: '+39', CH: '+41', AE: '+971', SA: '+966', EG: '+20', TN: '+216', LB: '+961', JO: '+962', TR: '+90', CN: '+86', JP: '+81', BR: '+55', IN: '+91', QA: '+974', KW: '+965' };
const COUNTRY_NAMES = { MA: 'Maroc', FR: 'France', US: 'États-Unis', GB: 'Royaume-Uni', CA: 'Canada', DE: 'Allemagne', ES: 'Espagne', IT: 'Italie', BE: 'Belgique', CH: 'Suisse', DZ: 'Algérie', TN: 'Tunisie', EG: 'Égypte', SA: 'Arabie Saoudite', AE: 'Émirats arabes unis', QA: 'Qatar', KW: 'Koweït', LB: 'Liban', JO: 'Jordanie', TR: 'Turquie', CN: 'Chine', JP: 'Japon', KR: 'Corée du Sud', IN: 'Inde', BR: 'Brésil', MX: 'Mexique', AU: 'Australie', NZ: 'Nouvelle-Zélande', SN: 'Sénégal', CI: "Côte d'Ivoire", CM: 'Cameroun', CD: 'RD Congo', NG: 'Nigeria', GH: 'Ghana' };
const PACK_NAMES = { individuel: 'Cours Individuel', groups: 'Cours en Groupe', preparation: 'Préparation aux Examens' };
const PACK_DESCRIPTIONS = {
  individuel: 'Cours particuliers personnalisés avec un professeur dédié',
  groups: 'Apprenez en petit groupe pour une expérience interactive',
  preparation: 'Préparation intensive aux examens DELF/DALF/TCF'
};

function buildNotificationEmail(r) {
  const dial = DIAL_CODES[r.phoneCountry] || `+${r.phoneCountry}`;
  const phone = `${dial} ${r.phoneNumber}`;
  const audienceLabel = r.audience === 'adults' ? '👨‍💼 Adulte' : r.audience === 'children' ? '👶 Enfant' : '—';
  const countryName = COUNTRY_NAMES[r.country] || r.country || '—';
  const packName = PACK_NAMES[r.pack] || r.pack || '—';
  const date = new Date(r.createdAt).toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const refId = `FWU-${String(r.id).padStart(5, '0')}`;

  // Pre-filled professional response email
  const responseSubject = encodeURIComponent(`Votre demande French With Us - ${refId}`);
  const responseBody = encodeURIComponent(`Bonjour ${r.firstName},

Merci d'avoir choisi French With Us pour votre apprentissage du français ! 🎓

Nous avons bien reçu votre demande de réservation (Réf: ${refId}) pour le pack "${packName}".

Je suis ravi(e) de vous accompagner dans cette aventure linguistique. Voici les prochaines étapes :

📞 Appel de découverte
Je vous propose un appel téléphonique de 10-15 minutes pour :
• Discuter de vos objectifs d'apprentissage
• Évaluer votre niveau actuel
• Définir un planning adapté à vos disponibilités

📅 Créneaux disponibles
Merci de me confirmer vos disponibilités pour cet appel :
• [Proposez 2-3 créneaux]

💰 Informations tarifaires
[Détails du pack choisi si nécessaire]

N'hésitez pas à me poser toutes vos questions !

Cordialement,
L'équipe French With Us
📧 frenchwithus.edu@gmail.com
🌐 https://frenchwithus.up.railway.app

---
Référence: ${refId}
`);

  const row = (icon, label, value) => `
    <tr>
      <td style="padding:12px 16px;color:#888;font-size:13px;white-space:nowrap;vertical-align:top;width:120px;">${icon} ${label}</td>
      <td style="padding:12px 16px;color:#1F1F1F;font-size:14px;font-weight:500;">${value}</td>
    </tr>`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Nouvelle Réservation - French With Us</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f0f0;font-family:'Segoe UI','Nunito Sans',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0f0;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" class="email-container" width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(231,84,128,0.1);max-width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#E75480 0%,#C2185B 100%);padding:32px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">🎓 French With Us</h1>
            <p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:14px;font-weight:500;">Nouvelle demande de réservation</p>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Référence: ${refId}</p>
          </td>
        </tr>

        <!-- Alert Badge -->
        <tr>
          <td class="mobile-padding" style="padding:24px 40px 0;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:10px 20px;">
                  <span style="color:#92400E;font-size:13px;font-weight:600;">⚡ Action requise: Contacter le client</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Audience badge -->
        <tr>
          <td class="mobile-padding" style="padding:20px 40px 0;text-align:center;">
            <span style="display:inline-block;padding:8px 24px;border-radius:20px;background:#FADADD;color:#E75480;font-size:13px;font-weight:600;">${audienceLabel}</span>
          </td>
        </tr>

        <!-- Name -->
        <tr>
          <td class="mobile-padding" style="padding:20px 40px 8px;text-align:center;">
            <h2 style="margin:0;color:#1F1F1F;font-size:26px;font-weight:700;">${r.firstName} ${r.lastName}</h2>
          </td>
        </tr>

        <!-- Details -->
        <tr>
          <td class="mobile-padding" style="padding:16px 40px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#faf8f8;border-radius:12px;overflow:hidden;">
              <tr><td colspan="2" style="padding:0 0 8px;border-bottom:1px solid #f0e8e8;"></td></tr>
              ${row('📧', 'Email', `<a href="mailto:${r.email}" style="color:#E75480;text-decoration:none;font-weight:600;">${r.email}</a>`)}
              <tr><td colspan="2" style="border-bottom:1px solid #f0e8e8;"></td></tr>
              ${row('📱', 'Téléphone', `<a href="tel:${dial}${r.phoneNumber}" style="color:#1F1F1F;text-decoration:none;">${phone}</a>`)}
              <tr><td colspan="2" style="border-bottom:1px solid #f0e8e8;"></td></tr>
              ${row('🌍', 'Pays', countryName)}
              <tr><td colspan="2" style="border-bottom:1px solid #f0e8e8;"></td></tr>
              ${r.age ? row('🎂', 'Âge', `${r.age} ans`) + '<tr><td colspan="2" style="border-bottom:1px solid #f0e8e8;"></td></tr>' : ''}
              ${row('📦', 'Pack', `<strong style="color:#E75480;">${packName}</strong>`)}
              <tr><td colspan="2" style="border-bottom:1px solid #f0e8e8;"></td></tr>
              ${row('🕐', 'Reçu le', date)}
            </table>
          </td>
        </tr>

        <!-- Quick Actions -->
        <tr>
          <td class="mobile-padding" style="padding:24px 40px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="padding:0 8px;">
                  <a href="mailto:${r.email}?subject=${responseSubject}&body=${responseBody}" style="display:inline-block;padding:14px 28px;border-radius:10px;background:#E75480;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">📧 Répondre par email</a>
                </td>
              </tr>
            </table>
            <p style="margin:16px 0 0;"><a href="https://frenchwithus.up.railway.app/admin/reservations" style="color:#E75480;font-size:13px;text-decoration:none;font-weight:500;">Voir dans le dashboard →</a></p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#faf7f7;padding:20px 24px;text-align:center;border-top:1px solid #f0e8e8;">
            <p style="margin:0;color:#aaa;font-size:11px;">French With Us — frenchwithus.up.railway.app</p>
            <p style="margin:4px 0 0;color:#ccc;font-size:10px;">Email de notification automatique • ${date}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildUserConfirmationEmail(r) {
  const packName = PACK_NAMES[r.pack] || r.pack || 'Non spécifié';
  const packDesc = PACK_DESCRIPTIONS[r.pack] || '';
  const audienceLabel = r.audience === 'adults' ? 'Adulte' : r.audience === 'children' ? 'Enfant' : '';
  const countryName = COUNTRY_NAMES[r.country] || r.country || '';
  const dial = DIAL_CODES[r.phoneCountry] || `+${r.phoneCountry}`;
  const phone = `${dial} ${r.phoneNumber}`;
  const date = new Date(r.createdAt).toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const refId = `FWU-${String(r.id).padStart(5, '0')}`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Confirmation de réservation - French With Us</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
      .mobile-center { text-align: center !important; }
      .step-number { width: 28px !important; height: 28px !important; line-height: 28px !important; font-size: 13px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f0f0;font-family:'Segoe UI','Nunito Sans',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0f0;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" class="email-container" width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(231,84,128,0.1);max-width:100%;">

        <!-- Header avec logo -->
        <tr>
          <td style="background:linear-gradient(135deg,#E75480 0%,#C2185B 100%);padding:40px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:0.5px;">🎓 French With Us</h1>
            <p style="margin:12px 0 0;color:rgba(255,255,255,0.95);font-size:15px;font-weight:500;">Votre partenaire pour apprendre le français</p>
          </td>
        </tr>

        <!-- Success Icon & Message -->
        <tr>
          <td class="mobile-padding" style="padding:40px 40px 24px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td style="width:72px;height:72px;background:linear-gradient(135deg,#D4EDDA 0%,#C3E6CB 100%);border-radius:50%;text-align:center;vertical-align:middle;">
                  <span style="font-size:32px;line-height:72px;">✓</span>
                </td>
              </tr>
            </table>
            <h2 style="margin:0 0 12px;color:#1F1F1F;font-size:26px;font-weight:700;">Merci ${r.firstName} !</h2>
            <p style="margin:0;color:#555;font-size:16px;line-height:1.6;">
              Votre demande de réservation a bien été enregistrée.<br>
              <strong style="color:#E75480;">Notre équipe vous contactera sous 24h.</strong>
            </p>
          </td>
        </tr>

        <!-- Reference Badge -->
        <tr>
          <td class="mobile-padding" style="padding:0 40px 24px;text-align:center;">
            <span style="display:inline-block;padding:10px 24px;border-radius:8px;background:#F0F4FF;border:1px solid #C7D2FE;color:#4338CA;font-size:13px;font-weight:600;">📋 Référence: ${refId}</span>
          </td>
        </tr>

        <!-- Récapitulatif complet -->
        <tr>
          <td class="mobile-padding" style="padding:0 40px 32px;">
            <div style="background:linear-gradient(180deg,#faf8f8 0%,#fff 100%);border-radius:12px;padding:24px;border:1px solid #f0e8e8;">
              <h3 style="margin:0 0 20px;color:#E75480;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">📝 Récapitulatif de votre demande</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:12px 0;color:#888;font-size:13px;border-bottom:1px solid #f0e8e8;">Nom complet</td>
                  <td style="padding:12px 0;color:#1F1F1F;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #f0e8e8;">${r.firstName} ${r.lastName}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;color:#888;font-size:13px;border-bottom:1px solid #f0e8e8;">Email</td>
                  <td style="padding:12px 0;color:#1F1F1F;font-size:14px;font-weight:500;text-align:right;border-bottom:1px solid #f0e8e8;">${r.email}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;color:#888;font-size:13px;border-bottom:1px solid #f0e8e8;">Téléphone</td>
                  <td style="padding:12px 0;color:#1F1F1F;font-size:14px;font-weight:500;text-align:right;border-bottom:1px solid #f0e8e8;">${phone}</td>
                </tr>
                ${countryName ? `
                <tr>
                  <td style="padding:12px 0;color:#888;font-size:13px;border-bottom:1px solid #f0e8e8;">Pays</td>
                  <td style="padding:12px 0;color:#1F1F1F;font-size:14px;font-weight:500;text-align:right;border-bottom:1px solid #f0e8e8;">🌍 ${countryName}</td>
                </tr>
                ` : ''}
                ${r.age ? `
                <tr>
                  <td style="padding:12px 0;color:#888;font-size:13px;border-bottom:1px solid #f0e8e8;">Âge</td>
                  <td style="padding:12px 0;color:#1F1F1F;font-size:14px;font-weight:500;text-align:right;border-bottom:1px solid #f0e8e8;">${r.age} ans</td>
                </tr>
                ` : ''}
                ${audienceLabel ? `
                <tr>
                  <td style="padding:12px 0;color:#888;font-size:13px;border-bottom:1px solid #f0e8e8;">Type</td>
                  <td style="padding:12px 0;color:#1F1F1F;font-size:14px;font-weight:500;text-align:right;border-bottom:1px solid #f0e8e8;">${audienceLabel}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding:12px 0;color:#888;font-size:13px;border-bottom:1px solid #f0e8e8;">Pack choisi</td>
                  <td style="padding:12px 0;color:#E75480;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #f0e8e8;">${packName}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;color:#888;font-size:13px;">Date de demande</td>
                  <td style="padding:12px 0;color:#1F1F1F;font-size:14px;font-weight:500;text-align:right;">${date}</td>
                </tr>
              </table>
              ${packDesc ? `
              <div style="margin-top:16px;padding:12px 16px;background:#FDF2F8;border-radius:8px;border-left:3px solid #E75480;">
                <p style="margin:0;color:#831843;font-size:13px;line-height:1.5;"><strong>📦 ${packName}:</strong> ${packDesc}</p>
              </div>
              ` : ''}
            </div>
          </td>
        </tr>

        <!-- Prochaines étapes -->
        <tr>
          <td class="mobile-padding" style="padding:0 40px 32px;">
            <h3 style="margin:0 0 20px;color:#1F1F1F;font-size:18px;font-weight:700;">🚀 Prochaines étapes</h3>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:16px 0;vertical-align:top;width:40px;">
                  <div class="step-number" style="width:32px;height:32px;background:linear-gradient(135deg,#E75480 0%,#C2185B 100%);border-radius:50%;color:#fff;font-size:14px;font-weight:700;text-align:center;line-height:32px;">1</div>
                </td>
                <td style="padding:16px 0 16px 16px;color:#555;font-size:14px;line-height:1.6;border-bottom:1px solid #f5f0f0;">
                  <strong style="color:#1F1F1F;font-size:15px;">📞 Confirmation par téléphone</strong><br>
                  <span style="color:#666;">Un membre de notre équipe vous appellera pour discuter de vos objectifs d'apprentissage et répondre à vos questions.</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0;vertical-align:top;width:40px;">
                  <div class="step-number" style="width:32px;height:32px;background:linear-gradient(135deg,#E75480 0%,#C2185B 100%);border-radius:50%;color:#fff;font-size:14px;font-weight:700;text-align:center;line-height:32px;">2</div>
                </td>
                <td style="padding:16px 0 16px 16px;color:#555;font-size:14px;line-height:1.6;border-bottom:1px solid #f5f0f0;">
                  <strong style="color:#1F1F1F;font-size:15px;">📅 Planification de votre cours</strong><br>
                  <span style="color:#666;">Ensemble, nous définirons un horaire adapté à votre disponibilité et à votre fuseau horaire.</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0;vertical-align:top;width:40px;">
                  <div class="step-number" style="width:32px;height:32px;background:linear-gradient(135deg,#E75480 0%,#C2185B 100%);border-radius:50%;color:#fff;font-size:14px;font-weight:700;text-align:center;line-height:32px;">3</div>
                </td>
                <td style="padding:16px 0 16px 16px;color:#555;font-size:14px;line-height:1.6;">
                  <strong style="color:#1F1F1F;font-size:15px;">🎉 Début de votre aventure</strong><br>
                  <span style="color:#666;">Commencez vos cours de français avec nos professeurs qualifiés et passionnés !</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Contact CTA -->
        <tr>
          <td class="mobile-padding" style="padding:0 40px 32px;text-align:center;">
            <div style="background:linear-gradient(180deg,#FDF2F8 0%,#FCE7F3 100%);border-radius:12px;padding:24px;border:1px solid #FBCFE8;">
              <p style="margin:0 0 16px;color:#831843;font-size:15px;font-weight:500;">Des questions ? Nous sommes là pour vous aider !</p>
              <a href="mailto:frenchwithus.edu@gmail.com" style="display:inline-block;padding:14px 32px;border-radius:10px;background:linear-gradient(135deg,#E75480 0%,#C2185B 100%);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(231,84,128,0.3);">📧 frenchwithus.edu@gmail.com</a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:linear-gradient(180deg,#faf7f7 0%,#f5f0f0 100%);padding:28px 24px;text-align:center;border-top:1px solid #f0e8e8;">
            <p style="margin:0 0 8px;color:#E75480;font-size:16px;font-weight:700;">French With Us</p>
            <p style="margin:0 0 12px;color:#888;font-size:13px;">Apprenez le français avec passion 🇫🇷</p>
            <p style="margin:0 0 16px;color:#aaa;font-size:12px;">
              <a href="https://frenchwithus.up.railway.app" style="color:#E75480;text-decoration:none;font-weight:500;">frenchwithus.up.railway.app</a>
            </p>
            <div style="border-top:1px solid #e8e0e0;padding-top:16px;margin-top:8px;">
              <p style="margin:0;color:#bbb;font-size:10px;line-height:1.6;">
                Cet email a été envoyé suite à votre demande de réservation (${refId}).<br>
                Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer ce message.
              </p>
            </div>
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

  const refId = `FWU-${String(reservation.id).padStart(5, '0')}`;
  const dial = DIAL_CODES[reservation.phoneCountry] || `+${reservation.phoneCountry}`;
  const phone = `${dial} ${reservation.phoneNumber}`;
  const packName = PACK_NAMES[reservation.pack] || reservation.pack || 'Non spécifié';
  const countryName = COUNTRY_NAMES[reservation.country] || reservation.country || '';
  const audienceLabel = reservation.audience === 'adults' ? 'Adulte' : reservation.audience === 'children' ? 'Enfant' : '';

  // Send both emails
  const emailPromises = [];

  // 1. Email de notification à l'admin (French With Us)
  const contactEmail = getContactEmail();
  if (contactEmail) {
    console.log('[Reservation] Sending admin notification to:', contactEmail);
    const adminTextContent = `
🎓 NOUVELLE RÉSERVATION - FRENCH WITH US
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Référence: ${refId}

👤 INFORMATIONS CLIENT
━━━━━━━━━━━━━━━━━━━━━
• Nom: ${reservation.firstName} ${reservation.lastName}
• Email: ${reservation.email}
• Téléphone: ${phone}
• Pays: ${countryName || 'Non spécifié'}
${reservation.age ? `• Âge: ${reservation.age} ans` : ''}
${audienceLabel ? `• Type: ${audienceLabel}` : ''}

📦 PACK CHOISI
━━━━━━━━━━━━━
${packName}

⚡ ACTION REQUISE: Contacter le client

🔗 Dashboard: https://frenchwithus.up.railway.app/admin/reservations

---
Email automatique - French With Us
    `.trim();

    emailPromises.push(
      sendMail({
        to: contactEmail,
        subject: `🔔 [Réservation ${refId}] ${reservation.firstName} ${reservation.lastName} - ${packName}`,
        html: buildNotificationEmail(reservation),
        text: adminTextContent,
      }).then(result => {
        console.log('[Reservation] ✓ Admin email result:', result);
        return { type: 'admin', ...result };
      }).catch((err) => {
        console.error('[Reservation] ✗ Admin email failed:', err.message);
        return { type: 'admin', error: err.message };
      })
    );
  }

  // 2. Email de confirmation à l'utilisateur
  // NOTE: Désactivé car Resend sandbox ne peut envoyer qu'à l'email vérifié (admin)
  // Pour activer: vérifier un domaine sur resend.com
  console.log('[Reservation] User confirmation email skipped (Resend sandbox mode)');

  // Wait for all emails to be sent (don't block the response too long)
  if (emailPromises.length > 0) {
    Promise.all(emailPromises).then(results => {
      console.log('[Reservation] All emails processed:', JSON.stringify(results));
    });
  }

  res.status(201).json(reservation);
});

// Simple config check endpoint (no email parameter needed)
router.get('/email-config', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config: {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? '✓ SET' : '✗ NOT SET',
      CONTACT_EMAIL: process.env.CONTACT_EMAIL || 'NOT SET',
    },
    note: 'Resend sandbox mode: only admin receives emails. Verify a domain on resend.com to send to users.'
  });
});

// Test email endpoint
router.get('/test-email', async (req, res) => {
  const testEmail = req.query.email;
  
  console.log('[Test Email] Endpoint called');
  console.log('[Test Email] GMAIL_USER:', process.env.GMAIL_USER);
  console.log('[Test Email] GMAIL_APP_PASS length:', process.env.GMAIL_APP_PASS?.length);
  console.log('[Test Email] Test email to:', testEmail);
  
  if (!testEmail) {
    return res.json({ 
      error: 'Add ?email=your@email.com to test (must be your Resend account email in sandbox mode)',
      example: '/api/test-email?email=YOUR_RESEND_ACCOUNT_EMAIL',
      config: {
        RESEND_API_KEY: process.env.RESEND_API_KEY ? '✓ SET' : '✗ NOT SET',
        CONTACT_EMAIL: process.env.CONTACT_EMAIL || 'NOT SET',
      },
      note: 'Resend sandbox can ONLY send to the email you used to create your Resend account'
    });
  }

  try {
    console.log('[Test Email] Calling sendMail...');
    const result = await sendMail({
      to: testEmail,
      subject: '✅ Test Email - French With Us',
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;background:#f5f0f0;">
          <div style="max-width:500px;margin:0 auto;background:#fff;padding:30px;border-radius:12px;">
            <h1 style="color:#E75480;margin:0 0 20px;">🎉 Email Working!</h1>
            <p style="color:#333;font-size:16px;">This is a test email from French With Us.</p>
            <p style="color:#666;font-size:14px;">If you received this, your email system is configured correctly!</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
            <p style="color:#999;font-size:12px;">Sent at: ${new Date().toISOString()}</p>
          </div>
        </div>
      `,
      text: 'Test email from French With Us. If you received this, email is working!',
    });

    console.log('[Test Email] Result:', JSON.stringify(result));

    const success = result.results && result.results.length > 0;
    res.json({
      success,
      message: success ? `✓ Email sent via: ${result.results.join(', ')}` : '✗ No email sent',
      sentTo: testEmail,
      providers: result.results || [],
      errors: result.errors || [],
    });
  } catch (err) {
    console.error('[Test Email] Error:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack,
    });
  }
});

export default router;
