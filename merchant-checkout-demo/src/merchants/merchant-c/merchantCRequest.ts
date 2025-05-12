import { CheckoutRequest } from "../../lib/checkout";

const callbackUrl =
  process.env.REACT_APP_CALLBACK_URL || window.location.origin + "/callback";

export const merchantCRequest: CheckoutRequest = {
  merchant: "Plants",
  subtotal: "98.00",
  tax: "5.00",
  total: "113.00",
  shipping: "10.00",
  desc: "item",
  callback: callbackUrl,
  cid: "",
};
