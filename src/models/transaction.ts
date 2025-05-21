// src/models/transaction.ts

/**
 * Representation of a bank transaction, modeled after Plaid's Transaction object.
 */
export interface Transaction {
  /** Unique identifier for the transaction */
  transaction_id: string;

  /** Reference to the bank account this transaction belongs to */
  account_id: string;

  /** Amount of the transaction in the smallest currency unit (e.g., cents) */
  amount: number;

  /** ISO 4217 currency code, if available */
  iso_currency_code: string | null;

  /** Unofficial currency code, if the ISO code is unavailable */
  unofficial_currency_code: string | null;

  /** Date the transaction posted (YYYY-MM-DD) */
  date: string;

  /** Date the transaction was authorized, if different from posted date */
  authorized_date?: string;

  /** Raw description text from the bank */
  name: string;

  /** Parsed merchant name, if available */
  merchant_name?: string;

  /** Category classification (e.g., ["Travel", "Airlines"]) */
  category?: string[];

  /** Plaid-specific category identifier */
  category_id?: string;

  /** Channel via which the payment was made */
  payment_channel: 'online' | 'in store' | 'ach' | 'wire' | 'check' | 'other';

  /** True if transaction is pending (not yet settled) */
  pending: boolean;

  /** If this is a child transaction, reference to the pending transaction ID */
  pending_transaction_id?: string;

  /** Additional metadata provided by the payment provider */
  payment_meta?: PaymentMeta;

  /** Custom free-form text for internal auditing or notes */
  raw_text?: string;
}

/**
 * Additional metadata about the transaction, following Plaid's PaymentMeta
 */
export interface PaymentMeta {
  /** Check number (for check payments) */
  check_number?: string;

  /** PPD (Prearranged Payments and Deposits) ID for ACH transfers */
  ppd_id?: string;

  /** Reason for the payment or return, if provided */
  return_reason?: string;

  /** Original description, if name has been normalized */
  original_description?: string;

  /** Other provider-specific reference ID */
  reference_number?: string;

  /** Payee or payer information */
  payee?: string;
  payer?: string;
}
