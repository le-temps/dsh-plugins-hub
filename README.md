# DeepSeek Harness Plugins Hub

Welcome to the **DeepSeek Harness Plugins Hub** (`dsh-plugins-hub`)! 

This repository is a community-driven collection of advanced, production-ready plugins designed to extend and enhance the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) ecosystem.

## 🚀 Philosophy

DeepSeek Harness is built on the [Cordis](https://cordis.js.org/) architecture, where **"Everything is a Plugin"**. 
Instead of waiting for official upstream updates or maintaining a heavy fork of the core repository, this hub provides drop-in replacement plugins that you can easily install and mount via your `cordis.yml` configuration.

## 📦 Available Plugins

Currently, this repository maintains the following enhanced plugins:

### 1. `@le-temps/dsh-hooks-claude-code`
An enhanced hook bridge for Claude Code that includes infinite loop protection and true run-level halting.
- **Key Feature**: Defends against rogue scripts forcing infinite agent loops (Stop-Loop-Guard) and allows hooks to gracefully cancel the entire agent lifecycle.
- [View Documentation](./packages/hooks-claude-code/README.md)

### 2. `@le-temps/dsh-hooks-codex`
An enhanced hook bridge for Codex featuring the same architectural loop-guards and safe-exit capabilities as our Claude Code adapter.
- **Key Feature**: Prevents agent deadlocks when parsing Codex tool outputs.
- [View Documentation](./packages/hooks-codex/README.md)

### 3. `@le-temps/dsh-agent-memory` 🆕
Long-term Core Memory plugin with self-evolution, inspired by MemGPT. Gives your agent persistent cross-session memory.
- **Key Feature**: 4 memory tools (`append` / `replace` / `delete` / `reflect`) let the agent proactively manage its own knowledge base and evolve over time.
- [View Documentation](./packages/agent-memory/README.md)

## 🛠️ Usage

To use any of these plugins in your DeepSeek Harness environment:

1. Install the plugin via npm/pnpm:
   ```bash
   npm install @le-temps/dsh-hooks-claude-code
   ```
2. Mount it in your `cordis.yml` configuration:
   ```yaml
   plugins:
     - @le-temps/dsh-hooks-claude-code:
         configPath: ./.claude/hooks.json
   ```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/le-temps/dsh-plugins-hub/issues). If you have an idea for a new plugin that benefits the DeepSeek Harness ecosystem, consider adding it to this hub.

## 📄 License

This project is licensed under the MIT License.
