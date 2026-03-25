import { useState } from 'react';
import { type Habit, type CheckIn, type CheckInStatus, db, isHabitScheduledForDate, getTodayString } from '../db';
import { ChevronLeft, ChevronRight, Check, X, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface WeeklyViewProps {
  habits: Habit[];
  checkIns: CheckIn[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function WeeklyView({ habits, checkIns, currentDate, onDateChange }: WeeklyViewProps) {
  const [animatingCell, setAnimatingCell] = useState<string | null>(null);

  // 获取本周的开始（周一）
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    return day;
  });

  const weekRangeText = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekDays[6].getMonth() + 1}月${weekDays[6].getDate()}日`;

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
    onDateChange(newDate);
  };

  const getCheckInStatus = (habitId: string, dateStr: string): CheckIn | undefined => {
    return checkIns.find(ci => ci.habitId === habitId && ci.date === dateStr);
  };

  const toggleCheckIn = async (habit: Habit, dateStr: string) => {
    if (!isHabitScheduledForDate(habit, dateStr)) return;

    const cellKey = `${habit.id}-${dateStr}`;
    setAnimatingCell(cellKey);

    const existingCheckIn = getCheckInStatus(habit.id, dateStr);

    if (existingCheckIn) {
      // 循环切换: completed -> pending -> completed
      const newStatus = existingCheckIn.status === 'completed' ? 'pending' : 'completed';
      await db.checkIns.update(existingCheckIn.id, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        isAutoMarked: false,
      });
    } else {
      // 创建新的打卡记录
      await db.checkIns.add({
        id: crypto.randomUUID(),
        habitId: habit.id,
        date: dateStr,
        status: 'completed',
        updatedAt: new Date().toISOString(),
        isAutoMarked: false,
      });
    }

    setTimeout(() => setAnimatingCell(null), 300);
  };

  const getStatusIcon = (status: CheckInStatus | undefined, isScheduled: boolean) => {
    if (!isScheduled) return <Minus className="w-4 h-4 text-text-disabled" />;
    
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'failed':
        return <X className="w-4 h-4" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-current" />;
    }
  };

  const getStatusClass = (status: CheckInStatus | undefined, isScheduled: boolean, _isToday: boolean) => {
    if (!isScheduled) return 'bg-bg-tertiary/30 text-text-disabled cursor-default';
    
    const baseClass = 'cursor-pointer hover:scale-105 transition-transform';
    
    switch (status) {
      case 'completed':
        return `${baseClass} bg-success/20 text-success border-success/40`;
      case 'failed':
        return `${baseClass} bg-danger/20 text-danger border-danger/40`;
      default:
        return `${baseClass} bg-transparent text-text-tertiary border-text-tertiary/40 hover:bg-bg-tertiary/50`;
    }
  };

  const today = getTodayString();

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-bg-secondary rounded-xl p-4">
        <button
          onClick={() => navigateWeek('prev')}
          className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <span className="text-lg font-semibold text-text-primary">{weekRangeText}</span>
        <button
          onClick={() => navigateWeek('next')}
          className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Week Grid */}
      <div className="bg-bg-secondary rounded-xl overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-8 border-b border-bg-tertiary">
          <div className="p-4 text-sm font-medium text-text-tertiary">习惯</div>
          {weekDays.map((day, index) => {
            const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            const dateStr = day.toISOString().split('T')[0];
            const isToday = dateStr === today;
            
            return (
              <div
                key={index}
                className={`p-4 text-center ${isToday ? 'bg-accent/10' : ''}`}
              >
                <div className="text-xs text-text-tertiary">{dayNames[index]}</div>
                <div className={`text-sm font-semibold ${isToday ? 'text-accent' : 'text-text-primary'}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Habit Rows */}
        {habits.length === 0 ? (
          <div className="p-8 text-center text-text-tertiary">
            还没有习惯，点击右上角"新建"添加第一个习惯吧
          </div>
        ) : (
          habits.map((habit) => (
            <div key={habit.id} className="grid grid-cols-8 border-b border-bg-tertiary/50 last:border-b-0">
              {/* Habit Name */}
              <div className="p-4 flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: habit.color }}
                />
                <span className="text-sm font-medium text-text-primary truncate">
                  {habit.name}
                </span>
              </div>

              {/* Daily Cells */}
              {weekDays.map((day, index) => {
                const dateStr = day.toISOString().split('T')[0];
                
                // 检查是否在创建日期之后
                const createdDate = habit.createdAt.split('T')[0];
                if (dateStr < createdDate) {
                  return <div key={index} className="p-4" />; // 创建日期前显示空白
                }
                
                // 检查是否已暂停且日期在暂停日期之后
                if (habit.status === 'paused' && habit.pausedAt && dateStr >= habit.pausedAt) {
                  return <div key={index} className="p-4" />; // 暂停后显示空白
                }
                
                const isScheduled = isHabitScheduledForDate(habit, dateStr);
                
                // 无安排时显示空白
                if (!isScheduled) {
                  return <div key={index} className="p-4" />;
                }
                
                const checkIn = getCheckInStatus(habit.id, dateStr);
                const cellKey = `${habit.id}-${dateStr}`;
                const isAnimating = animatingCell === cellKey;

                return (
                  <div
                    key={index}
                    className={`p-4 flex items-center justify-center ${
                      dateStr === today ? 'bg-accent/5' : ''
                    }`}
                  >
                    <motion.button
                      onClick={() => toggleCheckIn(habit, dateStr)}
                      className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center ${
                        getStatusClass(checkIn?.status, true, dateStr === today)
                      }`}
                      animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {getStatusIcon(checkIn?.status, true)}
                    </motion.button>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
