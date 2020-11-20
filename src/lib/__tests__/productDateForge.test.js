// Required for @thatconference/api
process.env.INFLUX_TOKEN = 'TEST_INFLUX_TOKEN_VALUE';
process.env.INFLUX_ORG_ID = 'TEST_INFLUX_ORG_ID_VALUE';
process.env.INFLUX_BUCKET_ID = 'INFLUX_BUCKET_ID';
process.env.INFLUX_HOST = 'INFLUX_HOST';

const productDateForge = require('../productDateForge').productDateForge;

const product = {
  name: 'Our testing product',
  description: 'a product object used for testing',
  type: 'TICKET',
  createdAt: '2020-11-20T15:03:35.219Z',
  createdBy: 'auth0|0',
  lastUpdatedAt: '2020-11-20T15:03:35.219Z',
  lastUpdatedBy: 'auth0|0',
};

const copy = {
  ...product,
};

describe('productDateForge test', () => {
  describe('productDateForge should not mutate non-date fields', () => {
    it('type, createdBy and lastUpdatedBy will remain the same', () => {
      const forged = productDateForge(product);
      expect(forged.type).toBe(copy.type);
      expect(forged.createdBy).toBe(copy.createdBy);
      expect(forged.lastUpdatedBy).toBe(copy.lastUpdatedBy);
    });
  });

  describe('string dates will return as Date types', () => {
    const forged = productDateForge(product);
    expect(forged.createdAt).toBeInstanceOf(Date);
    expect(forged.lastUpdatedAt).toBeInstanceOf(Date);
  });

  describe('string dates will be the correct date', () => {
    const forged = productDateForge(product);
    expect(forged.createdAt).toStrictEqual(new Date(copy.createdAt));
    expect(forged.lastUpdatedAt).toStrictEqual(new Date(copy.lastUpdatedAt));
  });
});
