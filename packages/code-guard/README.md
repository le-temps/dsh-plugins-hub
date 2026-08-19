# @le-temps/dsh-code-guard

[![npm version](https://img.shields.io/npm/v/@le-temps/dsh-code-guard.svg)](https://www.npmjs.com/package/@le-temps/dsh-code-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Pre-execution Security & Destructive Command Guard for DeepSeek Harness Agents.**

When autonomous AI agents execute shell commands or write code, there is a risk of destructive actions (e.g. `rm -rf /`, formatting partitions, fork bombs, leaking `.env` secrets, or overwriting `.ssh` keys). `@le-temps/dsh-code-guard` intercepts tool executions and validates them against configurable safety rule trees, feeding constructive remediation advice back to the agent without crashing the session.

---

## ✨ Features

- 🛑 **Destructive Command Interception**: Blocks `rm -rf /`, `mkfs`, fork bombs, system partition overwrites, and destructive system PowerShell commands.
- 🔐 **Secret Leakage Prevention**: Detects and blocks network exfiltration of `.env`, `id_rsa`, and cloud credentials.
- 📁 **Protected Paths**: Locks down critical system directories and private credentials.
- 🤖 **Agent Remediation Feedback**: Instead of silently failing, returns structured guidance telling the LLM why the command was unsafe and how to reformulate it.
- ⚙️ **Configurable Modes**: Supports `strict` (block on critical/high) and `advisory` (warning prompts only).

---

## 📦 Installation

```bash
npm install @le-temps/dsh-code-guard
# or
pnpm add @le-temps/dsh-code-guard
```

---

## 🚀 Usage

Mount the plugin in your `cordis.yml` configuration:

```yaml
plugins:
  - @le-temps/dsh-code-guard:
      mode: strict
      protectedPaths:
        - ./.env
        - ~/.ssh
      allowlist:
        - https://trusted-internal-domain.com
```

### TypeScript API

```typescript
import { inspectAction } from '@le-temps/dsh-code-guard'

const result = inspectAction('bash', {
  command: 'rm -rf /',
})

if (!result.allowed) {
  console.error(result.remediation)
  // Output: [Security Violation]: Rule "Destructive Root / Home Deletion" triggered...
}
```

---

## 📄 License

MIT License © 2026 le-temps.
