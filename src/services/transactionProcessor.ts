// src/services/transactionProcessor.ts
import type { Transaction } from '../models/transaction'
import { supabase } from '../utils/supabaseClient'
import { matchQueue } from '../jobs/matchQueue'

/**
 * Inserts or updates a transaction record in Supabase,
 * then enqueues it for matching.
 * Returns the canonical transaction ID.
 */
export async function processTransaction(
  tx: Transaction
): Promise<string> {
  // map payload → DB columns (id is PK)
  const record = {
    transaction_id:                    tx.transaction_id,
    account_id:            tx.account_id,
    amount:                tx.amount,
    iso_currency_code:     tx.iso_currency_code,
    unofficial_currency_code: tx.unofficial_currency_code,
    date:                  tx.date,
    authorized_date:       tx.authorized_date,
    name:                  tx.name,
    merchant_name:         tx.merchant_name,
    category:              tx.category,
    category_id:           tx.category_id,
    payment_channel:       tx.payment_channel,
    pending:               tx.pending,
    pending_transaction_id: tx.pending_transaction_id,
    payment_meta:          tx.payment_meta,
    raw_text:              tx.raw_text,
  }

  // upsert transaction
  const { data, error } = await supabase
    .from('transactions')
    .upsert(record)
    .select('id')

  if (error) {
    console.error('❌ Error upserting transaction:', error)
    throw error
  }

  const transactionId = data?.[0]?.id ?? tx.transaction_id

  // enqueue background matching (non-blocking)
  await matchQueue.add(
    'match',
    { transactionId },
    {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    }
  )
  return transactionId
}
