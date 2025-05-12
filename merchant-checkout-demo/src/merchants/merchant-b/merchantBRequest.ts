import { CheckoutRequest } from "../../lib/checkout";

const callbackUrl =
  process.env.REACT_APP_CALLBACK_URL || window.location.origin + "/callback";

export const merchantBRequest: CheckoutRequest = {
  merchant: "ZSports",
  subtotal: "120.33",
  tax: "7.24",
  total: "127.57",
  shipping: "0.00",
  desc: "item",
  callback: callbackUrl,
  cid: "",
};
