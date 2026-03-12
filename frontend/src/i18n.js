import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fr from './locales/fr.json';
import en from './locales/en.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';

const STORAGE_KEY = 'frenchwithus-lang';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      zh: { translation: zh },
      ar: { translation: ar },
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en', 'zh', 'ar'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

const applyRtl = (lng) => {
  const isRtl = (lng || '').slice(0, 2) === 'ar';
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = isRtl ? 'ar' : (lng || 'en');
};

i18n.on('languageChanged', (lng) => {
  applyRtl(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch (_) {}
});

i18n.on('initialized', () => {
  applyRtl(i18n.language);
});

export default i18n;
