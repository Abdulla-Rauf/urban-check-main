# Urban Check — Architecture & Foundation

Urban Check is a modern, high-end fashion e-commerce platform built with an isolated multi-application architecture.

```text
urban-check/
├── client/          # Customer Website (Vite + React + Tailwind CSS)
├── admin/           # Staff & Admin Dashboard (Vite + React + Tailwind CSS)
├── server/          # REST API Backend (Node.js + Express)
├── package.json     # Root orchestration scripts
└── README.md
```

---

## 🌟 Key Architecture Decisions

1. **Strict Application Separation**:
   - The **Customer Website** (`client/`) and **Admin Dashboard** (`admin/`) are two separate frontend applications with their own dependencies, build configurations, and route hierarchies.
   - Admin routes do **NOT** exist inside the customer client. Customer shopping components do **NOT** exist inside the admin client.

2. **Domain Architecture**:
   - **Customer Website**: `https://urbancheck.com` (Local: `http://localhost:5173`)
   - **Admin Portal**: `https://admin.urbancheck.com` (Local: `http://localhost:5174`)
   - **API Backend**: `https://api.urbancheck.com` (Local: `http://localhost:5000`)

3. **Brand Identity & Aesthetics**:
   - Clean, minimal, editorial fashion styling.
   - Curated palette:
     - **Black**: `#111111`
     - **White**: `#FFFFFF`
     - **Teal Green**: `#2F6F68` (Primary brand accent)
     - **Warm Grey**: `#6B6B65`
     - **Biscuit / Sand**: `#D8C7AD`
     - **Light Grey**: `#F5F5F3`

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install root dependencies (concurrently)
npm install

# Install client, admin, and server dependencies
npm run install:all
```

### 2. Environment Setup
Copy the `.env.example` in each folder to `.env`:
- `client/.env.example` ➔ `client/.env`
- `admin/.env.example` ➔ `admin/.env`
- `server/.env.example` ➔ `server/.env`

### 3. Launch Development Servers
```bash
# Run all 3 apps concurrently
npm run dev

# Or start services individually:
npm run dev:server    # http://localhost:5000
npm run dev:client    # http://localhost:5173
npm run dev:admin     # http://localhost:5174
```

---

## 🧭 Routes Overview

### Customer Application (`/client`)
- `/` — Homepage Lookbook & Curated Drops
- `/shop` — Catalog with filters
- `/categories` & `/categories/:slug` — Category explorer
- `/brands/:slug` — Brand collection
- `/new-arrivals` — Seasonal drops
- `/offers` — Promotional campaigns
- `/search` — Product discovery
- `/product/:slug` — Product detail view
- `/wishlist` — Customer saved items
- `/cart` — Shopping bag
- `/checkout` — Checkout workflow
- `/login`, `/register`, `/forgot-password` — Customer auth
- `/account/*` — Account dashboard, orders, addresses, reviews, returns

### Admin Application (`/admin`)
- `/login` — Dedicated admin authentication
- `/dashboard` — Store overview & KPI metrics
- `/products`, `/products/new`, `/products/:id/edit` — Catalog control
- `/categories`, `/brands` — Taxonomy management
- `/orders`, `/orders/:id` — Order tracking & fulfillment
- `/inventory`, `/inventory/ledger` — Real-time stock & movement history
- `/customers`, `/customers/:id` — Customer CRM
- `/banners`, `/offers`, `/coupons` — Promotional engine
- `/returns`, `/refunds` — Reverse logistics
- `/shipments` — Courier integrations
- `/reviews` — Moderation
- `/analytics` — Revenue & conversion reporting
- `/finance`, `/finance/transactions`, `/finance/ledger` — Financial reconciliation
- `/admin-users`, `/roles` — Role-based access control (RBAC)
- `/audit-logs` — Administrative activity trail
- `/settings` — Store configurations
