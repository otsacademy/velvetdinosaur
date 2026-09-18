/** Server configuration is authoritative; request Host headers cannot enable sending. */
export function assertNewsletterSendingAllowed(env: NodeJS.ProcessEnv = process.env) {
  if (env.VD_DEMO_SITE?.trim().toLowerCase() === 'true' && env.NEWSLETTER_ALLOW_DEMO_SEND?.trim().toLowerCase() !== 'true') {
    throw new Error('Real newsletter sending is disabled on demo sites. Drafts and previews remain available.');
  }
}
