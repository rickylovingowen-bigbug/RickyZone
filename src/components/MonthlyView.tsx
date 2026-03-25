import { useState } from 'react';
import { type Habit, type CheckIn, db, getTodayString } from '../db';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface MonthlyViewProps {
  habits: Habit[];
  checkIns: CheckIn[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function MonthlyView({ habits, checkIns, currentDate, onDateChange }: MonthlyViewProps) {
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

  // 计算当天完成的任务总数
  const getDayTotalCompleted = (dateStr: string): number => {
    // 只统计进行中的习惯
    const activeHabits = habits.filter(h => {
      // 检查是否在创建日期之后
      const createdDate = h.createdAt.split('T')[0];
      if (dateStr < createdDate) return false;
      
      // 检查是否已暂停且日期在暂停日期之后
      if (h.status === 'paused' && h.pausedAt && dateStr >= h.pausedAt) return false;
      
      return h.status === 'active';
    });

    if (activeHabits.length === 0) return 0;

    const dayCheckIns = checkIns.filter(
      ci => ci.date === dateStr && ci.status === 'completed'
    );

    return dayCheckIns.length;
  };

  const getDayColor = (count: number): string => {
    if (count === 0) return 'bg-bg-tertiary/30';
    if (count === 1) return 'bg-success/20';
    if (count === 2) return 'bg-success/40';
    if (count === 3) return 'bg-success/60';
    return 'bg-success/80';
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const today = getTodayString();

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
            const totalCompleted = getDayTotalCompleted(dateStr);
            const isToday = dateStr === today;

            return (
              <motion.div
                key={index}
                className={`aspect-square rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-colors ${
                  isCurrentMonth ? getDayColor(totalCompleted) : 'bg-transparent'
                } ${isToday ? 'ring-2 ring-accent' : ''}`}
                whileHover={isCurrentMonth ? { scale: 1.05 } : {}}
              >
                <span className={`text-sm font-medium ${
                  isCurrentMonth ? 'text-text-primary' : 'text-text-disabled'
                }`}>
                  {day.getDate()}
                </span>
                {isCurrentMonth && totalCompleted > 0 && (
                  <span className="text-xs font-bold text-success">
                    {totalCompleted}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-bg-secondary rounded-xl p-4">
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <span>完成数：</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-bg-tertiary/30" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success/20" />
            <span>1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success/40" />
            <span>2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success/60" />
            <span>3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success/80" />
            <span>4+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
