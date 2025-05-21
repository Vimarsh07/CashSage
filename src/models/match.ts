// src/models/match.ts

/**
 * Represents one row in the `matches` table.
 */
export interface Match {
  /** auto-increment PK */
  id?: number;

  /** FK → transactions.id */
  transaction_id: number;

  /** FK → invoices.id */
  invoice_id: number;

  /** confidence score [0–1] */
  score: number;

  /** when the match was recorded */
  matched_at?: string;  // you can parse to Date if you like
}
