# wallet-demo

## Overview

This example application showcases how to implement key authentication flows on your wallet domain. These include:

- External Login (Bank Login or Custom Login) with Passkey creation for the user
- Passkey Autofill Login
- Transaction Confirmation using a Passkey

## Getting Started

### Setup LoginID Application

1. Create an account with [LoginID](https://dashboard.loginid.io/login).
2. Create a [basic application](https://docs.dev.loginid.io/setup/loginid/#steps-to-create-an-application-with-basic-optionsdefault) integration. Use the hosted URL of where the wallet demo is being hosted on.
3. Create an API key with `external:verify` scope.
4. Update the wallet demo environment variables in the next section.

### Configure Environment Variables

1. Copy `example.env` and rename it to `.env`.
2. Replace the placeholder values with your own credentials, which you can find in your LoginID dashboard under your application settings:

```
REACT_APP_LOGINID_BASE_URL=<BASE_URL_HERE>
REACT_APP_LOGINID_APIKEY=<API_KEY_HERE>
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

## License

This project is under Apache 2.0. See [LICENSE.md](./LICENSE.md)
