/**
 * Configuration and Rule types for `@le-temps/dsh-code-guard`.
 */

export type GuardAction = 'block' | 'warn' | 'allow'

export interface GuardRule {
  id: string
  name: string
  pattern: RegExp | string
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  action: GuardAction
  /** Tools to apply this rule on (e.g. ['bash', 'run_command', 'write_to_file', 'replace_file_content']) */
  targetTools?: string[]
}

export interface CodeGuardConfig {
  /** Whether the code guard is enabled (default: true). */
  enabled?: boolean
  /** Default behavior for detected risks: 'strict' (blocks all critical/high) or 'advisory' (warns only). */
  mode?: 'strict' | 'advisory'
  /** Custom forbidden command regex patterns. */
  customRules?: GuardRule[]
  /** Protected paths where write/delete operations are denied. */
  protectedPaths?: string[]
  /** Allow specific commands even if they match general rules. */
  allowlist?: string[]
}

export interface InspectionResult {
  allowed: boolean
  matchedRules: GuardRule[]
  remediation?: string
  warnings: string[]
}
