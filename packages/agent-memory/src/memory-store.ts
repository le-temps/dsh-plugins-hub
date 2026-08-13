import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export interface MemoryData {
  /**
   * Facts and instructions about the current project and its architecture.
   */
  project_context: string[]
  
  /**
   * User preferences and general rules the agent should follow.
   */
  user_preferences: string[]
  
  /**
   * Self-evolution: Lessons learned from mistakes or long tasks.
   */
  lessons_learned: string[]
}

const DEFAULT_MEMORY: MemoryData = {
  project_context: [],
  user_preferences: [],
  lessons_learned: []
}

export class MemoryStore {
  private readonly filepath: string

  constructor(cwd: string) {
    this.filepath = join(cwd, '.agents', 'memory.json')
  }

  /**
   * Ensures the .agents directory exists and returns the current memory data.
   */
  async load(): Promise<MemoryData> {
    try {
      const data = await fs.readFile(this.filepath, 'utf-8')
      return JSON.parse(data) as MemoryData
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        // Create the directory if it doesn't exist
        await fs.mkdir(join(this.filepath, '..'), { recursive: true })
        // Initialize with default memory
        await this.save(DEFAULT_MEMORY)
        return DEFAULT_MEMORY
      }
      throw e
    }
  }

  /**
   * Saves the memory data to disk.
   */
  async save(data: MemoryData): Promise<void> {
    await fs.writeFile(this.filepath, JSON.stringify(data, null, 2), 'utf-8')
  }

  /**
   * Appends an item to a specific section of the memory.
   */
  async append(section: keyof MemoryData, item: string): Promise<void> {
    const memory = await this.load()
    if (!memory[section]) {
      memory[section] = []
    }
    memory[section].push(item)
    await this.save(memory)
  }

  /**
   * Replaces a specific item in a section by its index.
   */
  async replace(section: keyof MemoryData, index: number, newItem: string): Promise<void> {
    const memory = await this.load()
    if (!memory[section] || index < 0 || index >= memory[section].length) {
      throw new Error(`Invalid section or index: ${section}[${index}]`)
    }
    memory[section][index] = newItem
    await this.save(memory)
  }

  /**
   * Deletes an item from a section by its index.
   */
  async delete(section: keyof MemoryData, index: number): Promise<void> {
    const memory = await this.load()
    if (!memory[section] || index < 0 || index >= memory[section].length) {
      throw new Error(`Invalid section or index: ${section}[${index}]`)
    }
    memory[section].splice(index, 1)
    await this.save(memory)
  }
}
