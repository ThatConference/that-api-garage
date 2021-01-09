export default class CheckoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CheckoutError';
  }
}
