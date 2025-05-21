// src/jobs/matchQueue.ts

import { Queue, Worker, Job } from 'bullmq'
import { supabase } from '../utils/supabaseClient'
import type { Transaction } from '../models/transaction'
import type { Invoice } from '../models/invoice'
import { matchWithLLM } from '../services/llmMatcher'

interface MatchResult {
  invoiceId: string
  score: number
}

// Redis connection (you can switch to REDIS_URL if you prefer)
const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env.REDIS_PORT ?? '6379'),
}

export const matchQueue = new Queue('match', { connection })

new Worker(
  'match',
  async (job: Job<{ transactionId: string }>) => {
    const { transactionId } = job.data

    // 1) Load the transaction
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()
    if (txErr || !tx) {
      console.error(`❌ Could not load transaction ${transactionId}:`, txErr)
      return
    }

    // 2) Load all invoices
    const { data: invoices, error: invErr } = await supabase
      .from('invoices')
      .select('*')
    if (invErr || !invoices) {
      console.error(`❌ Could not load invoices:`, invErr)
      return
    }

    // 3) Determine matches (via your pre-rules + LLM fallback)
    let rawMatches: MatchResult[]
    try {
      rawMatches = await matchWithLLM(tx, invoices)
    } catch (err) {
      console.error(`❌ LLM matching failed for txn ${transactionId}:`, err)
      return
    }

    console.log(`[MatchQueue] LLM Response for txn ${transactionId}:`, rawMatches)

    // 4) Persist matches only (no invoice updates)
    for (const { invoiceId, score } of rawMatches) {
      const { error: matchErr } = await supabase
        .from('matches')
        .insert({
          transaction_id: transactionId,
          invoice_id:     invoiceId,
          score,
        })

      if (matchErr) {
        console.error(
          `❌ Failed to persist match txn=${transactionId} → inv=${invoiceId}:`,
          matchErr
        )
      }
    }

    
    // 5) (Commented) Update invoice payment_status & amount_paid
    for (const { invoiceId } of rawMatches) {
      // fetch current invoice amounts
      const { data, error: fetchErr } = await supabase
        .from('invoices')
        .select('amount, amount_paid')
        .eq('id', invoiceId)
        .single()

      const inv = data
    
      if (!inv || fetchErr) continue
     
      const prevPaid = Number(inv.amount_paid || 0)
      const newPaid  = prevPaid + Number(tx.amount)
      const status   = newPaid >= Number(inv.amount) ? 'full' : 'partial'
    
      await supabase
        .from('invoices')
        .update({ amount_paid: newPaid, payment_status: status })
        .eq('id', invoiceId)
    }
  },
  { connection }
)

// (Optional) global error logging
process.on('unhandledRejection', (err) => {
  console.error('Unhandled queue error', err)
})
