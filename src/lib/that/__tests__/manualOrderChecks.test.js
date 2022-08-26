import product from '../../../dataSources/cloudFirestore/product';
import manualOrderChecks from '../manualOrderChecks';

const productsObj = [
  {
    id: 'productId_0',
    name: 'test ticket product',
    eventId: 'test_eventId',
    isEnabled: true,
    isClaimable: true,
  },
  {
    id: 'productId_1',
    name: 'test ticket product',
    eventId: 'test_eventId',
    isEnabled: true,
  },
];
const productIdsObj = ['productId_0', 'productId_1'];
let eventId = 'test_eventId';

describe('claimORderChecks tests', () => {
  let products;
  let productIds;

  beforeEach(() => {
    products = [...productsObj];
    productIds = [...productIdsObj];
  });
  afterEach(() => {
    products = null;
    productIds = null;
    eventId = 'test_eventId';
  });

  describe('prodcut settings and quantities are valid', () => {
    describe('Valid product list passes', () => {
      let result;
      it('will pass with known good product list and matching ids', () => {
        result = manualOrderChecks({ products, productIds, eventId });
        expect(result.length).toBe(0);
      });
    });
    describe('product and id counts to match', () => {
      let result;
      it('will be in error if product < productIds length', () => {
        products.pop();
        result = manualOrderChecks({ products, productIds, eventId });
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toBe(
          `Not all products in manual order found in product collection`,
        );
      });
      it('will be in error if product > productIds length', () => {
        productIds.pop();
        result = manualOrderChecks({ products, productIds, eventId });
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toBe(
          `Not all products in manual order found in product collection`,
        );
      });
    });
    describe('Products must be part of same event', () => {
      let result;
      it(`will be in error if event Id doesn't match`, () => {
        eventId = 'someOtherEventId';
        result = manualOrderChecks({ products, productIds, eventId });
        expect(result.length).toBe(1);
        expect(result[0]).toBe(
          `Product(s) in manual order which don't exist in eventId someOtherEventId`,
        );
      });
    });
    describe('Products cannot be of type MEMBERSHIP', () => {
      let result;
      it('will be in error with a membership product', () => {
        products[0].type = 'MEMBERSHIP';
        result = manualOrderChecks({ products, productIds, eventId });
        expect(result.length).toBe(1);
        expect(result[0]).toBe(
          `'MEMBERSHIP' type products cannot be added to manual orders`,
        );
      });
    });
  });
});
