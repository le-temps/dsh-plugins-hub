/**
 * Token and Context Compactor plugin for DeepSeek Harness.
 *
 * Prevents context overflow, attention degradation, and excessive token bills by
 * intelligently compacting earlier tool outputs, logs, and verbose execution results
 * while preserving critical signals (errors, stacktraces) and recent turns.
 *
 * @module @le-temps/dsh-token-compactor
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { compactHistory, compactToolOutput, estimateTokens, DEFAULT_CONFIG } from './compactor.js'
import type { CompactorConfig, CompactionStats } from './types.js'

export * from './types.js'
export * from './compactor.js'

export const name = 'token-compactor'
export const inject = ['tools']

export interface TokenCompactorService {
  config: Required<CompactorConfig>
  stats: CompactionStats
  compactHistory: typeof compactHistory
  compactToolOutput: typeof compactToolOutput
  estimateTokens: typeof estimateTokens
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    tokenCompactor: TokenCompactorService
  }
}

/**
 * Apply token-compactor plugin to Cordis context.
 */
export function apply(ctx: Context, config?: CompactorConfig): void {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  const totalStats: CompactionStats = {
    originalLength: 0,
    compactedLength: 0,
    savedCharacters: 0,
    estimatedSavedTokens: 0,
    compactedToolOutputsCount: 0,
  }

  const service: TokenCompactorService = {
    config: mergedConfig,
    stats: totalStats,
    compactHistory: (messages, cfg) => {
      const res = compactHistory(messages, { ...mergedConfig, ...cfg })
      totalStats.savedCharacters += res.stats.savedCharacters
      totalStats.estimatedSavedTokens += res.stats.estimatedSavedTokens
      totalStats.compactedToolOutputsCount += res.stats.compactedToolOutputsCount
      return res
    },
    compactToolOutput: (text, cfg) => {
      return compactToolOutput(text, { ...mergedConfig, ...cfg })
    },
    estimateTokens,
  }

  // Register service on Cordis context
  ctx.set('tokenCompactor', service)

  // Register an inspect/status tool for the agent and developer
  ctx.tools.register(
    defineTool({
      name: 'token_compactor_status',
      description:
        'Get live metrics and statistics from the Token Compactor plugin, including total characters and estimated tokens saved.',
      parameters: {},
      execute: async () => {
        return {
          enabled: service.config.enabled,
          recentTurnsPreserved: service.config.recentTurnsToPreserve,
          maxToolOutputChars: service.config.maxToolOutputChars,
          savedCharacters: totalStats.savedCharacters,
          estimatedSavedTokens: totalStats.estimatedSavedTokens,
          compactedToolOutputsCount: totalStats.compactedToolOutputsCount,
          summary: `Token Compactor is active. Saved approx ~${totalStats.estimatedSavedTokens} tokens across ${totalStats.compactedToolOutputsCount} verbose tool outputs.`,
        }
      },
    })
  )
}
