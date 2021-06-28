import root from './root';

import { fieldResolvers as productsFields } from './products';
import { fieldResolvers as productFields } from './product';
import { fieldResolvers as ordersFields } from './orders';
import { fieldResolvers as orderFields } from './order';
import { fieldResolvers as meOrderFields } from './meOrder';
import { fieldResolvers as meOrdersFields } from './meOrders';
import { fieldResolvers as registrationOrderFields } from './registrationOrder';
import { fieldResolvers as lineItemFields } from './lineItem';
import { fieldResolvers as orderAllocationFields } from './orderAllocation';
import { fieldResolvers as publicOrderAllocationFields } from './publicOrderAllocation';
import { fieldResolvers as mePortalFields } from './mePortal';
import { fieldResolvers as assetsFields } from './assets';
import { fieldResolvers as assetFields } from './asset';
import { fieldResolvers as entityFields } from './entity';
import { fieldResolvers as meAssetsFields } from './meAssets';

export default {
  ...root,
};

export const fieldResolvers = {
  ...productsFields,
  ...productFields,
  ...ordersFields,
  ...orderFields,
  ...meOrderFields,
  ...meOrdersFields,
  ...registrationOrderFields,
  ...lineItemFields,
  ...orderAllocationFields,
  ...publicOrderAllocationFields,
  ...mePortalFields,
  ...assetsFields,
  ...assetFields,
  ...entityFields,
  ...meAssetsFields,
};
