# @le-temps/dsh-agent-memory

> 🧠 Long-term Core Memory plugin for DeepSeek Harness — with self-evolution

Inspired by [MemGPT](https://github.com/cpacker/MemGPT)'s Core Memory architecture, this plugin gives your DeepSeek Harness agent **persistent, cross-session memory** that it can read, write, and evolve on its own.

## How it works

```
┌───────────────────────────────────────────────────────┐
│                   Session N+1                         │
│                                                       │
│  ┌─────────────┐    ┌──────────────────────────────┐  │
│  │ System      │◄───│ .agents/memory.json           │  │
│  │ Prompt      │    │ ┌──────────────────────────┐ │  │
│  │ <long_term  │    │ │ project_context: [...]    │ │  │
│  │  _memory>   │    │ │ user_preferences: [...]   │ │  │
│  │ ...         │    │ │ lessons_learned: [...]     │ │  │
│  └─────────────┘    │ └──────────────────────────┘ │  │
│                     └──────────────────────────────┘  │
│         ▲                        ▲                    │
│         │ inject                 │ read/write         │
│         │                        │                    │
│  ┌──────┴────────────────────────┴─────────────────┐  │
│  │              Agent (LLM)                        │  │
│  │  Tools:                                         │  │
│  │    core_memory_append   → add a new fact         │  │
│  │    core_memory_replace  → update existing entry  │  │
│  │    core_memory_delete   → prune obsolete entry   │  │
│  │    core_memory_reflect  → self-review & evolve   │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

## Features

### 📝 Core Memory Tools (MemGPT-style)
The agent is equipped with 4 tools to manage its own memory:

| Tool | Description |
|------|-------------|
| `core_memory_append` | Add a new fact to a memory section |
| `core_memory_replace` | Update an existing entry by index |
| `core_memory_delete` | Remove an obsolete or redundant entry |
| `core_memory_reflect` | Review all memory and receive self-evolution guidance |

### 🧬 Self-Evolution
The `core_memory_reflect` tool and `lessons_learned` section enable a self-improvement loop:
1. The agent encounters a mistake or learns something new during a task.
2. It stores the lesson in `lessons_learned` via `core_memory_append`.
3. On future sessions, it calls `core_memory_reflect` to review past lessons.
4. It consolidates, generalizes, or prunes entries to keep memory sharp.

### 📂 Memory Sections
Memory is organized into 3 semantic sections:

- **`project_context`** — Project architecture, tech stack, file structure, conventions.
- **`user_preferences`** — User's coding style, preferred tools, language, rules.
- **`lessons_learned`** — Past mistakes, discovered pitfalls, optimization insights.

### 💾 Storage
All memory is stored in a simple JSON file at `.agents/memory.json` in your project root. No external databases, no Docker, no vector stores — just a file that lives alongside your code.

## Installation

```bash
npm install @le-temps/dsh-agent-memory
```

## Usage (cordis.yml)

Add the plugin to your DeepSeek Harness configuration:

```yaml
plugins:
  - name: '@le-temps/dsh-agent-memory'
```

## Example Interaction

**Session 1:**
```
User: "Please migrate the database from MySQL to PostgreSQL"
Agent: [works on migration, encounters timezone issue]
Agent: [calls core_memory_append]
  → section: "project_context"
  → content: "Database is PostgreSQL 16, migrated from MySQL on 2026-08-14"
Agent: [calls core_memory_append]
  → section: "lessons_learned"
  → content: "PostgreSQL handles timezones differently from MySQL — always use TIMESTAMPTZ"
```

**Session 2 (days later):**
```
User: "Write a query to fetch user activity logs"
Agent: [reads <long_term_memory> from system prompt]
Agent: "I see from my memory that this project uses PostgreSQL 16.
        I'll use TIMESTAMPTZ for the timestamp column based on a past lesson."
```

## License

MIT
