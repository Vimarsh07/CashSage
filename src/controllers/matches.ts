// src/controllers/matches.ts

import { Request, Response } from 'express'
import { supabase } from '../utils/supabaseClient'
import type { Match } from '../models/match'

/**
 * GET /matches/:transaction_id
 * Fetch all match records for a given transaction, ordered by descending score.
 */
export async function getMatches(req: Request, res: Response) {
  try {
    const { transaction_id } = req.params

    // Query the matches table
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('transaction_id', transaction_id)
      .order('score', { ascending: false })

    if (error) {
      console.error('❌ Error fetching matches:', error)
      return res.status(500).json({ error: error.message })
    }

    // Return the array of Match objects
    return res.status(200).json(matches)
  } catch (err: any) {
    console.error('🔥 getMatches failed:', err)
    return res.status(500).json({ error: err.message })
  }
}
