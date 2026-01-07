# SMRTLEY

**Trade smart. Test smarter.**

SMRTLEY is a virtual trading and market intelligence platform designed for **paper trading, live market data consumption, and future strategy backtesting**. It allows users to simulate trades using real market prices without risking real money.

---

## 🌐 Project Structure

```


```

---

# 📦 Backend – SMRTLEY Core Engine

## Purpose

The backend powers:

* Angel One (SmartAPI) integration
* Secure token & TOTP handling
* Market data (LTP / OHLC / FULL)
* Rate-limited & queued API calls
* Paper trading (current & future)

---

## 🔑 Key Features

* Daily login using TOTP
* Secure token storage in MongoDB
* In-memory token caching for performance
* Request queue to avoid API throttling (no merging)
* Modular services (login, market data, stocks)

---

## 🛠 Tech Stack

* Node.js (JavaScript)
* Express.js
* MongoDB + Mongoose
* Angel One SmartAPI

---

## 📂 Backend Folder Structure

```
backend/
├── controllers/
├── services/
├── models/
├── routes/
├── config/
└── app.js
```

---

## 🔐 Authentication Flow

1. Admin hits login API with TOTP
2. SMRTLEY generates access & refresh tokens
3. Tokens stored in DB with metadata
4. Tokens cached in memory for fast access
5. Auto-refresh using refresh token if expired

---

## 📈 Market Data Flow

* Controller receives tokenIds
* Request is queued (min 5 sec gap)
* Access token injected automatically
* Data fetched from Angel One
* Response returned to caller

Supported Modes:

* `LTP`
* `OHLC`
* `FULL`

---

## 🚀 Future Backend Roadmap

* Paper trading engine
* Strategy execution service
* Backtesting with historical data
* Performance metrics (PnL, drawdown)

---

# 🎨 Frontend – SMRTLEY UI

## Purpose

The frontend provides users with:

* Live price dashboards
* Paper trading interface
* Portfolio & PnL views
* Strategy testing UI (future)

---

## 🛠 Suggested Tech Stack

* React / Next.js
* Tailwind CSS
* Charting library (Recharts / TradingView)
* Axios / Fetch for API calls

---

## 📂 Frontend Folder Structure (Suggested)

```
frontend/
├── components/
│   ├── PriceCard
│   ├── StockTable
│   └── TradeModal
│
├── pages/
│   ├── dashboard
│   ├── paper-trade
│   └── strategies
│
├── services/
│   └── api.js
│
└── utils/
```

---

## 🔌 Frontend ↔ Backend Communication

* All API calls go through SMRTLEY backend
* No direct Angel One access from frontend
* Secure & rate-limited by design

---

## 🧪 Use Cases

* Learn trading without real money
* Test strategies safely
* Demonstrate logic on YouTube (run4dream)
* Future SaaS offering

---

## 📜 License & Disclaimer

SMRTLEY is currently intended for **educational and simulation purposes only**.

No real trades are executed.

---

## ❤️ Built By

**run4dream**

> Turning trading ideas into tested intelligence.
