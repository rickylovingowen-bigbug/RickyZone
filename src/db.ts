import Dexie, { type Table } from 'dexie';

export type HabitType = 'A' | 'B';
export type CheckInStatus = 'pending' | 'completed' | 'failed';
export type HabitStatus = 'active' | 'archived' | 'paused' | 'deleted';
export type MartialLevel = 'S+' | 'S' | 'S-' | 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-';
export type MartialTier = '无疆' | '暮海' | '阔原' | '长岭' | '清岫';
export type Gender = 'male' | 'female';

// Rank 到品级的映射
export const RANK_TO_TIER_MAP: Record<MartialLevel, MartialTier> = {
  'S+': '无疆',
  'S': '暮海', 'S-': '暮海',
  'A+': '阔原', 'A': '阔原', 'A-': '阔原',
  'B+': '长岭', 'B': '长岭', 'B-': '长岭',
  'C+': '清岫', 'C': '清岫', 'C-': '清岫',
  'D+': '初岚', 'D': '初岚', 'D-': '初岚',
};
// 品级颜色映射
export const TIER_COLOR: Record<MartialTier, string> = {
  '无疆': '#7C3AED',
  '暮海': '#DC2626',
  '阔原': '#F97316',
  '长岭': '#3B82F6',
  '清岫': '#9CA3AF',
  '初岚': '#808080',
};

// 根据 Rank 获取品级
export function getMartialTier(rank: MartialLevel | undefined): MartialTier | undefined {
  if (!rank) return undefined;
  return RANK_TO_TIER_MAP[rank];
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  habitType: HabitType;
  weeklyTarget?: number;
  totalTarget?: number;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  status: HabitStatus;
  isActive: boolean;
  isArchived: boolean;
  pausedAt?: string;
}

export interface CheckIn {
  id: string;
  habitId: string;
  date: string;
  status: CheckInStatus;
  updatedAt: string;
  isAutoMarked: boolean;
}

export interface Character {
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
  martialTier?: MartialTier;
  isVip?: boolean;  // v2.6 新增：武学品级，自动计算
  appearance?: string;
  personality?: string;
  value?: string;
  conflict?: string;
  createdAt: string;
  updatedAt: string;
}

export class HabitTrackerDB extends Dexie {
  habits!: Table<Habit>;
  checkIns!: Table<CheckIn>;
  characters!: Table<Character>;

  constructor() {
    super('HabitTrackerDB');
    this.version(3).stores({
      habits: 'id, createdAt, status, habitType',
      checkIns: 'id, habitId, date, status, [habitId+date]',
    });
    this.version(4).stores({
      habits: 'id, createdAt, status, habitType',
      checkIns: 'id, habitId, date, status, [habitId+date]',
      characters: 'id, name, sect, martialLevel, martialTier, age, createdAt',
    });
    this.version(6).stores({
      habits: 'id, createdAt, status, habitType',
      checkIns: 'id, habitId, date, status, [habitId+date]',
      characters: 'id, name, sect, martialLevel, martialTier, age, createdAt',
    });
  }
}

export const db = new HabitTrackerDB();

// 习惯颜色选项
export const HABIT_COLORS = [
  { name: '橙色', value: '#F97316', class: 'habit-orange' },
  { name: '黄色', value: '#F59E0B', class: 'habit-yellow' },
  { name: '绿色', value: '#10B981', class: 'habit-green' },
  { name: '蓝色', value: '#3B82F6', class: 'habit-blue' },
  { name: '紫色', value: '#8B5CF6', class: 'habit-purple' },
  { name: '红色', value: '#EF4444', class: 'habit-red' },
  { name: '灰色', value: '#6B7280', class: 'habit-gray' },
];

// 生成 UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// 获取今天的日期字符串
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// 获取本周的开始（周一）
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// 获取本周的结束（周日）
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
}

// 计算本周完成率（A类习惯）
export function calculateWeeklyCompletion(
  habit: Habit,
  checkIns: CheckIn[],
  weekStart: Date
): { completed: number; target: number; rate: number } {
  if (habit.habitType !== 'A' || !habit.weeklyTarget) {
    return { completed: 0, target: 0, rate: 0 };
  }

  const weekEnd = getWeekEnd(weekStart);
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const weekCheckIns = checkIns.filter(
    ci => ci.habitId === habit.id &&
    ci.date >= weekStartStr &&
    ci.date <= weekEndStr &&
    ci.status === 'completed'
  );

  const completed = weekCheckIns.length;
  const target = habit.weeklyTarget;
  const rate = Math.min(100, Math.round((completed / target) * 100));

  return { completed, target, rate };
}

// 计算历史累积完成次数
export function calculateTotalCompleted(checkIns: CheckIn[], habitId: string): number {
  return checkIns.filter(ci => ci.habitId === habitId && ci.status === 'completed').length;
}

// 计算累积达成周数（A类习惯：每周完成率达到100%算一周）
export function calculateAccumulatedWeeks(
  habit: Habit,
  checkIns: CheckIn[]
): number {
  if (habit.habitType !== 'A' || !habit.weeklyTarget) return 0;

  const habitCheckIns = checkIns.filter(ci => ci.habitId === habit.id && ci.status === 'completed');
  if (habitCheckIns.length === 0) return 0;

  const dates = habitCheckIns.map(ci => new Date(ci.date));
  const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const today = new Date();

  let accumulatedWeeks = 0;
  const currentWeekStart = getWeekStart(earliestDate);

  while (currentWeekStart <= today) {
    const completion = calculateWeeklyCompletion(habit, checkIns, currentWeekStart);
    if (completion.rate >= 100) {
      accumulatedWeeks++;
    }
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return accumulatedWeeks;
}

// 计算B类习惯的完成比例
export function calculateBProgress(
  habit: Habit,
  checkIns: CheckIn[]
): { completed: number; target: number; rate: number } {
  if (habit.habitType !== 'B' || !habit.totalTarget) {
    return { completed: 0, target: 0, rate: 0 };
  }

  const completed = calculateTotalCompleted(checkIns, habit.id);
  const target = habit.totalTarget;
  const rate = Math.min(100, Math.round((completed / target) * 100));

  return { completed, target, rate };
}

// 检查并归档过期B类习惯
export function checkAndArchiveExpiredHabits(habits: Habit[]): string[] {
  const today = getTodayString();
  const expiredIds: string[] = [];

  for (const habit of habits) {
    if (habit.habitType === 'B' &&
        habit.deadline &&
        habit.deadline < today &&
        habit.status === 'active') {
      expiredIds.push(habit.id);
    }
  }

  return expiredIds;
}

// 计算完成率（保留函数用于兼容）
export function calculateCompletionRate(checkIns: CheckIn[]): number {
  if (!checkIns.length) return 0;

  const completed = checkIns.filter(ci => ci.status === 'completed').length;
  const failed = checkIns.filter(ci => ci.status === 'failed').length;
  const total = completed + failed;

  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// 导出数据
export async function exportData(): Promise<string> {
  const habits = await db.habits.toArray();
  const checkIns = await db.checkIns.toArray();
  const characters = await db.characters.toArray();
  
  const data = {
    habits,
    checkIns,
    characters,
    exportDate: new Date().toISOString(),
    version: '2.6',
  };

  return JSON.stringify(data, null, 2);
}

// 导入数据
export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);

  if (!data.habits || !data.checkIns) {
    throw new Error('Invalid data format');
  }
  
  await db.transaction('rw', db.habits, db.checkIns, db.characters, async () => {
    await db.habits.clear();
    await db.checkIns.clear();
    await db.characters.clear();
    await db.habits.bulkAdd(data.habits);
    await db.checkIns.bulkAdd(data.checkIns);
    if (Array.isArray(data.characters) && data.characters.length > 0) {
      await db.characters.bulkAdd(data.characters);
    }
  });
}
