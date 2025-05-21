# CashSage

**AI-powered cash application service for matching bank transactions to invoices.**

CashSage is a lightweight, TypeScript-based backend service that ingests bank transactions, matches them to static invoices using a combination of deterministic rules and a Large Language Model (LLM), and stores all data in Supabase. Queueing with BullMQ ensures the matching process runs asynchronously, giving your frontend instant feedback while heavy LLM work happens in the background.

---

## 🚀 Features

- **Static invoice import:** Load your existing `test_invoices.csv` into Supabase in bulk.  
- **Plaid-style transaction ingestion:** `POST /transactions` accepts standardized transaction payloads.  
- **Asynchronous matching:** BullMQ + Redis decouples LLM calls from your HTTP layer.  
- **Smart matching pipeline:**
  1. Exact‐amount filter  
  2. Payment‐method filter  
  3. Name & category vs. invoice line items  
  4. LLM fallback for edge cases  
- **Match persistence:** Store match results (`invoice_id`, `score`, `matched_at`) for later retrieval.  
- **Reprocess script:** Recover from any transient errors by re-enqueuing unmatched transactions.  
- **Extensible architecture:** Future hooks for payment status & amount paid tracking, multi-tenant support, caching, etc.

---

## 📦 Tech Stack

- **Node.js & TypeScript**  
- **Express** for REST API  
- **Supabase** (PostgreSQL) for durable storage  
- **BullMQ** + **Redis** for background queueing  
- **OpenAI** (or any LLM) for intelligent matching  
- **csv-parse** for invoice ingestion  
- **dotenv** for configuration  

---

## 🔧 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/<your-username>/cashsage.git
cd cashsage


## 2. Install Dependencies
```bash
npm install


## 3. Create & Configure Your Environment
cp .env.example .env
# Then open `.env` and set:
# SUPABASE_URL=<your-supabase-url>
# SUPABASE_KEY=<your-supabase-key>
# OPENAI_KEY=<your-openai-key>
# REDIS_URL=redis://127.0.0.1:6379

## 4. Provision Redis for Local Development
docker run -d --name cashsage-redis -p 6379:6379 redis:7-alpine

## 5. Prepare Your Database
Paste the following into the Supabase SQL editor and run:
create extension if not exists "pgcrypto";

-- Invoices
create table invoices (
  id             uuid        primary key default gen_random_uuid(),
  invoice_number text        not null,
  customer_name  text        not null,
  invoice_date   date,
  due_date       date,
  line_item      text        not null,
  amount         numeric     not null,
  payment_method text,
  payment_status text        not null default 'unpaid',
  amount_paid    numeric     not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Transactions
create table transactions (
  id                        bigint      primary key generated always as identity,
  transaction_id            text        not null unique,
  account_id                text        not null,
  amount                    numeric     not null,
  iso_currency_code         text,
  unofficial_currency_code  text,
  date                      date        not null,
  authorized_date           date,
  name                      text        not null,
  merchant_name             text,
  category                  text[],
  category_id               text,
  payment_channel           text        not null,
  pending                   boolean     not null default false,
  payment_meta              jsonb,
  raw_text                  text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Matches
create table matches (
  id             uuid        primary key default gen_random_uuid(),
  transaction_id bigint      not null references transactions(id),
  invoice_id     uuid        not null references invoices(id),
  score          numeric     not null,
  matched_at     timestamptz not null default now()
);

##6. Import Your Invoices
npx ts-node scripts/importInvoices.ts
# → ✅ Imported 51 invoice rows.


##7. Run the Application

Open two terminals:

Terminal A:
npx ts-node src/server.ts
# → 🚀 Server listening on http://localhost:3000

Terminal B:
npx ts-node src/jobs/matchQueue.ts
# Worker is now listening for match jobs




📖 Architecture & Why We Did It
Layer	Responsibility
Express API	Ingest transactions & expose match endpoint
Supabase (Postgres)	Durable storage for invoices, transactions, matches
BullMQ + Redis	Background queue to decouple LLM calls
LLM Matcher	Hybrid rules + GPT fallback for best match
Scripts	Invoice import & reprocess unmatched jobs

Asynchronous Matching: Users get immediate 201 responses; heavy LLM calls run in the background.

Deterministic Rules First: Exact-amount, payment method, and description filters catch common cases instantly, saving LLM calls.

LLM Fallback: Catches edge cases where simple rules aren’t enough.

Reprocess Script: One-off recovery for any jobs that failed pre-fix.

Schema Design: UUIDs for invoices & matches; identity integers for transactions to avoid key collisions.

🛠️ Future Enhancements
Payment Tracking: Uncomment and refine payment_status/amount_paid logic for live balances.

Auth & Multi-Tenant: Lock down endpoints via Supabase Auth, isolate data per organization.

Frontend Dashboard: React app to upload transactions, view invoice breakdowns, and manual override matches.

Batch Processing: Support bulk POST /transactions with per-item success/failure.

Monitoring & Alerts: Integrate Prometheus/Grafana or Sentry for queue/job health.