function configMissing(configKey) {
  throw new Error(`missing required .env setting for ${configKey}`);
}

const requiredConfig = () => ({
  postmarkApiToken:
    process.env.POSTMARK_API_TOKEN || configMissing('POSTMARK_API_TOKEN'),
  defaultProfileImage:
    'https://images.that.tech/members/person-placeholder.jpg',
  stripe: {
    apiVersion: '2020-08-27',
    publishableKey:
      process.env.STRIPE_PUBLISHABLE_KEY ||
      configMissing('STRIPE_PUBLISHABLE_KEY'),
    secretKey:
      process.env.STRIPE_SECRET_KEY || configMissing('STRIPE_SECRET_KEY'),
    successUrl: process.env.STRIPE_SUCCESS_URL || 'https://that.us/',
    cancelUrl: process.env.STRIPE_CANCEL_URL || 'https://that.us/',
    portalReturnUrl: process.env.STRIPE_PORTAL_RETURN_URL || 'https://that.us/',
  },
  bouncerBaseUrl:
    process.env.BOUNCER_BASE_URL || configMissing('BOUNCER_BASE_URL'),
  thatRequestSigningKey:
    process.env.THAT_REQUEST_SIGNING_KEY ||
    configMissing('THAT_REQUEST_SIGNING_KEY'),
  devSendOrderSpeakerRequest:
    JSON.parse(process.env.DEV_SEND_ORDER_SPEAKER_REQUEST || false) || false,
});

export default requiredConfig();
