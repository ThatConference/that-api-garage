// Validates quantities and settings of checkout lineitems
import debug from 'debug';
import * as yup from 'yup';

const dlog = debug('that:api:garage:lineItemValidation');

const lineItemSchema = yup.object().shape({
  productId: yup.string().min(16).required(),
  quantity: yup
    .number()
    .min(1)
    .required()
    .when('isBulkPurchase', { is: false, then: yup.number().max(1) }),
  isBulkPurchase: yup.boolean().required(),
});

const checkoutSchema = yup.object().shape({
  eventId: yup.string().min(16).required(),
  products: yup.array().min(1).max(6).required().of(lineItemSchema),
});

export default function lineItemValidation({ checkout }) {
  dlog('lineItemValidation called on %o', checkout);
  return checkoutSchema.validate(checkout).then(() => true);
}
