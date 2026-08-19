import type { CompactorConfig, CompactionStats, GenericMessage } from './types.js'

export const DEFAULT_CONFIG: Required<CompactorConfig> = {
  enabled: true,
  recentTurnsToPreserve: 6,
  maxToolOutputChars: 600,
  headChars: 250,
  tailChars: 250,
  strategy: 'head-tail',
  criticalKeywords: ['error', 'failed', 'exception', 'panic', 'traceback', 'exit code', 'fatal', 'warning'],
}

/**
 * Heuristic token estimator (averages ~3.5 chars per token for mixed code & text).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  let tokenEstimate = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    // CJK and full-width ranges consume ~0.8-1 token per char
    if (code >= 0x4e00 && code <= 0x9fff) {
      tokenEstimate += 1
    } else {
      // Latin / numbers / symbols ~0.28 tokens per char
      tokenEstimate += 0.28
    }
  }
  return Math.ceil(tokenEstimate)
}

/**
 * Compacts a single large tool output text while preserving critical lines (errors, stacktraces).
 */
export function compactToolOutput(
  text: string,
  userConfig?: Partial<CompactorConfig>
): { result: string; originalLength: number; compactedLength: number } {
  const config = { ...DEFAULT_CONFIG, ...userConfig }
  const originalLength = text.length

  if (!config.enabled || originalLength <= config.maxToolOutputChars) {
    return { result: text, originalLength, compactedLength: originalLength }
  }

  const lines = text.split('\n')
  const headTargetChars = config.headChars
  const tailTargetChars = config.tailChars

  // Find critical lines containing important keywords anywhere in the text
  const criticalLines: string[] = []
  const lowerKeywords = config.criticalKeywords.map((k) => k.toLowerCase())

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lowerLine = line.toLowerCase()
    if (lowerKeywords.some((kw) => lowerLine.includes(kw))) {
      criticalLines.push(`[Line ${i + 1}] ${line.trim()}`)
    }
  }

  // Extract head slice
  let headSlice = ''
  let currentHeadChars = 0
  for (let i = 0; i < lines.length; i++) {
    if (currentHeadChars + lines[i].length > headTargetChars && headSlice.length > 0) {
      break
    }
    headSlice += (headSlice ? '\n' : '') + lines[i]
    currentHeadChars += lines[i].length + 1
  }

  // Extract tail slice
  let tailSlice = ''
  let currentTailChars = 0
  for (let i = lines.length - 1; i >= 0; i--) {
    if (currentTailChars + lines[i].length > tailTargetChars && tailSlice.length > 0) {
      break
    }
    tailSlice = lines[i] + (tailSlice ? '\n' : '') + tailSlice
    currentTailChars += lines[i].length + 1
  }

  const omittedChars = Math.max(0, originalLength - headSlice.length - tailSlice.length)
  const omittedLines = Math.max(0, lines.length - (headSlice.split('\n').length + tailSlice.split('\n').length))

  let marker = `\n\n... [Omitted ${omittedLines} lines (~${omittedChars} chars) by token-compactor] ...\n`

  if (criticalLines.length > 0) {
    const deduplicatedCritical = criticalLines.slice(0, 5).join('\n')
    marker += `\n[Preserved Critical Signals]:\n${deduplicatedCritical}\n`
  }

  const result = `${headSlice}${marker}\n${tailSlice}`
  return {
    result,
    originalLength,
    compactedLength: result.length,
  }
}

/**
 * Compacts conversation history messages.
 * Protects recent turns, and compacts old large tool outputs and verbose logs.
 */
export function compactHistory<T extends GenericMessage>(
  messages: T[],
  userConfig?: Partial<CompactorConfig>
): { messages: T[]; stats: CompactionStats } {
  const config = { ...DEFAULT_CONFIG, ...userConfig }

  if (!config.enabled || messages.length === 0) {
    const totalLen = messages.reduce((acc, m) => acc + (typeof m.content === 'string' ? m.content.length : 0), 0)
    return {
      messages,
      stats: {
        originalLength: totalLen,
        compactedLength: totalLen,
        savedCharacters: 0,
        estimatedSavedTokens: 0,
        compactedToolOutputsCount: 0,
      },
    }
  }

  let originalTotalChars = 0
  let compactedTotalChars = 0
  let compactedOutputsCount = 0

  // Count turns from the end backwards
  // A turn is roughly bounded by user messages
  let userTurnsCount = 0
  const turnThresholdIndex: number[] = []

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      userTurnsCount++
      if (userTurnsCount === config.recentTurnsToPreserve) {
        turnThresholdIndex.push(i)
        break
      }
    }
  }

  const cutOffIndex = turnThresholdIndex.length > 0 ? turnThresholdIndex[0] : 0

  const compactedMessages = messages.map((msg, index) => {
    const content = msg.content
    const isString = typeof content === 'string'
    const len = isString ? content.length : 0
    originalTotalChars += len

    // If message is in recent turns, keep untouched
    if (index >= cutOffIndex) {
      compactedTotalChars += len
      return msg
    }

    // If it's an older tool output or assistant response that exceeds limit
    if (isString && (msg.role === 'tool' || msg.role === 'assistant' || msg.name)) {
      if (content.length > config.maxToolOutputChars) {
        const compacted = compactToolOutput(content, config)
        compactedTotalChars += compacted.compactedLength
        compactedOutputsCount++
        return {
          ...msg,
          content: compacted.result,
        }
      }
    }

    compactedTotalChars += len
    return msg
  })

  const savedCharacters = Math.max(0, originalTotalChars - compactedTotalChars)
  const estimatedSavedTokens = estimateTokens(new Array(savedCharacters).fill('x').join(''))

  return {
    messages: compactedMessages,
    stats: {
      originalLength: originalTotalChars,
      compactedLength: compactedTotalChars,
      savedCharacters,
      estimatedSavedTokens,
      compactedToolOutputsCount: compactedOutputsCount,
    },
  }
}
