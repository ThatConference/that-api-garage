import claimOrderChecks from '../claimOrderChecks';

const processorThat = {
  checkoutMode: 'PAYMENT',
  itemRefId: 'itemRef_a',
  processor: 'THAT',
};
const processorThat2 = {
  checkoutMode: 'THAT',
  itemRefId: 'ItemRef_b',
  processor: 'THAT',
};
const processorStripeP = {
  checkoutMode: 'PAYMENT',
  itemRefId: 'price_abc123',
  processor: 'STRIPE',
};
const productsObj = [
  {
    id: 'productId_0',
    name: 'test ticket product',
    eventId: 'test_eventId',
    isEnabled: true,
    isClaimable: true,
    uiReference: 'CLAIMABLE_TICKET',
  },
  {
    id: 'productId_1',
    name: 'test ticket product',
    eventId: 'test_eventId',
    isEnabled: true,
    uiReference: 'CLAIMABLE_TICKET',
  },
];
const productIdsObj = ['productId_0', 'productId_1'];
const eventId = 'event_1';

describe('claimORderChecks tests', () => {
  let products;
  let productIds;

  beforeEach(() => {
    products = [...productsObj];
    products[0].processor = processorThat;
    products[1].processor = processorThat2;
    productIds = [...productIdsObj];
  });
  afterEach(() => {
    products = null;
    productIds = null;
  });

  describe('product settings and quantities are valid', () => {
    describe('Only 1 product in the order', () => {
      let result;
      it('will be in error with more than 1 product', () => {
        productIds.pop();
        result = claimOrderChecks({ products, productIds, eventId });
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toBe(`Claim orders must have exactly 1 line item`);
      });
      it('will be in error with more than 1 productIds', () => {
        productIds.pop();
        result = claimOrderChecks({ products, productIds, eventId });
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toBe(`Claim orders must have exactly 1 line item`);
      });
      it('will be in error with no product', () => {
        products = [];
        productIds.pop();
        result = claimOrderChecks({ products, productIds, eventId });
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toBe(`Claim orders must have exactly 1 line item`);
      });
      it('will be in error with no productIds', () => {
        products.pop();
        productIds = [];
        result = claimOrderChecks({ products, productIds, eventId });
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toBe(`Claim orders must have exactly 1 line item`);
      });
      it('no set processor will error', () => {
        products.pop();
        productIds.pop();
        delete products[0].processor;
        result = claimOrderChecks({ products, productIds, eventId });
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toBe(`Only THAT processed products can be claimed`);
      });
      it('will be in error with strip processor', () => {
        products.pop();
        productIds.pop();
        products[0].processor = processorStripeP;
        result = claimOrderChecks({ products, productIds, eventId });
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toBe(`Only THAT processed products can be claimed`);
      });
    });
    describe('Product must be claimable', () => {
      let result;
      it('will pass with 1 claimable product', () => {
        products.pop();
        productIds.pop();
        result = claimOrderChecks({ products, productIds, eventId });
        expect(result.length).toBe(0);
      });
      it('will be in error with non-claimable product', () => {
        products = [products[1]];
        productIds = [productIds[1]];
        result = claimOrderChecks({ products, productIds, eventId });
        expect(result.length).toBe(1);
        expect(result[0]).toBe(`Product on order is not a claimable product`);
      });
      it('will have uiReference of CLAIMABLE_TICKET', () => {
        products.pop();
        productIds.pop();
        products[0].uiReference = 'camper';
        result = claimOrderChecks({ products, productIds, eventId });
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toBe(`Product uiReference not CLAIMABLE_TICKET.`);
      });
    });
  });
});
