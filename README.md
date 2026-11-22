# SpendWise

SpendWise is a personal finance and expense tracking web application built with **React 19**, **Vite**, and **Tailwind CSS v4**.

SpendWise runs completely in the browser and stores account and ledger data in `localStorage`. It is a local demo/personal tracker, not a secure multi-user finance service. Browser storage can be read or changed by the device owner and by scripts running on the same origin; the local sign-in screen is not server-side authentication or authorization.

---

## Features

* **Account Management**: Local account registration and login using salted PBKDF2 password verification. Existing SHA-256 password records are upgraded after a successful login.
* **Transaction Tracking**: Add, edit, filter, and delete income and expense records. Real-time search by title and filter by category or type.
* **Persistent Storage**: Transactions and income plans are stored in browser storage per local account. Clearing site data deletes this information.
* **Data Visualizations (Recharts)**:
  * Category spending breakdown (Donut chart)
  * Income vs. expenses comparison
  * Monthly spending trendline
* **Wallet & Budgets**: Summary cards for balance, recorded cash flow, and monthly budget targets.
* **Data Management**: Export transaction history to JSON backup or clear ledger records in Settings.
* **Currency Support**: Built-in Nigerian Naira (`₦`) formatting.

---

## Getting Started

### Prerequisites
* Node.js 18+ or 20+
* npm

### Running Locally

```bash
cd Spendwise
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build and Lint

```bash
npm run lint    # Check code style with ESLint
npm run build   # Generate production bundle in dist/
npm run preview # Preview the production build locally
```

## Security Limitations

This frontend has no trusted server, so it cannot protect financial data from someone with access to the browser profile, developer tools, or a same-origin script vulnerability. PBKDF2 makes a copied password record more expensive to guess, but does not make browser storage private or make the local login a security boundary. Do not use this app for sensitive financial records or store production credentials in it.

For a public deployment with real accounts or sensitive data, add a backend that performs authentication and authorizes every data operation. Use HTTPS, secure `HttpOnly` and `SameSite` session cookies, and configure response security headers at the hosting layer, including a tested Content Security Policy, `frame-ancestors`, `X-Content-Type-Options`, a restrictive `Referrer-Policy`, and HSTS over HTTPS. Keep secrets and authorization decisions out of frontend code. The required header policy depends on the chosen host and any external resources the app uses.
