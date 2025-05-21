// src/utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import type { Invoice } from '../models/invoice';
import type { Transaction } from '../models/transaction';
import type { Match } from '../models/match';

import dotenv from 'dotenv';
dotenv.config(); 

// Map each table to its Row type
interface Database {
  invoices: Invoice;
  transactions: Transaction;
  matches: Match;
}

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);
