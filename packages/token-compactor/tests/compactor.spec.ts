import { describe, it, expect } from 'vitest'
import { compactToolOutput, compactHistory, estimateTokens } from '../src/compactor.js'

describe('Token Compactor Engine', () => {
  it('should estimate tokens reasonably', () => {
    const text = 'Hello world, this is a test prompt with some code: const x = 42;'
    const tokens = estimateTokens(text)
    expect(tokens).toBeGreaterThan(5)
    expect(tokens).toBeLessThan(40)
  })

  it('should not alter short tool outputs below maxToolOutputChars', () => {
    const shortText = 'File created successfully at /path/to/file.ts'
    const result = compactToolOutput(shortText, { maxToolOutputChars: 500 })
    expect(result.result).toBe(shortText)
    expect(result.originalLength).toBe(shortText.length)
  })

  it('should compact large tool outputs and preserve head and tail', () => {
    const lines = []
    for (let i = 1; i <= 200; i++) {
      lines.push(`Line ${i}: log output data timestamp=2026-08-19 iteration=${i}`)
    }
    const longText = lines.join('\n')

    const result = compactToolOutput(longText, {
      maxToolOutputChars: 300,
      headChars: 150,
      tailChars: 150,
    })

    expect(result.compactedLength).toBeLessThan(result.originalLength)
    expect(result.result).toContain('Line 1:')
    expect(result.result).toContain('Line 200:')
    expect(result.result).toContain('Omitted')
  })

  it('should preserve critical error lines even when in the middle of long output', () => {
    const lines = []
    for (let i = 1; i <= 100; i++) {
      if (i === 50) {
        lines.push('FATAL ERROR: NullPointerException at database.ts:42')
      } else {
        lines.push(`DEBUG [worker-${i}] Normal status ok`)
      }
    }
    const longText = lines.join('\n')

    const result = compactToolOutput(longText, {
      maxToolOutputChars: 300,
      headChars: 100,
      tailChars: 100,
      criticalKeywords: ['fatal error'],
    })

    expect(result.result).toContain('Preserved Critical Signals')
    expect(result.result).toContain('NullPointerException')
  })

  it('should compact older history messages while protecting recent turns', () => {
    const history = [
      { role: 'user', content: 'Turn 1: Please check logs.' },
      {
        role: 'tool',
        name: 'run_bash',
        content: new Array(150).fill('Very long historical log line message data').join('\n'),
      },
      { role: 'assistant', content: 'Turn 1 complete.' },
      { role: 'user', content: 'Turn 2: Read file.' },
      {
        role: 'tool',
        name: 'read_file',
        content: new Array(150).fill('Another very long tool content line').join('\n'),
      },
      { role: 'assistant', content: 'Turn 2 complete.' },
      { role: 'user', content: 'Turn 3 (Recent): What is the latest status?' },
      {
        role: 'tool',
        name: 'status',
        content: new Array(100).fill('Recent tool output should not be compacted').join('\n'),
      },
    ]

    const { messages, stats } = compactHistory(history, {
      recentTurnsToPreserve: 1,
      maxToolOutputChars: 200,
      headChars: 100,
      tailChars: 100,
    })

    expect(stats.savedCharacters).toBeGreaterThan(0)
    expect(stats.compactedToolOutputsCount).toBe(2) // Only the older 2 turns compacted
    expect(messages[messages.length - 1].content).toContain('Recent tool output should not be compacted')
    expect(messages[1].content).toContain('Omitted')
  })
})
