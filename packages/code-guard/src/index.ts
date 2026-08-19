/**
 * Pre-execution Security & Destructive Command Guard plugin for DeepSeek Harness.
 *
 * Intercepts dangerous agent shell executions and file modifications (e.g. `rm -rf /`,
 * disk formatting, fork bombs, credential leakage) before they can harm the host system,
 * returning structured remediation messages to guide the agent to safe alternatives.
 *
 * @module @le-temps/dsh-code-guard
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { inspectAction, BUILTIN_RULES, DEFAULT_PROTECTED_PATHS } from './rules.js'
import type { CodeGuardConfig, InspectionResult, GuardRule } from './types.js'

export * from './types.js'
export * from './rules.js'

export const name = 'code-guard'
export const inject = ['tools']

export interface CodeGuardService {
  config: CodeGuardConfig
  inspectAction: (
    toolName: string,
    payload: { command?: string; path?: string; content?: string }
  ) => InspectionResult
  addRule: (rule: GuardRule) => void
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    codeGuard: CodeGuardService
  }
}

/**
 * Apply code-guard plugin to Cordis context.
 */
export function apply(ctx: Context, config?: CodeGuardConfig): void {
  const customRules: GuardRule[] = [...(config?.customRules || [])]

  const service: CodeGuardService = {
    config: config || { mode: 'strict', enabled: true },
    inspectAction: (toolName, payload) => {
      return inspectAction(toolName, payload, { ...config, customRules })
    },
    addRule: (rule) => {
      customRules.push(rule)
    },
  }

  // Register service on Cordis context
  ctx.set('codeGuard', service)

  // Register guard inspection tool for self-checking
  ctx.tools.register(
    defineTool({
      name: 'code_guard_check',
      description:
        'Pre-check a shell command or file path against safety and destructive-action rules before execution.',
      parameters: {
        command: {
          type: 'string',
          description: 'The shell command line to verify for safety.',
        },
        path: {
          type: 'string',
          description: 'The target file or directory path to check.',
        },
      },
      execute: async ({ command, path }) => {
        const res = service.inspectAction('manual_check', { command, path })
        return {
          allowed: res.allowed,
          matchedRulesCount: res.matchedRules.length,
          remediation: res.remediation,
          warnings: res.warnings,
        }
      },
    })
  )
}
