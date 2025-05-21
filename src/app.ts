import express from 'express'
import { createTransaction } from './controllers/transaction'
import { getMatches } from './controllers/matches'

export const app = express()

// Parse JSON bodies
app.use(express.json())

// Health‐check (optional)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

// Core endpoints
app.post('/transactions', async (req, res) => {
  await createTransaction(req, res);
});
app.get('/matches/:transaction_id', async (req, res) => {
  await getMatches(req, res);
});
