# Lipa Pole Pole - BNPL for Kenyan Retailers 🇰🇪

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![MPesa Integration](https://img.shields.io/badge/Powered%20by-Safaricom%20Daraja-blue)](https://developer.safaricom.co.ke)
![USSD Accessible](https://img.shields.io/badge/USSD-Accessible-brightgreen)

> "Digital Mikokoteni" - Transforming informal credit through M-Pesa automation

## Table of Contents

- [Problem Statement](#problem-statement-)
- [Solution](#solution-)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Integration](#-api-integration)
- [Database Schema](#-database-schema)
- [Business Model](#business-model)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

## Problem Statement 🚨

Kenyan retailers face three critical challenges:

1. **Cashflow Disruptions**: 68% of small shops experience liquidity issues due to unpaid debts (CBK 2023)
2. **Fraud Risks**: 42% of mobile payments disputes involve fake M-Pesa confirmations
3. **Financial Exclusion**: 82% of informal sector workers lack credit scores

## Solution 💡

Lipa Pole Pole provides:

- **USSD-based BNPL** accessible on any mobile phone
- **Auto-repayment** via M-Pesa STK Push
- **Dynamic credit scoring** for unbanked customers
- **Multi-lender support** for diversified borrowing

## ✨ Features

| Feature              | Vendor Benefit           | Customer Benefit            |
|----------------------|-------------------------|-----------------------------|
| USSD Credit Issuance | No smartphone required  | Borrow in 3 taps            |
| Auto-STK Repayment   | Guaranteed collections  | One-click payment           |
| 5% Daily Late Fees   | Risk compensation       | Payment discipline          |
| SMS Notifications    | Real-time updates       | Payment reminders           |
| Multi-Loan Support   | Portfolio diversification | Borrow from multiple shops |

## 🛠️ Tech Stack

```mermaid
graph TD
    A[USSD Frontend] --> B[Node.js Backend]
    B --> C[Safaricom Daraja]
    B --> D[Firebase Firestore]
    B --> E[Africa's Talking SMS]
```

## 🚀 Installation

```sh
# Clone repository
git clone https://github.com/your-repo/lipa-pole-pole.git

# Install dependencies
cd lipa-pole-pole
npm install

# Set up environment
cp .env.example .env
```

## ⚙️ Configuration

`.env` requirements:

```env
# M-Pesa
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_PASSKEY=your_passkey
CALLBACK_URL=https://yourdomain.com/callback

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Africa's Talking
AT_API_KEY=your_at_key
AT_USERNAME=your_at_username
```

## 🔌 API Integration

**Safaricom Daraja Endpoints**

```js
// STK Push Example
const { initiateSTKPush } = require('./services/mpesa');
await initiateSTKPush('254712345678', 1500, 'LN12345');
```

**Required APIs:**

- Safaricom Daraja (STK Push, USSD)
- Africa's Talking (SMS, USSD Gateway)
- Google Firebase (Firestore database)

## 🗃️ Database Schema

Firestore Collection Structure:

```json
{
  "vendors": {
    "254712345678": {
      "paymentAccounts": ["254712345678", "123456"],
      "activeLoans": {
        "254700000001": 2000
      }
    }
  },
  "loans": {
    "LN12345": {
      "vendor": "254712345678",
      "borrower": "254700000001",
      "amount": 2000,
      "dueDate": "2024-07-15T00:00:00Z",
      "status": "active"
    }
  }
}
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

## 📞 Contact

**Project Lead:** Kenneth Muchiri  
[LinkedIn](https://www.linkedin.com/in/kenneth-muchiri-muongi)  
Email: [kennethmuchiri7168@gmail.com](mailto:kennethmuchiri7168@gmail.com)  
[Website](https://lipapolepole.co.ke)