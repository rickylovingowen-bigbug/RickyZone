import Dexie, { type Table } from 'dexie';

export type FrequencyType = 'daily' | 'weekly' | 'once';
export type CheckInStatus = 'pending' | 'completed' | 'failed';

export type HabitStatus = 'active' | 'archived' | 'paused' | 'deleted';

export interface Habit {
  id: string;
  name: string;
  color: string;
  frequency: FrequencyType;
  frequencyConfig: {
    daysOfWeek?: number[]; // 0-6, 周日=0
    specificDate?: string; // YYYY-MM-DD
  };
  createdAt: string;
  updatedAt: string;
  status: HabitStatus;
  pausedAt?: string; // 暂停日期
  isActive: boolean; // 兼容旧数据
  isArchived: boolean; // 兼容旧数据
}

export interface CheckIn {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  status: CheckInStatus;
  updatedAt: string;
  isAutoMarked: boolean;
}

export class HabitTrackerDB extends Dexie {
  habits!: Table<Habit>;
  checkIns!: Table<CheckIn>;

  constructor() {
    super('HabitTrackerDB');
    this.version(2).stores({
      habits: 'id, createdAt, status',
      checkIns: 'id, habitId, date, status, [habitId+date]',
    }).upgrade(tx => {
      // 迁移旧数据
      return tx.table('habits').toCollection().modify(habit => {
        if (!habit.status) {
          if (habit.isArchived) {
            habit.status = 'archived';
          } else {
            habit.status = 'active';
          }
        }
      });
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

// 检查某天是否有习惯安排
export function isHabitScheduledForDate(habit: Habit, dateStr: string): boolean {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay(); // 0-6

  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return habit.frequencyConfig.daysOfWeek?.includes(dayOfWeek) ?? false;
    case 'once':
      return habit.frequencyConfig.specificDate === dateStr;
    default:
      return false;
  }
}

// 计算连续天数
export function calculateStreak(habit: Habit, checkIns: CheckIn[]): number {
  if (!checkIns.length) return 0;
  
  // 一次性日程没有连续天数的概念
  if (habit.frequency === 'once') {
    return 0;
  }
  
  // 按日期排序（从新到旧）
  const sortedCheckIns = [...checkIns]
    .filter(ci => ci.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (!sortedCheckIns.length) return 0;
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  // 检查今天或最近有安排的日子
  const todayStr = getTodayString();
  const todayCheckIn = sortedCheckIns.find(ci => ci.date === todayStr);
  
  if (todayCheckIn) {
    streak = 1;
  } else {
    // 检查今天是否有安排
    if (isHabitScheduledForDate(habit, todayStr)) {
      // 今天有安排但没完成，检查昨天
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const yesterdayCheckIn = sortedCheckIns.find(ci => ci.date === yesterdayStr);
      if (yesterdayCheckIn) {
        streak = 1;
        currentDate = yesterday;
      } else {
        return 0;
      }
    } else {
      // 今天没安排，找最近完成的
      const lastCompleted = sortedCheckIns[0];
      const lastDate = new Date(lastCompleted.date);
      streak = 1;
      currentDate = lastDate;
    }
  }
  
  // 向前追溯（最多追溯365天，防止无限循环）
  let daysChecked = 0;
  const maxDays = 365;
  
  while (daysChecked < maxDays) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    daysChecked++;
    
    // 检查前一天是否有安排
    if (!isHabitScheduledForDate(habit, prevDateStr)) {
      // 前一天没安排，继续往前
      currentDate = prevDate;
      continue;
    }
    
    // 前一天有安排，检查是否完成
    const prevCheckIn = sortedCheckIns.find(ci => ci.date === prevDateStr);
    if (prevCheckIn && prevCheckIn.status === 'completed') {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }
  
  return streak;
}

// 计算完成率
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
  
  const data = {
    habits,
    checkIns,
    exportDate: new Date().toISOString(),
    version: '1.0',
  };
  
  return JSON.stringify(data, null, 2);
}

// 导入数据
export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);
  
  if (!data.habits || !data.checkIns) {
    throw new Error('Invalid data format');
  }
  
  await db.transaction('rw', db.habits, db.checkIns, async () => {
    await db.habits.clear();
    await db.checkIns.clear();
    await db.habits.bulkAdd(data.habits);
    await db.checkIns.bulkAdd(data.checkIns);
  });
}
