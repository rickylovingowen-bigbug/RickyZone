import { useState } from 'react';
import { type Habit, type CheckIn, db, isHabitScheduledForDate } from '../db';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MonthlyViewProps {
  habits: Habit[];
  checkIns: CheckIn[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function MonthlyView({ habits, checkIns, currentDate, onDateChange }: MonthlyViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 获取当月第一天
  const firstDay = new Date(year, month, 1);

  // 获取日历开始日期（周日）
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(calendarStart.getDate() - firstDay.getDay());

  // 生成日历天数（6周）
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = new Date(calendarStart);
    day.setDate(day.getDate() + i);
    return day;
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
    onDateChange(newDate);
  };

  const getDayStats = (dateStr: string) => {
    const scheduledHabits = habits.filter(h => {
      // 检查是否在创建日期之后
      const createdDate = h.createdAt.split('T')[0];
      if (dateStr < createdDate) return false;
      
      // 检查是否已暂停且日期在暂停日期之后
      if (h.status === 'paused' && h.pausedAt && dateStr >= h.pausedAt) return false;
      
      // 只显示进行中的习惯
      if (h.status !== 'active') return false;
      
      return isHabitScheduledForDate(h, dateStr);
    });
    
    if (scheduledHabits.length === 0) return null;

    const dayCheckIns = checkIns.filter(ci => ci.date === dateStr);
    const completed = dayCheckIns.filter(ci => ci.status === 'completed').length;
    const total = scheduledHabits.length;
    const rate = Math.round((completed / total) * 100);

    return { completed, total, rate, scheduledHabits, dayCheckIns };
  };

  const getDayColor = (rate: number | null) => {
    if (rate === null) return 'bg-bg-tertiary/50';
    if (rate >= 80) return 'bg-success/20';
    if (rate >= 50) return 'bg-warning/20';
    if (rate > 0) return 'bg-habit-orange/20';
    return 'bg-danger/20';
  };

  const toggleCheckIn = async (habitId: string, dateStr: string) => {
    const existingCheckIn = checkIns.find(ci => ci.habitId === habitId && ci.date === dateStr);

    if (existingCheckIn) {
      const newStatus = existingCheckIn.status === 'completed' ? 'pending' : 'completed';
      await db.checkIns.update(existingCheckIn.id, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        isAutoMarked: false,
      });
    } else {
      await db.checkIns.add({
        id: crypto.randomUUID(),
        habitId,
        date: dateStr,
        status: 'completed',
        updatedAt: new Date().toISOString(),
        isAutoMarked: false,
      });
    }
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-bg-secondary rounded-xl p-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <span className="text-lg font-semibold text-text-primary">
          {year}年{month + 1}月
        </span>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-bg-secondary rounded-xl p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-text-tertiary py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const dateStr = day.toISOString().split('T')[0];
            const isCurrentMonth = day.getMonth() === month;
            const stats = getDayStats(dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <motion.button
                key={index}
                onClick={() => stats && setSelectedDate(dateStr)}
                className={`aspect-square rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-colors ${
                  isCurrentMonth ? getDayColor(stats?.rate ?? null) : 'bg-transparent'
                } ${isToday ? 'ring-2 ring-accent' : ''} ${stats ? 'hover:brightness-110 cursor-pointer' : 'cursor-default'}`}
                whileHover={stats ? { scale: 1.05 } : {}}
                whileTap={stats ? { scale: 0.95 } : {}}
              >
                <span className={`text-sm font-medium ${
                  isCurrentMonth ? 'text-text-primary' : 'text-text-disabled'
                }`}>
                  {day.getDate()}
                </span>
                {stats && (
                  <div className="relative w-8 h-8">
                    {/* Progress Ring */}
                    <svg className="w-8 h-8 transform -rotate-90">
                      <circle
                        cx="16"
                        cy="16"
                        r="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-bg-tertiary"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${stats.rate * 0.75} 75`}
                        className={stats.rate >= 80 ? 'text-success' : stats.rate >= 50 ? 'text-warning' : 'text-danger'}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-text-secondary">
                      {stats.rate}%
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {selectedDate && (
          <DayDetailModal
            dateStr={selectedDate}
            stats={getDayStats(selectedDate)!}
            onClose={() => setSelectedDate(null)}
            onToggleCheckIn={toggleCheckIn}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface DayDetailModalProps {
  dateStr: string;
  stats: {
    completed: number;
    total: number;
    rate: number;
    scheduledHabits: Habit[];
    dayCheckIns: CheckIn[];
  };
  onClose: () => void;
  onToggleCheckIn: (habitId: string, dateStr: string) => void;
}

function DayDetailModal({ dateStr, stats, onClose, onToggleCheckIn }: DayDetailModalProps) {
  const date = new Date(dateStr);
  const dateText = `${date.getMonth() + 1}月${date.getDate()}日`;

  const getCheckInStatus = (habitId: string) => {
    return stats.dayCheckIns.find(ci => ci.habitId === habitId)?.status || 'pending';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-bg-secondary rounded-2xl p-6 w-full max-w-md modal-shadow"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-text-primary">{dateText}</h3>
            <p className="text-sm text-text-tertiary">
              完成 {stats.completed}/{stats.total} ({stats.rate}%)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Habit List */}
        <div className="space-y-3">
          {stats.scheduledHabits.map(habit => {
            const status = getCheckInStatus(habit.id);
            const isCompleted = status === 'completed';
            const isFailed = status === 'failed';

            return (
              <div
                key={habit.id}
                className="flex items-center justify-between p-3 bg-bg-tertiary/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: habit.color }}
                  />
                  <span className="text-text-primary font-medium">{habit.name}</span>
                </div>
                <button
                  onClick={() => onToggleCheckIn(habit.id, dateStr)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isCompleted
                      ? 'bg-success/20 text-success'
                      : isFailed
                      ? 'bg-danger/20 text-danger'
                      : 'bg-bg-tertiary text-text-tertiary hover:bg-accent/20 hover:text-accent'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : isFailed ? <X className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
