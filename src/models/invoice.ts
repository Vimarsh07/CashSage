// src/models/invoice.ts

/**
 * Represents one row of the `invoices` table.
 */
export interface Invoice {
  /** Auto-generated UUID primary key */
  id?: string;

  /** The invoice number from your CSV (can repeat) */
  invoice_number: string;

  /** Customer or company name */
  customer_name: string;

  /** Date the invoice was issued (YYYY-MM-DD) */
  invoice_date?: string;

  /** Date the invoice is due (YYYY-MM-DD) */
  due_date?: string;

  /** Single line-item description, e.g. "SEO Services: $1609" */
  line_item: string;

  /** Parsed numeric amount for that line item */
  amount: number;

  /** Payment method text from the CSV */
  payment_method?: string;

  /** 'unpaid' | 'partial' | 'full' */
  payment_status: 'unpaid' | 'partial' | 'full';

  /** Total applied so far (starts at 0) */
  amount_paid: number;

  /** When this row was created (auto-populated) */
  created_at?: string;

  /** When this row was last updated (auto-populated) */
  updated_at?: string;
}
