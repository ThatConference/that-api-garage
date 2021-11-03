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
  stripeSuccessUrl: process.env.STRIPE_SUCCESS_URL || 'https://that.us/',
  stripeCancelUrl: process.env.STRIPE_CANCEL_URL || 'https://that.us/',
  stripePortalReturnUrl:
    process.env.STRIPE_PORTAL_RETURN_URL || 'https://that.us/',
  bouncerBaseUrl:
    process.env.BOUNCER_BASE_URL || configMissing('BOUNCER_BASE_URL'),
  devSendOrderSpeakerRequest:
    JSON.parse(process.env.DEV_SEND_ORDER_SPEAKER_REQUEST || false) || false,
});

export default requiredConfig();
