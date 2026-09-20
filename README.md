# INE Product Price Tracker

A full-stack product price tracking application built for the **INE Software Engineer Intern Assignment**.

## Live Demo

- **Frontend:** https://ine-price-tracker-omega.vercel.app/
- **Backend API:** (https://ine-price-tracker-api-docker.onrender.com)

## Features

- Discover products from the INE demo store
- Add and track products
- Scrape current price and stock using Playwright
- Automatic retry mechanism for failed scrapes
- Store price history in Supabase PostgreSQL
- Store scraping logs
- Manual product scraping
- Protected scheduled scraping endpoint
- React + Vite frontend
- Node.js + Express backend

## Tech Stack

**Frontend:** React, Vite, JavaScript, Recharts, Lucide React

**Backend:** Node.js, Express.js, Playwright

**Database:** Supabase PostgreSQL

**Deployment:** Vercel + Render

## Project Structure

```text
ine-price-tracker/
├── client/          # React frontend
├── server/          # Express backend
├── render.yaml      # Render deployment configuration
└── README.md

---

## Scraping

The application uses Playwright to scrape the mock store.

The scraper:

1. Opens the product page.
2. Locates the price-reveal control.
3. Reveals the product information.
4. Extracts the current selling price.
5. Extracts stock information.
6. Validates the extracted values.
7. Stores successful results in the database.
8. Records scraping attempts in the scrape logs.

### Retry Handling

The scraper allows up to 3 attempts for a product.

Failed attempts use exponential backoff:

```text
Attempt 1 → wait 1 second
Attempt 2 → wait 2 seconds
Attempt 3 → final attempt

Invalid price or stock data is not stored as a successful scrape.

---

## Scraping Schedule

Tracked products are scraped automatically every 2 hours.

The scheduled process calls:

POST /api/cron/scrape

The request must be authenticated using the configured CRON_SECRET.

The secret can be supplied using either:

X-Cron-Secret

or:

?cron_secret=...

The cron endpoint processes all tracked products and records the result of each scrape.

Successful scrapes create price history records.

Failed scrapes are recorded in the scrape logs and do not create incorrect price-history entries.

---

## Manual Scraping

A product can also be scraped manually through:

POST /api/products/:id/scrape

Example:

curl -X POST http://localhost:5000/api/products/1/scrape

The important difference is that each code block needs **one opening and one closing** triple backtick.

---

## Local Setup

### Frontend

```bash
cd client
npm install
npm run dev

---

## Create client/.env.local:

VITE_API_URL=http://localhost:5000/api

---

## Backend

cd server
npm install
npx playwright install chromium
npm start

---

## Create server/.env:

SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key
CRON_SECRET=your_cron_secret
PORT=5000

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get tracked products |
| POST | `/api/products` | Add a product |
| GET | `/api/products/discover` | Discover products |
| GET | `/api/products/:id` | Get product details |
| POST | `/api/products/:id/scrape` | Scrape product |
| GET | `/api/products/:id/history` | Get price history |
| GET | `/api/products/:id/logs` | Get scrape logs |
| POST | `/api/cron/scrape` | Scrape all tracked products |

---

## Security

Secrets are stored in environment variables and are not committed to the repository.

---

## Assignment

Built for the INE Software Engineer Intern Assignment — Product Price Tracker.