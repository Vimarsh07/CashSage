// scripts/importInvoices.ts

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { supabase } from '../src/utils/supabaseClient';

interface RawRow {
  InvoiceNumber: string;
  CustomerName: string;
  InvoiceDate: string;
  DueDate: string;
  LineItems: string;   // one item per row, e.g. "SEO Services: $1609"
  PaymentMethod: string;
}

async function importInvoices() {
  const csvPath = path.resolve(__dirname, '../data/test_data.csv');
  const parser = fs
    .createReadStream(csvPath)
    .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }));

  const toInsert: any[] = [];

  for await (const row of parser) {
    // Extract the $-amount in this single line item
    const match = row.LineItems.match(/\$([0-9,]+(?:\.[0-9]+)?)/);
    const amt = match ? parseFloat(match[1].replace(/,/g, '')) : 0;

    toInsert.push({
      invoice_number:  row.InvoiceNumber,
      customer_name:   row.CustomerName,
      invoice_date:    row.InvoiceDate,
      due_date:        row.DueDate,
      line_item:       row.LineItems,
      amount:          amt,
      payment_method:  row.PaymentMethod,
      // payment_status defaults to 'unpaid', amount_paid to 0
    });
  }

  // Bulk insert all 51 rows
  const { error } = await supabase
    .from('invoices')
    .insert(toInsert);

  if (error) {
    console.error('🚨 Failed to import invoices:', error.message);
    process.exit(1);
  } else {
    console.log(`✅ Imported ${toInsert.length} invoice rows.`);
  }
}

importInvoices().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
