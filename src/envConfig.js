function configMissing(configKey) {
  throw new Error(`missing required .env setting for ${configKey}`);
}

const requiredConfig = () => ({
  postmarkApiToken:
    process.env.POSTMARK_API_TOKEN || configMissing('POSTMARK_API_TOKEN'),
  defaultProfileImage:
    'https://images.that.tech/members/person-placeholder.jpg',
  stripePublishableKey:
    process.env.STRIPE_PUBLISHABLE_KEY ||
    configMissing('STRIPE_PUBLISHABLE_KEY'),
  stripeSecretKey:
    process.env.STRIPE_SECRET_KEY || configMissing('STRIPE_SECRET_KEY'),
});

export default requiredConfig();
