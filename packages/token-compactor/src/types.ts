/**
 * Configuration options and types for `@le-temps/dsh-token-compactor`.
 */

export type CompactionStrategy = 'head-tail' | 'truncate-middle' | 'summary-marker'

export interface CompactorConfig {
  /** Whether token compaction is enabled (default: true). */
  enabled?: boolean
  /**
   * Number of most recent conversation turns to keep completely uncompressed (default: 6).
   * 1 turn = 1 user message + agent thought/calls + tool results.
   */
  recentTurnsToPreserve?: number
  /**
   * Maximum character length for individual tool call output in older turns (default: 600).
   * Outputs exceeding this limit will be compacted.
   */
  maxToolOutputChars?: number
  /**
   * Characters to keep at the start (head) of large tool outputs (default: 250).
   */
  headChars?: number
  /**
   * Characters to keep at the end (tail) of large tool outputs (default: 250).
   */
  tailChars?: number
  /**
   * Compaction strategy (default: 'head-tail').
   */
  strategy?: CompactionStrategy
  /**
   * Important keywords that should force keeping relevant lines (e.g. error messages).
   */
  criticalKeywords?: string[]
}

export interface CompactionStats {
  originalLength: number
  compactedLength: number
  savedCharacters: number
  estimatedSavedTokens: number
  compactedToolOutputsCount: number
}

export interface GenericMessage {
  role: 'user' | 'assistant' | 'tool' | 'system' | string
  content?: string | any[]
  name?: string
  tool_call_id?: string
  [key: string]: any
}
