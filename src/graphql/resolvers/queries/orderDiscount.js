export const fieldResolvers = {
  OrderDiscount: {
    amount: ({ amount }) => amount ?? 0,
    amountOff: ({ amountOff }) => amountOff ?? 0,
    percent: ({ percent }) => percent ?? 0,
  },
};
