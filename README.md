# INE Product Price Tracker

A full-stack product price tracking application built for the **INE Software Engineer Intern Assignment**.

## Live Demo

- **Frontend:** ine-price-tracker-rkvyumkgh-arshpreet0005.vercel.app
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