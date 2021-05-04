const event = {
  id: 'test-event-id',
  checkoutSuccess: 'https://that.us/testing/success/',
};

const product = {
  eventActivities: ['FOOD', 'CAMPER', 'PRE_CONFERENCE'],
  uiReference: 'CAMPER',
};
const product2 = {
  eventActivities: ['FAMILY'],
  uiReference: 'SWAG',
};
const orderAllocationId = 'test-allocation-id';

describe('Test Order Allocation Success URL creation with parameters', () => {
  let originalEnv = process.env;
  let genUrl;

  beforeAll(() => {
    jest.resetModules();
    process.env = { ...originalEnv }; // puts a copy on process.env

    // Required for @thatconference/api
    process.env.INFLUX_TOKEN = 'TEST_INFLUX_TOKEN_VALUE';
    process.env.INFLUX_ORG_ID = 'TEST_INFLUX_ORG_ID_VALUE';
    process.env.INFLUX_BUCKET_ID = 'INFLUX_BUCKET_ID';
    process.env.INFLUX_HOST = 'INFLUX_HOST';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    //import { orderAllocationSuccessUrlWithParams as genUrl } from '../fetchAllocationsQuestionsLink';
    const fetchAllocationsQuestionsLink = require('../fetchAllocationsQuestionsLink');
    genUrl = fetchAllocationsQuestionsLink.orderAllocationSuccessUrlWithParams;
  });

  describe('Missing parameters will throw', () => {
    it('Will throw without event', () => {
      expect(() => genUrl({ product, orderAllocationId })).toThrow(
        'event is a required parameter as an object',
      );
    });
    it('Will throw without product', () => {
      expect(() => genUrl({ event, orderAllocationId })).toThrow(
        'product is a required parameter as an object',
      );
    });
    it('will throw if product is not an object', () => {
      expect(() =>
        genUrl({ event, product: 'test-string', orderAllocationId }),
      ).toThrow('product is a required parameter as an object');
    });
    it('will throw if event is not an object', () => {
      expect(() =>
        genUrl({ event: 'test-string', product, orderAllocationId }),
      ).toThrow('event is a required parameter as an object');
    });
    it('Will throw without allocationId', () => {
      expect(() => genUrl({ event, product })).toThrow(
        'orderAllocationId is a required parameter',
      );
    });
  });
  describe('Generate correct URL parameters', () => {
    let u;
    it('will create correct camper url', () => {
      const url = genUrl({ event, product, orderAllocationId });
      u = new URL(url);
      const params = [];
      u.searchParams.forEach((v, k) => params.push(k));
      expect(params.length).toBe(5);
      product.eventActivities.forEach(a =>
        expect(params.includes(a)).toBe(true),
      );
    });
    it('paramters will contain eventId', () =>
      expect(u.searchParams.get('eventId')).toBe(event.id));
    it('parameters will contain orderReference', () =>
      expect(u.searchParams.get('orderReference')).toBe(orderAllocationId));
  });
  describe('swag allocation', () => {
    it('will return SWAG paramter', () => {
      const url = genUrl({ event, product: product2, orderAllocationId });
      const u = new URL(url);
      expect(u.searchParams.get('SWAG')).toBe('1');
    });
  });
});
