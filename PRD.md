# Habit Tracker 产品需求文档

> 当前版本: v2.0  
> 更新时间: 2026-04-01  
> 作者: 夏恩阳

---

## 版本演进

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1.0 | 2026-03-25 | 初始版本：Habit Tracker 习惯打卡系统 |
| v2.0 | 2026-04-01 | 重大更新：升级为多系统门户，新增小说人物管理系统 |

---

## v2.0 架构总览

### 2.1 产品定位
一个**多系统门户应用**，整合个人效率工具与创作辅助工具：
- **Habit Tracker** - 习惯打卡追踪（v1.0 核心功能）
- **小说人物管理系统** - 武侠/玄幻小说人物管理（v2.0 新增）

### 2.2 整体架构

```
┌─────────────────────────────────────────┐
│              门户首页                    │
│  ┌─────────────┐    ┌─────────────┐    │
│  │  Habit      │    │   小说人物   │    │
│  │  Tracker    │    │   管理系统   │    │
│  │   [图标]    │    │   [图标]    │    │
│  └─────────────┘    └─────────────┘    │
└─────────────────────────────────────────┘
         ↓                       ↓
┌─────────────────┐    ┌─────────────────┐
│   习惯打卡系统   │    │  人物管理系统    │
│   (v1.0 核心)   │    │   (v2.0 新增)   │
└─────────────────┘    └─────────────────┘
```

### 2.3 统一设计规范

两个子系统共用以下设计体系，确保体验一致性：

#### 2.3.1 技术栈
- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS
- **本地存储**: Dexie (IndexedDB)
- **路由**: React Router
- **部署**: Vercel

#### 2.3.2 视觉规范
- **背景**: 深色模式（默认）
- **圆角**: 卡片 12px，按钮 8px
- **字体**: 系统默认无衬线

---

## 第一部分：Habit Tracker（v1.0 核心功能）

> 该部分在 v2.0 中保持不变，作为子系统之一

### 1.1 习惯类型定义

#### A类习惯 - 每周进行
- **定义**: 每周需要完成一定次数的重复习惯
- **示例**: 每周运动3次、每周阅读5次
- **用户输入**: 习惯名称、每周目标次数（1-7次）

#### B类习惯 - 累积进行
- **定义**: 在可预见的未来总共要完成的目标
- **示例**: 累计跑步100公里、读完10本书
- **用户输入**: 习惯名称、累积总目标次数、截止日期（可选）

### 1.2 功能模块

#### 1.2.1 新建习惯
- 习惯名称输入框（必填，最多50字符）
- 习惯类型选择（A类/B类）
- 动态输入区域：
  - A类：每周目标次数（1-7）
  - B类：累积总目标次数 + 截止日期选择器
- 颜色选择器

#### 1.2.2 周视图
- 顶部周导航（上一周/下一周）
- 表格：习惯名称 + 周一至周日 + 统计列
- 打卡状态：✓完成（绿）、✗未完成（红）、○未打卡（灰）

#### 1.2.3 月视图
- 顶部月份导航
- 日历网格：6周 × 7天
- 热力图显示：每天完成任务总数（颜色深浅表示数量）

#### 1.2.4 日程视图（习惯列表）
- A类卡片：名称、累积达成周数、历史完成次数
- B类卡片：名称、进度条、完成比例、截止日期
- 操作：暂停/恢复、归档、删除

### 1.3 Habit Tracker 数据结构

```typescript
type HabitType = 'A' | 'B';
type HabitStatus = 'active' | 'archived' | 'paused' | 'deleted';

interface Habit {
  id: string;
  name: string;
  color: string;
  habitType: HabitType;
  weeklyTarget?: number;      // A类
  totalTarget?: number;       // B类
  deadline?: string;          // B类
  createdAt: string;
  updatedAt: string;
  status: HabitStatus;
}

interface CheckIn {
  id: string;
  habitId: string;
  date: string;
  status: 'completed' | 'failed' | 'pending';
  updatedAt: string;
}
```

### 1.4 Habit Tracker 颜色系统
- 主色调：蓝色 (#3B82F6)
- 成功/完成：绿色 (#10B981)
- 失败/未完成：红色 (#EF4444)
- 警告/暂停：橙色 (#F59E0B)

---

## 第二部分：小说人物管理系统（v2.0 新增）

> 该部分为 v2.0 新增功能，与 Habit Tracker 并行作为独立子系统

### 2.1 产品定位
面向小说创作者的人物管理工具，帮助系统化记录、管理武侠/玄幻题材的角色信息。

### 2.2 人物数据模型

#### 2.2.1 属性定义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 唯一标识 |
| name | string | 是 | 人物姓名 |
| gender | enum | 否 | 性别: male/female |
| age | number | 否 | 年龄 |
| sect | string | 否 | 所属门派 |
| sectPosition | string | 否 | 门派职位 |
| faction | string | 否 | 所属势力 |
| factionPosition | string | 否 | 势力职位 |
| weapon | string | 否 | 兵器 |
| martialLevel | enum | 否 | 武学等级 |
| appearance | text | 否 | 样貌描述 |
| personality | text | 否 | 性格核心 |
| value | text | 否 | 存在价值 |
| conflict | text | 否 | 主要冲突 |

#### 2.2.2 武学等级体系

```
S > A+ > A > A- > B+ > B > B- > C+ > C > C- > D
```

| 等级 | 定位 | HEX颜色 |
|------|------|---------|
| S | 绝世高手 | #7C3AED |
| A+ | 一流巅峰 | #DC2626 |
| A | 一流高手 | #EF4444 |
| A- | 一流入门 | #F87171 |
| B+ | 二流巅峰 | #F97316 |
| B | 二流高手 | #FB923C |
| B- | 二流入门 | #FDBA74 |
| C+ | 三流巅峰 | #3B82F6 |
| C | 三流 | #60A5FA |
| C- | 三流入门 | #93C5FD |
| D | 初学者 | #9CA3AF |

### 2.3 功能模块

#### 2.3.1 人物列表界面
- **卡片展示**: 姓名、性别、年龄、门派、武学等级（带颜色标签）
- **默认排序**: 武学等级（高→低）→ 年龄（大→小）
- **筛选条件**: 武学等级（多选）、门派、年龄排序
- **操作按钮**: 确认筛选、一键清空
- **添加入口**: 右上角「+ 添加人物」

#### 2.3.2 人物详情页
- 展示全部字段信息
- 操作：编辑（需确认Toast）、删除（需确认Toast）
- 可返回列表

#### 2.3.3 添加人物
- 仅「姓名」必填，其他可选
- 创建时校验姓名唯一性
- 重名提示错误

#### 2.3.4 导入导出
- **导出**: Excel格式导出全部人物
- **导入**: 按模板Excel批量上传
- **重名处理**: 自动在重复姓名后加数字后缀（令狐冲→令狐冲1→令狐冲2）

### 2.4 人物系统数据结构

```typescript
type MartialLevel = 'S' | 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D';
type Gender = 'male' | 'female';

interface Character {
  id: string;
  name: string;
  gender?: Gender;
  age?: number;
  sect?: string;
  sectPosition?: string;
  faction?: string;
  factionPosition?: string;
  weapon?: string;
  martialLevel?: MartialLevel;
  appearance?: string;
  personality?: string;
  value?: string;
  conflict?: string;
  createdAt: string;
  updatedAt: string;
}

interface CharacterFilter {
  martialLevels?: MartialLevel[];
  sect?: string;
  ageSort?: 'asc' | 'desc';
}
```

---

## 第三部分：数据库设计

### 3.1 IndexedDB 结构

```typescript
const db = new Dexie('HabitTrackerApp');

db.version(2).stores({
  // v1.0 习惯数据
  habits: '++id, name, habitType, status, createdAt',
  checkIns: '++id, habitId, date, status',
  
  // v2.0 新增人物数据
  characters: '++id, name, sect, martialLevel, age, createdAt'
});
```

### 3.2 数据隔离
- Habit Tracker 与人物管理系统数据完全隔离
- 各自独立存储，互不影响

---

## 第四部分：组件结构

```
src/
├── components/
│   ├── Portal/                    # v2.0 门户首页
│   │   └── ProjectCard.tsx
│   ├── Habit/                     # v1.0 习惯系统
│   │   ├── HabitCard.tsx
│   │   ├── HabitList.tsx
│   │   ├── WeekView.tsx
│   │   ├── MonthView.tsx
│   │   └── HabitForm.tsx
│   ├── Character/                 # v2.0 人物系统
│   │   ├── CharacterCard.tsx
│   │   ├── CharacterList.tsx
│   │   ├── CharacterDetail.tsx
│   │   ├── CharacterForm.tsx
│   │   ├── FilterPanel.tsx
│   │   └── MartialLevelBadge.tsx
│   └── Common/                    # 公共组件
│       ├── ConfirmToast.tsx
│       └── ExcelUploader.tsx
├── db/
│   └── index.ts
├── types/
│   ├── habit.ts                   # v1.0 类型
│   └── character.ts               # v2.0 类型
└── pages/
    ├── Portal.tsx                 # v2.0 门户页
    ├── HabitTracker.tsx           # v1.0 习惯系统
    └── CharacterSystem.tsx        # v2.0 人物系统
```

---

## 附录：版本详细变更记录

### v1.0 → v2.0 变更清单

#### 新增功能
- [+] 门户首页（系统选择入口）
- [+] 小说人物管理系统完整功能
- [+] 武学等级颜色体系
- [+] Excel 导入导出功能

#### 保持不变
- [=] Habit Tracker 所有功能
- [=] 习惯打卡核心逻辑
- [=] 周/月/日程视图

#### 架构升级
- [^] 单页面应用 → 多系统门户
- [^] 单一数据库 → 多表结构
- [^] 统一设计规范

---

*文档版本: v2.0*  
*最后更新: 2026-04-01*
