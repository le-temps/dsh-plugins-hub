# DeepSeek Harness Plugins Hub

Welcome to the **DeepSeek Harness Plugins Hub** (`dsh-plugins-hub`)!

欢迎来到 **DeepSeek Harness 插件中心** (`dsh-plugins-hub`)！

This repository is a community-driven collection of advanced, production-ready plugins designed to extend and enhance the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) ecosystem.

本仓库是一个社区驱动的高级插件集合，旨在扩展和增强 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 生态系统。

## 🚀 Philosophy / 理念

DeepSeek Harness is built on the [Cordis](https://cordis.js.org/) architecture, where **"Everything is a Plugin"**.
Instead of waiting for official upstream updates or maintaining a heavy fork of the core repository, this hub provides drop-in replacement plugins that you can easily install and mount via your `cordis.yml` configuration.

DeepSeek Harness 基于 [Cordis](https://cordis.js.org/) 架构，**"一切皆插件"**。
无需等待官方上游更新或维护一个沉重的核心仓库分支，本中心提供即插即用的增强插件，你可以通过 `cordis.yml` 配置文件轻松安装和挂载。

## 📦 Available Plugins / 可用插件

### 1. `@le-temps/dsh-hooks-claude-code`
An enhanced hook bridge for Claude Code that includes infinite loop protection and true run-level halting.

为 Claude Code 提供的增强钩子桥接插件，包含无限循环保护和真正的运行级中止能力。

- **Key Feature / 核心特性**: Defends against rogue scripts forcing infinite agent loops (Stop-Loop-Guard) and allows hooks to gracefully cancel the entire agent lifecycle. / 防御恶意脚本导致的无限 Agent 循环（Stop-Loop-Guard），并允许钩子优雅地取消整个 Agent 生命周期。
- [View Documentation / 查看文档](./packages/hooks-claude-code/README.md)

### 2. `@le-temps/dsh-hooks-codex`
An enhanced hook bridge for Codex featuring the same architectural loop-guards and safe-exit capabilities as our Claude Code adapter.

为 Codex 提供的增强钩子桥接插件，具备与 Claude Code 适配器相同的架构级循环守卫和安全退出能力。

- **Key Feature / 核心特性**: Prevents agent deadlocks when parsing Codex tool outputs. / 防止解析 Codex 工具输出时的 Agent 死锁。
- [View Documentation / 查看文档](./packages/hooks-codex/README.md)

### 3. `@le-temps/dsh-agent-memory` 🆕
Long-term Core Memory plugin with self-evolution, inspired by MemGPT. Gives your agent persistent cross-session memory.

受 MemGPT 启发的长期核心记忆插件，支持自进化。赋予你的 Agent 持久化的跨会话记忆能力。

- **Key Feature / 核心特性**: 4 memory tools (`append` / `replace` / `delete` / `reflect`) let the agent proactively manage its own knowledge base and evolve over time. / 4 个记忆工具（`追加` / `替换` / `删除` / `反思`）让 Agent 主动管理自己的知识库并随时间进化。
- [View Documentation / 查看文档](./packages/agent-memory/README.md)

## 🛠️ Usage / 使用方式

To use any of these plugins in your DeepSeek Harness environment:

在你的 DeepSeek Harness 环境中使用这些插件：

1. Install the plugin via npm/pnpm / 通过 npm/pnpm 安装插件：
   ```bash
   npm install @le-temps/dsh-hooks-claude-code
   ```
2. Mount it in your `cordis.yml` configuration / 在 `cordis.yml` 配置中挂载：
   ```yaml
   plugins:
     - @le-temps/dsh-hooks-claude-code:
         configPath: ./.claude/hooks.json
   ```

## 🤝 Contributing / 贡献

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/le-temps/dsh-plugins-hub/issues). If you have an idea for a new plugin that benefits the DeepSeek Harness ecosystem, consider adding it to this hub.

欢迎贡献代码、提交 Issue 和功能请求！请访问 [Issues 页面](https://github.com/le-temps/dsh-plugins-hub/issues)。如果你有一个能为 DeepSeek Harness 生态带来价值的新插件创意，欢迎将它加入本中心。

## 📄 License / 许可证

This project is licensed under the MIT License.

本项目采用 MIT 许可证。
