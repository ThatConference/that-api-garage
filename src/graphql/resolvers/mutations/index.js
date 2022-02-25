import rootMutations from './root';

import { fieldResolvers as productsFields } from './products';
import { fieldResolvers as productFields } from './product';
import { fieldResolvers as productCreateFields } from './productCreate';
import { fieldResolvers as productUpdateFields } from './productUpdate';
import { fieldResolvers as ordersFields } from './orders';
import { fieldResolvers as orderFields } from './order';
import { fieldResolvers as meCheckoutsFields } from './meCheckouts';
import { fieldResolvers as meOrdersFields } from './meOrders';
import { fieldResolvers as stripeCheckoutFields } from './stripeCheckout';
import { fieldResolvers as orderAllocationFields } from './orderAllocation';
import { fieldResolvers as meOrderAllocationFields } from './meOrderAllocation';
import { fieldResolvers as meOrderMutationFields } from './meOrder';
import { fieldResolvers as assetsFields } from './assets';
import { fieldResolvers as assetFields } from './asset';
import { fieldResolvers as meAssetsFields } from './meAssets';
import { fieldResolvers as meAssetFields } from './meAsset';
import { fieldResolvers as meOrderAllocationEnrollmentFields } from './meOrderAllocationEnrollment';

export default {
  ...rootMutations,
};

export const fieldResolvers = {
  ...productsFields,
  ...productFields,
  ...productCreateFields,
  ...productUpdateFields,
  ...ordersFields,
  ...orderFields,
  ...meCheckoutsFields,
  ...meOrdersFields,
  ...stripeCheckoutFields,
  ...orderAllocationFields,
  ...meOrderAllocationFields,
  ...meOrderMutationFields,
  ...assetsFields,
  ...assetFields,
  ...meAssetsFields,
  ...meAssetFields,
  ...meOrderAllocationEnrollmentFields,
};
