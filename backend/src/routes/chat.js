import { Router } from 'express';

const router = Router();

const SYSTEM_PROMPT = `Tu es l'assistant virtuel de French With Us (French with Me), une plateforme d'apprentissage du français en ligne.
Tu réponds de manière professionnelle, chaleureuse et concise aux questions sur :
- Les cours de français (individuels, groupes, niveaux A1 à C1)
- Les tarifs et formules (séance d'essai gratuite, abonnements)
- L'inscription et le déroulement des séances
- La méthode pédagogique (oral, grammaire, culture francophone)
- Les professeurs et l'accompagnement personnalisé

Si tu ne connais pas une information précise (ex: tarif exact), invite poliment l'utilisateur à contacter l'équipe par email (frenchwithus.noreply@gmail.com) ou via le bouton "Écrivez-nous" sur le site.
Réponds dans la même langue que l'utilisateur.`;

// Fallback responses when OpenAI is not configured (keyword-based)
const FALLBACK_RESPONSES = {
  fr: {
    tarif: "Nos tarifs varient selon la formule (cours individuels ou en groupe). Pour connaître les prix actuels, n'hésitez pas à nous écrire à frenchwithus.noreply@gmail.com ou à cliquer sur « Écrivez-nous » sur notre site. Nous vous répondrons rapidement !",
    prix: "Nos tarifs varient selon la formule (cours individuels ou en groupe). Pour connaître les prix actuels, n'hésitez pas à nous écrire à frenchwithus.noreply@gmail.com ou à cliquer sur « Écrivez-nous » sur notre site. Nous vous répondrons rapidement !",
    inscription: "Pour vous inscrire, cliquez sur « Connexion » ou « Commencer » sur notre site, créez un compte, puis réservez une séance d'essai gratuite. Notre équipe vous contactera pour organiser votre premier cours !",
    niveau: "Nous proposons tous les niveaux du CECRL : A1 (débutant), A2 (élémentaire), B1 (intermédiaire), B2 (avancé) et C1 (autonome). Chaque élève est évalué pour être placé dans le bon niveau.",
    essai: "Oui ! Nous proposons une séance d'essai gratuite pour découvrir notre méthode et faire connaissance avec un professeur. Cliquez sur « Commencer » pour réserver votre créneau.",
    cours: "Nos cours sont individuels ou en petits groupes. Chaque séance combine expression orale, grammaire et culture francophone, adaptée à votre niveau et vos objectifs.",
    durée: "Les cours durent généralement 1 heure. La durée peut être adaptée selon vos besoins et votre formule.",
    default: "Merci pour votre question ! Pour une réponse personnalisée, n'hésitez pas à nous écrire à frenchwithus.noreply@gmail.com ou à cliquer sur « Écrivez-nous » sur notre site. Notre équipe vous répondra avec plaisir.",
  },
  en: {
    price: "Our prices vary depending on the format (individual or group lessons). For current rates, please email us at frenchwithus.noreply@gmail.com or click « Write to us » on our site. We'll get back to you quickly!",
    signup: "To sign up, click « Login » or « Get started » on our site, create an account, then book a free trial session. Our team will contact you to schedule your first lesson!",
    level: "We offer all CEFR levels: A1 (beginner), A2 (elementary), B1 (intermediate), B2 (advanced) and C1 (autonomous). Each student is assessed to be placed at the right level.",
    trial: "Yes! We offer a free trial session to discover our method and meet a teacher. Click « Get started » to book your slot.",
    default: "Thank you for your question! For a personalized answer, please email us at frenchwithus.noreply@gmail.com or click « Write to us » on our site. Our team will be happy to help.",
  },
};

function getFallbackReply(content, lang = 'fr') {
  const lower = content.toLowerCase();
  const responses = FALLBACK_RESPONSES[lang] || FALLBACK_RESPONSES.fr;
  for (const [key, reply] of Object.entries(responses)) {
    if (key !== 'default' && lower.includes(key)) return reply;
  }
  return responses.default;
}

router.post('/chat', async (req, res) => {
  const { messages } = req.body || {};
  const lastMsg = Array.isArray(messages) && messages.length > 0
    ? messages[messages.length - 1]
    : null;
  const userContent = lastMsg?.content?.trim() || '';

  if (!userContent) {
    return res.status(400).json({ error: 'Message requis' });
  }

  const lang = (req.headers['accept-language'] || 'fr').slice(0, 2);

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...(messages || []).map((m) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 400,
      });
      const reply = completion.choices?.[0]?.message?.content?.trim();
      return res.json({ reply: reply || getFallbackReply(userContent, lang) });
    }
  } catch (err) {
    console.error('OpenAI chat error:', err.message);
  }

  // Fallback when no API key or on error
  const reply = getFallbackReply(userContent, lang);
  return res.json({ reply });
});

export default router;
