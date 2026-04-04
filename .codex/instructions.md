# Codex 工作指令

> 本文件由 OpenClaw Agent 创建
> 目的：确保 Codex 始终与 GitHub 最新代码保持同步

---

## 🔄 强制同步规则

### 每次对话开始时，必须执行：

1. **读取最新 PRD**
   ```
   从 GitHub 读取 rickylovingowen-bigbug/Habit-Tracker 的 PRD.md
   确认版本号和最后更新日期
   ```

2. **检查未合并的 PR**
   ```
   查看仓库中所有 open 状态的 Pull Request
   如果有未合并的代码，先了解其内容
   ```

3. **同步本地状态**
   ```
   对比当前工作区代码与 GitHub 最新代码
   如有差异，先同步最新代码
   ```

---

## 📋 项目结构

```
rickylovingowen-bigbug/Habit-Tracker/
├── PRD.md              # 产品需求文档（必读）
├── src/
│   ├── App.tsx         # 主应用（含登录逻辑）
│   ├── components/
│   │   ├── LoginScreen.tsx    # 登录页面
│   │   ├── Habit/             # 习惯系统
│   │   └── Character/         # 人物系统
│   └── db.ts           # 数据库
└── .codex/
    └── instructions.md # 本文件
```

---

## 🔐 登录系统（v2.1 已实现）

- **凭证**: lovingowen / dawangbaxiaoni7
- **存储**: localStorage (isAuthenticated, username)
- **组件**: LoginScreen.tsx

---

## ⚠️ 重要提醒

- **不要假设**: 不要假设本地代码是最新的
- **总是读取**: 每次开始工作前读取 PRD.md
- **确认版本**: 确认读取到的 PRD 版本号
- **检查 PR**: 检查是否有未合并的修改

---

## 📝 工作模板

用户说"开始开发"时，按以下步骤：

1. "好的，我先从 GitHub 同步最新需求和代码..."
2. 读取 PRD.md → 报告版本号
3. 检查 open PRs → 报告状态
4. 读取相关代码文件
5. "已同步完成，当前需求是..."
6. 开始开发

---

*创建时间: 2026-04-04*  
*关联仓库: rickylovingowen-bigbug/Habit-Tracker*
