# merchant-checkout-demo

## Overview

This demo illustrates how a merchant website can integrate passkey-based checkout using the LoginID Merchant SDK.

It includes both embedded and fallback flows:

- **Embedded flow**: Displays the wallet in an iframe for a seamless checkout experience with passkey support.
- **Fallback flow**: Redirects the user to a hosted wallet page when embedding isn’t supported.

The integration flow includes:

- Running a discovery check to determine if embedding is possible.
- Generating or reusing a `checkoutId` for the session.
- Communicating with the wallet via `postMessage`.
- Persisting a local flag after successful embedded checkout to streamline future visits.

This demo focuses on all iframe and message logic manually.

## Getting Started

### Configure Environment Variables

1. Copy `example.env` and rename it to `.env`.
2. Replace the placeholder value with the base URL of your wallet domain:

```
REACT_APP_CHECKOUT_BASEURL=<https://your-wallet-domain.com>
```

### Run Demo

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm start
```

Then open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Wallet Setup Notes

This demo requires a wallet instance to be available for discovery and checkout. You can run the [wallet demo](../wallet-checkout-demo) locally on another port (e.g. `http://localhost:3000`) or expose it using a tool like [ngrok](https://ngrok.com):

```
ngrok http 3000
```

Update the `REACT_APP_CHECKOUT_BASEURL` in your `.env` file to match the wallet URL, for example:

```
REACT_APP_CHECKOUT_BASEURL=http://localhost:3001
# or
REACT_APP_CHECKOUT_BASEURL=https://<your-ngrok-subdomain>.ngrok.io
```

Ensure the wallet is running at the configured URL during testing.

## License

This project is under Apache 2.0. See [LICENSE.md](./LICENSE.md)
