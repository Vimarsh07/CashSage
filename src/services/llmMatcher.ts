// src/services/llmMatcher.ts

import OpenAI from 'openai'
import type { Transaction } from '../models/transaction'
import type { Invoice } from '../models/invoice'

export interface MatchResult {
  invoiceId: string
  score: number
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY })

export async function matchWithLLM(
  tx: Transaction,
  invoices: Invoice[]
): Promise<MatchResult[]> {
  // 1) Filter by exact amount
  let candidates = invoices.filter(
    inv => Number(inv.amount) === Number(tx.amount)
  )
  if (candidates.length === 1) {
    // unique by amount alone
    return [{ invoiceId: candidates[0].id!, score: 1.0 }]
  }

  // 2) Of those, filter by matching payment_method
  candidates = candidates.filter(
    inv => inv.payment_method?.toLowerCase() === tx.payment_channel.toLowerCase()
  )
  if (candidates.length === 1) {
    return [{ invoiceId: candidates[0].id!, score: 0.99 }]
  }

  // 3) Of those, filter by name & category vs. line_item
  const final = candidates.filter(inv => {
    // name match if any word in tx.name appears in the line_item
    const nameMatch = tx.name
      .toLowerCase()
      .split(/\s+/)
      .some(w => inv.customer_name.toLowerCase().includes(w))

    // category match if any of tx.category appears in the line_item
    const categoryMatch = Array.isArray(tx.category)
      ? tx.category.some(cat =>
          inv.line_item.toLowerCase().includes(cat.toLowerCase())
        )
      : false

    return nameMatch && categoryMatch
  })
  if (final.length > 0) {
    return final.map(inv => ({ invoiceId: inv.id!, score: 0.98 }))
  }

  // ─── Fallback to LLM ───────────────────────────────────────────────
  const prompt = `
You are matching a bank transaction to a list of invoices.
First, you tried:
  1) Exact amount match
  2) Same payment method
  3) Name & category in line items
All candidates failing those go below.

Transaction:
- ID: ${tx.transaction_id}
- Amount: ${tx.amount}
- Date: ${tx.date}
- Description: ${tx.name}
- Categories: ${tx.category?.join(', ')}

Remaining Invoices:
${invoices
    .map(
      inv =>
        `- ID: ${inv.id}, #${inv.invoice_number}, Customer: ${inv.customer_name}, ` +
        `Amount: ${inv.amount}, Method: ${inv.payment_method}, Item: ${inv.line_item}`
    )
    .join('\n')}

Please reply with a raw JSON array of objects like:
[
  { "invoiceId": "…", "score": 0.0–1.0 },
  …
]
(without markdown fences).
`

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  })

  let text = resp.choices?.[0]?.message?.content?.trim() ?? '';
  // strip any ``` ``` fences
  const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (m) text = m[1].trim()

  try {
    return JSON.parse(text) as MatchResult[]
  } catch (err) {
    console.error('❌ Failed to parse LLM response:', text, err)
    throw new Error('Invalid LLM output')
  }
}
