/**
 * French words & phrases for the floating "word of the moment" feature on the homepage.
 * Each term includes the French original and translations for the user's interface language.
 */
export const FRENCH_WORDS = [
  { french: 'Bonjour', en: 'Hello', fr: 'Bonjour', ar: 'مرحبا', zh: '你好', category: 'greeting' },
  { french: 'Merci', en: 'Thank you', fr: 'Merci', ar: 'شكراً', zh: '谢谢', category: 'courtesy' },
  { french: "S'il vous plaît", en: 'Please', fr: "S'il vous plaît", ar: 'من فضلك', zh: '请', category: 'courtesy' },
  { french: 'Au revoir', en: 'Goodbye', fr: 'Au revoir', ar: 'مع السلامة', zh: '再见', category: 'greeting' },
  { french: 'Enchanté(e)', en: 'Nice to meet you', fr: 'Enchanté(e)', ar: 'تشرفت بمقابلتك', zh: '很高兴认识你', category: 'greeting' },
  { french: 'De rien', en: "You're welcome", fr: 'De rien', ar: 'على الرحب والسعة', zh: '不客气', category: 'courtesy' },
  { french: 'Excusez-moi', en: 'Excuse me', fr: 'Excusez-moi', ar: 'عفواً', zh: '打扰一下', category: 'courtesy' },
  { french: 'Parfait', en: 'Perfect', fr: 'Parfait', ar: 'ممتاز', zh: '完美', category: 'expression' },
  { french: 'Comment allez-vous ?', en: 'How are you?', fr: 'Comment allez-vous ?', ar: 'كيف حالك؟', zh: '你好吗？', category: 'phrase' },
  { french: 'Je m\'appelle...', en: "My name is...", fr: "Je m'appelle...", ar: 'اسمي...', zh: '我叫...', category: 'phrase' },
  { french: 'Bonne journée', en: 'Have a nice day', fr: 'Bonne journée', ar: 'أتمنى لك يوماً سعيداً', zh: '祝你今天愉快', category: 'phrase' },
  { french: 'À bientôt', en: 'See you soon', fr: 'À bientôt', ar: 'أراك قريباً', zh: '回头见', category: 'phrase' },
  { french: 'Bien sûr', en: 'Of course', fr: 'Bien sûr', ar: 'بالتأكيد', zh: '当然', category: 'expression' },
  { french: 'Pas de problème', en: 'No problem', fr: 'Pas de problème', ar: 'لا مشكلة', zh: '没问题', category: 'expression' },
  { french: 'C\'est magnifique', en: "It's magnificent", fr: "C'est magnifique", ar: 'إنه رائع', zh: '太棒了', category: 'expression' },
  { french: 'Je ne comprends pas', en: "I don't understand", fr: "Je ne comprends pas", ar: 'لا أفهم', zh: '我不明白', category: 'phrase' },
  { french: 'Pouvez-vous répéter ?', en: 'Can you repeat?', fr: 'Pouvez-vous répéter ?', ar: 'هل يمكنك التكرار؟', zh: '你能重复一下吗？', category: 'phrase' },
  { french: 'Comment dit-on... ?', en: 'How do you say...?', fr: 'Comment dit-on... ?', ar: 'كيف تقول...؟', zh: '怎么说...？', category: 'phrase' },
  { french: 'Très bien', en: 'Very well', fr: 'Très bien', ar: 'جيد جداً', zh: '很好', category: 'expression' },
  { french: 'Bon courage', en: 'Good luck / Hang in there', fr: 'Bon courage', ar: 'حظاً سعيداً', zh: '加油', category: 'phrase' },
  { french: 'Félicitations', en: 'Congratulations', fr: 'Félicitations', ar: 'تهانينا', zh: '恭喜', category: 'expression' },
  { french: 'À votre santé', en: 'Cheers (to your health)', fr: 'À votre santé', ar: 'بصحتك', zh: '干杯', category: 'phrase' },
  { french: 'C\'est la vie', en: "That's life", fr: "C'est la vie", ar: 'هذه هي الحياة', zh: '这就是生活', category: 'expression' },
  { french: 'Rendez-vous', en: 'Appointment / See you', fr: 'Rendez-vous', ar: 'موعد', zh: '约会', category: 'word' },
  { french: 'Profiter', en: 'To enjoy / To make the most of', fr: 'Profiter', ar: 'استمتاع', zh: '享受', category: 'word' },
];

export function getRandomFrenchWord() {
  return FRENCH_WORDS[Math.floor(Math.random() * FRENCH_WORDS.length)];
}

export function getTranslation(word, lang) {
  const lng = (lang || 'en').slice(0, 2);
  if (lng === 'fr') return word.fr;
  if (lng === 'ar') return word.ar;
  if (lng === 'zh') return word.zh;
  return word.en;
}
