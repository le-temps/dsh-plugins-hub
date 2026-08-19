import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryStore } from '../src/memory-store.js'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('MemoryStore for Agent Memory', () => {
  let testDir: string
  let store: MemoryStore

  beforeEach(async () => {
    testDir = join(tmpdir(), `dsh-memory-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await fs.mkdir(testDir, { recursive: true })
    store = new MemoryStore(testDir)
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {}
  })

  it('should initialize default memory file when not present', async () => {
    const memory = await store.load()
    expect(memory).toEqual({
      project_context: [],
      user_preferences: [],
      lessons_learned: [],
    })
  })

  it('should append, replace and delete memory items accurately', async () => {
    await store.append('project_context', 'Uses TypeScript and Cordis')
    await store.append('project_context', 'Monorepo managed with pnpm')

    let memory = await store.load()
    expect(memory.project_context).toHaveLength(2)
    expect(memory.project_context[0]).toBe('Uses TypeScript and Cordis')

    await store.replace('project_context', 0, 'Uses TypeScript NodeNext and Cordis')
    memory = await store.load()
    expect(memory.project_context[0]).toBe('Uses TypeScript NodeNext and Cordis')

    await store.delete('project_context', 1)
    memory = await store.load()
    expect(memory.project_context).toHaveLength(1)
    expect(memory.project_context[0]).toBe('Uses TypeScript NodeNext and Cordis')
  })
})
