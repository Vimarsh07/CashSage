// scripts/reprocessUnmatched.ts

import dotenv from 'dotenv'
dotenv.config()

import { supabase } from '../src/utils/supabaseClient'
import { matchQueue } from '../src/jobs/matchQueue'

async function reprocess() {
  // 1) Find all transaction IDs without any matches
  const { data: matchIds, error } = await supabase
  .from('matches')
  .select('transaction_id')

if (error) {
  console.error('❌ Failed to fetch match IDs:', error)
  process.exit(1)
}

const { data: txs, error: txError } = await supabase
  .from('transactions')
  .select('id')
  .not('id', 'in', matchIds)

if (txError) {
  console.error('❌ Failed to fetch unmatched transactions:', txError)
  process.exit(1)
}

  // 2) Enqueue each one
  for (const { id } of txs!) {
    console.log(`🔄 Re-enqueueing transaction ${id}`)
    await matchQueue.add(
      'match',
      { transactionId: id },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
      }
    )
  }

  console.log(`✅ Enqueued ${txs?.length} transactions for reprocessing.`)
  process.exit(0)
}

reprocess().catch(err => {
  console.error('🔥 Error in reprocess script:', err)
  process.exit(1)
})
