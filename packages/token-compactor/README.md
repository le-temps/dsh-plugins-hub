# @le-temps/dsh-token-compactor

[![npm version](https://img.shields.io/npm/v/@le-temps/dsh-token-compactor.svg)](https://www.npmjs.com/package/@le-temps/dsh-token-compactor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Context Window Compactor and Token Guard for DeepSeek Harness Agents.**

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) agents often generate large tool outputs (e.g. `cat`, `grep`, `git log`, test runs) that degrade attention and quickly hit token limits. `@le-temps/dsh-token-compactor` solves this by intelligently compacting old verbose tool outputs while preserving recent turns and critical error signals.

---

## ✨ Features

- 🧠 **Smart Context Compaction**: Automatically detects and compacts excessive tool output in older conversation turns.
- 🛡️ **Critical Signal Preservation**: Automatically scans and preserves lines containing error traces, warnings, and panic messages even when in the middle of omitted blocks.
- ⏳ **Recent Turns Protection**: Guarantees the most recent $K$ turns remain 100% untouched for flawless reasoning.
- 📊 **Live Inspection Tool**: Provides a built-in `token_compactor_status` tool to query live token savings.

---

## 📦 Installation

```bash
npm install @le-temps/dsh-token-compactor
# or
pnpm add @le-temps/dsh-token-compactor
```

---

## 🚀 Usage

Mount the plugin in your `cordis.yml` configuration:

```yaml
plugins:
  - @le-temps/dsh-token-compactor:
      enabled: true
      recentTurnsToPreserve: 6
      maxToolOutputChars: 600
      headChars: 250
      tailChars: 250
      criticalKeywords:
        - error
        - failed
        - exception
        - traceback
        - panic
```

### TypeScript API

```typescript
import { compactHistory, compactToolOutput } from '@le-temps/dsh-token-compactor'

const { messages, stats } = compactHistory(sessionMessages, {
  recentTurnsToPreserve: 4,
  maxToolOutputChars: 500,
})

console.log(`Saved ~${stats.estimatedSavedTokens} tokens!`)
```

---

## 📄 License

MIT License © 2026 le-temps.
