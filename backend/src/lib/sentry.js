/**
 * Sentry – monitoring des erreurs (optionnel).
 * Activer en définissant SENTRY_DSN dans les variables d'environnement.
 * Installer: npm install @sentry/node
 * https://docs.sentry.io/platforms/javascript/guides/express/
 */
let captureExceptionFn = null;

export async function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || !dsn.startsWith('https://')) return;
  try {
    const Sentry = (await import('@sentry/node')).default;
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
    });
    captureExceptionFn = (err) => Sentry.captureException(err);
    console.log('Sentry initialized');
  } catch {
    console.warn('Sentry: @sentry/node not installed. Run: npm install @sentry/node');
  }
}

export function captureException(err) {
  if (captureExceptionFn) captureExceptionFn(err);
}
