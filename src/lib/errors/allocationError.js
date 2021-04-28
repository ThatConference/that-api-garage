export default class AllocationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AllocationError';
  }
}
