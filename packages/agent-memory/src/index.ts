/**
 * Long-term core memory for DeepSeek Harness agents with self-evolution.
 *
 * Inspired by MemGPT's Core Memory architecture: the agent owns its own memory
 * via explicit tools (append / replace / reflect), and the memory is injected
 * into the System Prompt on every session. A periodic self-reflection mechanism
 * allows the agent to consolidate, prune, and evolve its memory autonomously.
 *
 * @module @le-temps/dsh-agent-memory
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { MemoryStore, type MemoryData } from './memory-store.js'

export const name = 'agent-memory'
export const inject = ['systemPrompt', 'tools']

/**
 * Format the memory data into a human-readable string for System Prompt injection.
 */
function formatMemoryForPrompt(memory: MemoryData): string {
  const sections: string[] = []

  if (memory.project_context.length > 0) {
    sections.push(
      '## Project Context\n' +
      memory.project_context.map((item, i) => `${i}. ${item}`).join('\n')
    )
  }

  if (memory.user_preferences.length > 0) {
    sections.push(
      '## User Preferences\n' +
      memory.user_preferences.map((item, i) => `${i}. ${item}`).join('\n')
    )
  }

  if (memory.lessons_learned.length > 0) {
    sections.push(
      '## Lessons Learned (Self-Evolution)\n' +
      memory.lessons_learned.map((item, i) => `${i}. ${item}`).join('\n')
    )
  }

  if (sections.length === 0) {
    return 'No long-term memories recorded yet. Use the core_memory_append tool to save important facts.'
  }

  return sections.join('\n\n')
}

/**
 * Register the core memory tools and system prompt section.
 * @param ctx - Cordis context carrying systemPrompt and tools services.
 */
export function apply(ctx: Context): void {
  // Resolve the project root from the working directory
  const cwd = process.cwd()
  const store = new MemoryStore(cwd)

  // ── System Prompt injection ──────────────────────────────────────────
  // Register a dynamic prompt section that reads memory.json on each assembly.
  ctx.systemPrompt.section({
    name: 'memory:core',
    order: -50, // After harness identity (-100), before persona (0)
    text: () => {
      // Synchronous read: we cache the last loaded memory and refresh async.
      // On first assembly the file may not exist yet; the store handles that.
      try {
        // We need a sync path for the prompt section; use a cached value.
        const cached = (store as any)._cache as MemoryData | undefined
        if (!cached) {
          return '<long_term_memory>\nMemory is loading... It will be available on the next turn.\n</long_term_memory>'
        }
        return `<long_term_memory>\n${formatMemoryForPrompt(cached)}\n</long_term_memory>`
      } catch {
        return '<long_term_memory>\nNo memories available.\n</long_term_memory>'
      }
    },
  })

  // Pre-load memory into cache on plugin start
  void store.load().then(data => {
    ;(store as any)._cache = data
  })

  // ── Tool: core_memory_append ─────────────────────────────────────────
  ctx.tools.register(defineTool({
    name: 'core_memory_append',
    description:
      'Append a new fact to your long-term core memory. This memory persists across sessions. '
      + 'Use this proactively whenever you discover important information about the project, '
      + 'the user\'s preferences, coding conventions, architecture decisions, or lessons from mistakes. '
      + 'Sections: "project_context" (project facts, tech stack, architecture), '
      + '"user_preferences" (user habits, style, rules), '
      + '"lessons_learned" (mistakes made, pitfalls discovered, self-improvement notes).',
    parameters: {
      section: {
        type: 'string',
        required: true,
        enum: ['project_context', 'user_preferences', 'lessons_learned'],
        description: 'Which memory section to append to.',
      },
      content: {
        type: 'string',
        required: true,
        description: 'The fact or instruction to remember. Be concise but precise.',
      },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const section = args.section as keyof MemoryData
      const content = args.content.trim()
      if (content.length === 0) {
        throw new Error('Memory content must be non-empty.')
      }
      await store.append(section, content)
      // Refresh cache
      ;(store as any)._cache = await store.load()
      return `✓ Appended to ${section}: "${content}"`
    },
  }))

  // ── Tool: core_memory_replace ────────────────────────────────────────
  ctx.tools.register(defineTool({
    name: 'core_memory_replace',
    description:
      'Replace or update an existing entry in your long-term core memory by its index. '
      + 'Use this when a previously stored fact is outdated, inaccurate, or needs refinement. '
      + 'Check the <long_term_memory> in your system prompt to see current entries and their indices.',
    parameters: {
      section: {
        type: 'string',
        required: true,
        enum: ['project_context', 'user_preferences', 'lessons_learned'],
        description: 'Which memory section contains the entry to replace.',
      },
      index: {
        type: 'integer',
        required: true,
        description: 'The 0-based index of the entry to replace (visible in your system prompt).',
      },
      new_content: {
        type: 'string',
        required: true,
        description: 'The updated content to replace the old entry with.',
      },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const section = args.section as keyof MemoryData
      const index = args.index
      const newContent = args.new_content.trim()
      if (newContent.length === 0) {
        throw new Error('Replacement content must be non-empty.')
      }
      await store.replace(section, index, newContent)
      ;(store as any)._cache = await store.load()
      return `✓ Replaced ${section}[${index}] with: "${newContent}"`
    },
  }))

  // ── Tool: core_memory_delete ─────────────────────────────────────────
  ctx.tools.register(defineTool({
    name: 'core_memory_delete',
    description:
      'Delete an entry from your long-term core memory by its index. '
      + 'Use this to prune obsolete, redundant, or incorrect memories during self-reflection.',
    parameters: {
      section: {
        type: 'string',
        required: true,
        enum: ['project_context', 'user_preferences', 'lessons_learned'],
        description: 'Which memory section contains the entry to delete.',
      },
      index: {
        type: 'integer',
        required: true,
        description: 'The 0-based index of the entry to delete.',
      },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const section = args.section as keyof MemoryData
      const index = args.index
      await store.delete(section, index)
      ;(store as any)._cache = await store.load()
      return `✓ Deleted ${section}[${index}]`
    },
  }))

  // ── Tool: core_memory_reflect ────────────────────────────────────────
  // Self-evolution: the agent can review its own memory and produce insights.
  ctx.tools.register(defineTool({
    name: 'core_memory_reflect',
    description:
      'Review your entire long-term core memory and return it for self-reflection. '
      + 'Use this periodically (especially at the start of complex tasks) to: '
      + '1) Check if any stored facts are outdated and should be replaced or deleted. '
      + '2) Identify patterns across lessons_learned that suggest systemic improvements. '
      + '3) Consolidate redundant entries. '
      + 'After reflecting, use core_memory_replace or core_memory_delete to evolve your memory.',
    parameters: {},
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute() {
      const memory = await store.load()
      ;(store as any)._cache = memory
      const total =
        memory.project_context.length +
        memory.user_preferences.length +
        memory.lessons_learned.length

      let report = `=== Core Memory Reflection ===\n`
      report += `Total entries: ${total}\n\n`
      report += formatMemoryForPrompt(memory)
      report += `\n\n=== Self-Evolution Guidance ===\n`
      report += `Review the above entries. Consider:\n`
      report += `- Are any project_context entries outdated after recent changes?\n`
      report += `- Can any lessons_learned be generalized into broader rules?\n`
      report += `- Are there redundant entries that should be consolidated?\n`
      report += `- Have any user_preferences changed based on recent interactions?\n`
      report += `Use core_memory_replace, core_memory_delete, or core_memory_append to evolve.`

      return report
    },
  }))
}
