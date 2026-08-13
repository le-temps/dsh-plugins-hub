# @le-temps/dsh-agent-memory

> 🧠 Long-term Core Memory plugin for DeepSeek Harness — with self-evolution
>
> 🧠 DeepSeek Harness 长期核心记忆插件 — 支持自进化

Inspired by [MemGPT](https://github.com/cpacker/MemGPT)'s Core Memory architecture, this plugin gives your DeepSeek Harness agent **persistent, cross-session memory** that it can read, write, and evolve on its own.

灵感源自 [MemGPT](https://github.com/cpacker/MemGPT) 的核心记忆架构，本插件为你的 DeepSeek Harness Agent 赋予**持久化、跨会话的长期记忆**能力，并且 Agent 可以自主地读取、写入和进化自己的记忆。

## How it works / 工作原理

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

## Features / 功能特性

### 📝 Core Memory Tools (MemGPT-style) / 核心记忆工具

The agent is equipped with 4 tools to manage its own memory:

Agent 拥有 4 个工具来主动管理自己的记忆：

| Tool / 工具 | EN | 中文 |
|------|------|------|
| `core_memory_append` | Add a new fact to a memory section | 向记忆分区追加新事实 |
| `core_memory_replace` | Update an existing entry by index | 按索引更新已有记忆条目 |
| `core_memory_delete` | Remove an obsolete or redundant entry | 删除过时或冗余的记忆条目 |
| `core_memory_reflect` | Review all memory and receive self-evolution guidance | 审视全部记忆并获取自进化建议 |

### 🧬 Self-Evolution / 自进化

The `core_memory_reflect` tool and `lessons_learned` section enable a self-improvement loop:

`core_memory_reflect` 工具与 `lessons_learned` 分区共同构成了一个自我进化闭环：

1. The agent encounters a mistake or learns something new during a task.
   Agent 在任务中犯了错误或学到了新知识。
2. It stores the lesson in `lessons_learned` via `core_memory_append`.
   通过 `core_memory_append` 将教训存入 `lessons_learned`。
3. On future sessions, it calls `core_memory_reflect` to review past lessons.
   在未来的会话中，调用 `core_memory_reflect` 审视过去的教训。
4. It consolidates, generalizes, or prunes entries to keep memory sharp.
   合并、泛化或裁剪条目，使记忆保持精炼。

### 📂 Memory Sections / 记忆分区

Memory is organized into 3 semantic sections:

记忆被组织为 3 个语义分区：

| Section / 分区 | EN | 中文 |
|------|------|------|
| `project_context` | Project architecture, tech stack, file structure, conventions | 项目架构、技术栈、文件结构、编码规范 |
| `user_preferences` | User's coding style, preferred tools, language, rules | 用户编码风格、偏好工具、语言、规则 |
| `lessons_learned` | Past mistakes, discovered pitfalls, optimization insights | 过往错误、踩坑经验、优化心得 |

### 💾 Storage / 存储

All memory is stored in a simple JSON file at `.agents/memory.json` in your project root. No external databases, no Docker, no vector stores — just a file that lives alongside your code.

所有记忆存储在项目根目录下的 `.agents/memory.json` 文件中。无需外部数据库、Docker 或向量存储 —— 仅仅是一个与你的代码共生的 JSON 文件。

## Installation / 安装

```bash
npm install @le-temps/dsh-agent-memory
```

## Usage / 使用方式

Add the plugin to your DeepSeek Harness configuration:

在你的 DeepSeek Harness 配置中加载插件：

```yaml
plugins:
  - name: '@le-temps/dsh-agent-memory'
```

## Example / 使用示例

**Session 1:**
```
User: "Please migrate the database from MySQL to PostgreSQL"
       "请把数据库从 MySQL 迁移到 PostgreSQL"

Agent: [works on migration, encounters timezone issue]
       [执行迁移，遇到时区问题]

Agent: [calls core_memory_append]
  → section: "project_context"
  → content: "Database is PostgreSQL 16, migrated from MySQL on 2026-08-14"

Agent: [calls core_memory_append]
  → section: "lessons_learned"
  → content: "PostgreSQL handles timezones differently — always use TIMESTAMPTZ"
```

**Session 2 (days later / 数天后):**
```
User: "Write a query to fetch user activity logs"
       "写一个查询来获取用户活动日志"

Agent: [reads <long_term_memory> from system prompt]
       [从 system prompt 中读取 <long_term_memory>]

Agent: "I see from my memory that this project uses PostgreSQL 16.
        I'll use TIMESTAMPTZ for the timestamp column based on a past lesson."
       "根据我的记忆，这个项目使用 PostgreSQL 16。
        基于过去的教训，我会使用 TIMESTAMPTZ 作为时间戳列的类型。"
```

## License / 许可证

MIT
