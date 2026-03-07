/**
 * Pays avec indicatif téléphonique pour le sélecteur de la réservation.
 * Ordre: Maroc en premier, puis France, puis alphabétique par nom.
 */
export const COUNTRY_DIAL_CODES = [
  { code: 'MA', name: 'Maroc', dialCode: '+212' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'DZ', name: 'Algérie', dialCode: '+213' },
  { code: 'BE', name: 'Belgique', dialCode: '+32' },
  { code: 'BR', name: 'Brésil', dialCode: '+55' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'CA-W', name: 'Canada (Ouest)', dialCode: '+1' },
  { code: 'CN', name: 'Chine', dialCode: '+86' },
  { code: 'CI', name: "Côte d'Ivoire", dialCode: '+225' },
  { code: 'EG', name: 'Égypte', dialCode: '+20' },
  { code: 'AE', name: 'Émirats arabes unis', dialCode: '+971' },
  { code: 'US', name: 'États-Unis', dialCode: '+1' },
  { code: 'US-C', name: 'États-Unis (Centre)', dialCode: '+1' },
  { code: 'US-W', name: 'États-Unis (Ouest)', dialCode: '+1' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44' },
  { code: 'DE', name: 'Allemagne', dialCode: '+49' },
  { code: 'GH', name: 'Ghana', dialCode: '+233' },
  { code: 'IN', name: 'Inde', dialCode: '+91' },
  { code: 'IT', name: 'Italie', dialCode: '+39' },
  { code: 'JP', name: 'Japon', dialCode: '+81' },
  { code: 'JO', name: 'Jordanie', dialCode: '+962' },
  { code: 'KW', name: 'Koweït', dialCode: '+965' },
  { code: 'LB', name: 'Liban', dialCode: '+961' },
  { code: 'MX', name: 'Mexique', dialCode: '+52' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'QA', name: 'Qatar', dialCode: '+974' },
  { code: 'CD', name: 'RD Congo', dialCode: '+243' },
  { code: 'SA', name: 'Arabie Saoudite', dialCode: '+966' },
  { code: 'SN', name: 'Sénégal', dialCode: '+221' },
  { code: 'KR', name: 'Corée du Sud', dialCode: '+82' },
  { code: 'ES', name: 'Espagne', dialCode: '+34' },
  { code: 'CH', name: 'Suisse', dialCode: '+41' },
  { code: 'TN', name: 'Tunisie', dialCode: '+216' },
  { code: 'TR', name: 'Turquie', dialCode: '+90' },
  { code: 'AU', name: 'Australie', dialCode: '+61' },
  { code: 'NZ', name: 'Nouvelle-Zélande', dialCode: '+64' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237' },
  { code: 'AF', name: 'Afghanistan', dialCode: '+93' },
  { code: 'AL', name: 'Albanie', dialCode: '+355' },
  { code: 'AD', name: 'Andorre', dialCode: '+376' },
  { code: 'AO', name: 'Angola', dialCode: '+244' },
  { code: 'AR', name: 'Argentine', dialCode: '+54' },
  { code: 'AT', name: 'Autriche', dialCode: '+43' },
  { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'NL', name: 'Pays-Bas', dialCode: '+31' },
  { code: 'PL', name: 'Pologne', dialCode: '+48' },
  { code: 'RU', name: 'Russie', dialCode: '+7' },
  { code: 'SE', name: 'Suède', dialCode: '+46' },
  { code: 'ZA', name: 'Afrique du Sud', dialCode: '+27' },
];

export function getDialCode(countryCode) {
  return COUNTRY_DIAL_CODES.find((c) => c.code === countryCode)?.dialCode ?? '+33';
}

export function getCountryName(countryCode) {
  return COUNTRY_DIAL_CODES.find((c) => c.code === countryCode)?.name ?? countryCode;
}
