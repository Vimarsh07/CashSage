// src/services/invoiceLoader.ts
import { supabase } from '../utils/supabaseClient'
import type { Invoice } from '../models/invoice'

/**
 * Fetches every invoice row from Supabase.
 */
export async function getAllInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')

  if (error) {
    console.error('❌ Failed to load invoices:', error)
    throw error
  }

  return data!
}
