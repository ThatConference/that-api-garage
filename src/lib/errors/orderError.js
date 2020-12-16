export default class OrderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OrderError';
  }
}
