// Validates passed in product types are valid
import debug from 'debug';

const dlog = debug('that:api:garage:validateSpeakerProducts');

export default function validateEventSpeakerProducts(products) {
  dlog('validateEventSpeakerProduct called on products %o', products);
  const result = {
    isValid: false,
    message: '',
  };
  const allowedProductUis = [
    'COUNSELOR_AT_THAT',
    'COUNSELOR_ON_THAT',
    'GEEKLING',
    'CAMPMATE',
  ];

  const productCheck = products.map(p => allowedProductUis.includes(p));
  if (productCheck.includes(false)) {
    result.message = `invalid products provided.`;
  } else if (products.length === 0) {
    result.message = `At least one product must be provided`;
  } else if (
    products.filter(p => p === 'COUNSELOR_AT_THAT').length > 1 ||
    products.filter(p => p === 'COUNSELOR_ON_THAT').length > 1 ||
    (products.includes('COUNSELOR_AT_THAT') &&
      products.includes('COUNSELOR_ON_THAT'))
  ) {
    result.message = `Do not include more than 1 Counselor ticket`;
  } else if (
    products.filter(p => p === 'COUNSELOR_AT_THAT').length === 0 &&
    products.filter(p => p === 'COUNSELOR_ON_THAT').length === 0
  ) {
    result.message = `Ensure 1 counselor ticket is included`;
  } else if (products.filter(p => p === 'CAMPMATE').length > 1) {
    result.message = `Do not include more that 1 Campmate ticket`;
  } else if (products.filter(p => p === 'GEEKLING').length > 2) {
    result.message = `Do not include more than 2 Geekling tickets`;
  } else if (
    products.includes('COUNSELOR_ON_THAT') &&
    (products.includes('CAMPMATE') || products.includes('GEEKLING'))
  ) {
    result.message = `Geekling and/or Campmate tickets are invalid with an ON THAT Counselor ticket`;
  } else {
    result.isValid = true;
  }
  dlog('validateEventSpeakerProduct result: %o', result);

  return result;
}
