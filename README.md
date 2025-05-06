# Passkey Checkout Demos

This repository contains two demos showcasing a passkey-based checkout flow using the LoginID platform.
Together, they simulate the interaction between a merchant site and a wallet service.

## Project Structure

```
.
├── merchant-checkout-demo/   # Merchant-facing checkout demo (iframe + fallback)
└── wallet-checkout-demo/     # Wallet service demo (passkey login + transaction cofirmation signing)
```

## Overview

### merchant-checkout-demo
A demo merchant site that integrates with a wallet. It supports:

- Embedded Checkout (via iframe)
- Fallback Checkout (redirect to hosted wallet)

See merchant-checkout-demo/README.md for full details.

### wallet-checkout-demo

A standalone wallet application that demonstrates:

- External logins + passkey registration
- Passkey login autofill
- Transaction confirmation via passkey

See wallet-checkout-demo/README.md for full details.

### Setup Instructions

1. Clone the Repository

  ```bash
  git clone https://github.com/your-org/loginid-checkout-web-demo.git
  cd loginid-checkout-web-demo
  ```

2. Configure and Run Wallet Demo

  Follow instructions in [wallet-checkout-demo](./wallet-checkout-demo) to:
   - Set up LoginID credentials
   - Configure `.env`
   - Start the wallet demo (e.g., on port 3001 or via ngrok)

3. Configure and Run Merchant Demo

  Follow instructions in [merchant-checkout-demo](./merchant-checkout-demo) to:
   - Set the `REACT_APP_CHECKOUT_BASEURL` to the wallet URL
   - Run the merchant demo (default: port 3000)

## License

This project is licensed under the Apache 2.0 License.
See LICENSE.md for details.
