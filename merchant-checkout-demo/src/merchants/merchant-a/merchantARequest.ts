import { CheckoutRequest } from "../../lib/checkout";

const callbackUrl =
  process.env.REACT_APP_CALLBACK_URL || window.location.origin + "/callback";

export const merchantARequest: CheckoutRequest = {
  merchant: "EStore",
  subtotal: "624.99",
  tax: "81.24",
  total: "718.29",
  shipping: "12.00",
  desc: "item",
  callback: callbackUrl,
  cid: "",
};
