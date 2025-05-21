// src/controllers/transactions.ts

import { Request, Response } from 'express'
import { processTransaction } from '../services/transactionProcessor'
import type { Transaction } from '../models/transaction'

export async function createTransaction(req: Request, res: Response) {
  try {
    const tx = req.body as Transaction

    // 1. Basic validation
    if (
      !tx.transaction_id ||
      !tx.account_id ||
      tx.amount == null ||
      !tx.date ||
      !tx.name
    ) {
      return res
        .status(400)
        .json({
          error:
            'Missing required fields: transaction_id, account_id, amount, date, name',
        })
    }

    // 2. Persist + enqueue in one call
    const transactionId = await processTransaction(tx)

    // 3. Respond immediately
    return res.status(201).json({ transactionId })
  } catch (err: any) {
    console.error('🔥 createTransaction failed:', err)
    return res.status(500).json({ error: err.message })
  }
}
