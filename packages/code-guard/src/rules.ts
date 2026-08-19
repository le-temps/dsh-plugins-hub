import type { GuardRule, CodeGuardConfig, InspectionResult } from './types.js'

export const BUILTIN_RULES: GuardRule[] = [
  {
    id: 'rm-root-destructive',
    name: 'Destructive Root / Home Deletion',
    pattern: /\brm\s+-[a-zA-Z0-9]*[rf][a-zA-Z0-9]*\s+(\/|~|\$HOME|\.\.|\/\*)/i,
    severity: 'critical',
    message: 'Destructive root or home directory deletion detected.',
    action: 'block',
    targetTools: ['bash', 'shell', 'run_command', 'terminal'],
  },
  {
    id: 'powershell-destructive-system',
    name: 'PowerShell System Deletion',
    pattern: /\b(Remove-Item|del|rmdir|rd)\b.*(-Recurse|-r|-Force|-f).*(C:\\|C:\/|\$env:SystemRoot|\$env:WINDIR)/i,
    severity: 'critical',
    message: 'Destructive deletion of system drive detected.',
    action: 'block',
    targetTools: ['bash', 'shell', 'run_command', 'terminal'],
  },
  {
    id: 'fork-bomb',
    name: 'Fork Bomb or Process Exhaustion',
    pattern: /:\(\)\s*\{\s*:\|:&\s*\};:|while\s+true\s*;\s*do\s*fork|fork\(\)\s*while/i,
    severity: 'critical',
    message: 'Fork bomb or infinite process spawning detected.',
    action: 'block',
    targetTools: ['bash', 'shell', 'run_command', 'terminal'],
  },
  {
    id: 'raw-disk-overwrite',
    name: 'Raw Disk Overwrite',
    pattern: /\b(dd\s+if=\/dev\/(zero|urandom|null)\s+of=\/dev\/(sd[a-z]|nvme|hd[a-z]|disk))\b|\bmkfs\b/i,
    severity: 'critical',
    message: 'Direct disk formatting or raw partition overwrite command detected.',
    action: 'block',
    targetTools: ['bash', 'shell', 'run_command', 'terminal'],
  },
  {
    id: 'secret-exfiltration',
    name: 'Potential Secret Exfiltration',
    pattern: /\b(curl|wget|nc|ncat)\b.*(@\.env|\.env|\.ssh\/id_rsa|\.aws\/credentials)/i,
    severity: 'high',
    message: 'Attempt to exfiltrate secret credential files (.env, .ssh, .aws) over network.',
    action: 'block',
    targetTools: ['bash', 'shell', 'run_command', 'terminal'],
  },
  {
    id: 'git-force-push-main',
    name: 'Force Push to Protected Branch',
    pattern: /\bgit\s+push\b.*(-f|--force).*(main|master|prod|production|release)\b/i,
    severity: 'high',
    message: 'Force push to production branch detected. Please push safely or use feature branch.',
    action: 'warn',
    targetTools: ['bash', 'shell', 'run_command', 'terminal'],
  },
]

export const DEFAULT_PROTECTED_PATHS: string[] = [
  '/.ssh',
  '/etc/shadow',
  '/etc/sudoers',
  'C:\\Windows\\System32',
  '.git/config',
  'id_rsa',
  'id_ed25519',
]

/**
 * Inspect a command line or target path against safety rules.
 */
export function inspectAction(
  toolName: string,
  payload: { command?: string; path?: string; content?: string },
  config?: CodeGuardConfig
): InspectionResult {
  const mergedRules = [...BUILTIN_RULES, ...(config?.customRules || [])]
  const mode = config?.mode || 'strict'
  const allowlist = config?.allowlist || []
  const protectedPaths = [...DEFAULT_PROTECTED_PATHS, ...(config?.protectedPaths || [])]

  const matchedRules: GuardRule[] = []
  const warnings: string[] = []

  // Check command string
  if (payload.command) {
    const cmd = payload.command.trim()

    // Check allowlist first
    if (allowlist.some((allow) => cmd.includes(allow))) {
      return { allowed: true, matchedRules: [], warnings: [] }
    }

    for (const rule of mergedRules) {
      if (rule.targetTools && !rule.targetTools.some((t) => toolName.toLowerCase().includes(t))) {
        continue
      }

      let isMatch = false
      if (typeof rule.pattern === 'string') {
        isMatch = cmd.includes(rule.pattern)
      } else if (rule.pattern instanceof RegExp) {
        isMatch = rule.pattern.test(cmd)
      }

      if (isMatch) {
        matchedRules.push(rule)
        if (rule.action === 'block' || (mode === 'strict' && rule.severity === 'critical')) {
          return {
            allowed: false,
            matchedRules,
            remediation: `[Security Violation]: Rule "${rule.name}" triggered: ${rule.message}\nPlease rewrite the command using a safe, targeted alternative.`,
            warnings,
          }
        } else {
          warnings.push(`[Security Warning]: ${rule.name} - ${rule.message}`)
        }
      }
    }
  }

  // Check target path for file operations
  if (payload.path) {
    const targetPath = payload.path.replace(/\\/g, '/')
    for (const protectedPath of protectedPaths) {
      const normalizedProtected = protectedPath.replace(/\\/g, '/')
      if (targetPath.includes(normalizedProtected)) {
        const rule: GuardRule = {
          id: 'protected-path-access',
          name: 'Protected System/Secret Path Access',
          pattern: protectedPath,
          severity: 'critical',
          message: `Direct modification or deletion of protected path "${protectedPath}" is forbidden.`,
          action: 'block',
        }
        return {
          allowed: false,
          matchedRules: [rule],
          remediation: `[Security Violation]: Modifying protected path "${protectedPath}" is restricted.`,
          warnings,
        }
      }
    }
  }

  return {
    allowed: true,
    matchedRules,
    warnings,
  }
}
