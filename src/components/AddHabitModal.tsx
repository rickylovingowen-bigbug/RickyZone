import { useState } from 'react';
import { db, HABIT_COLORS, generateId, type HabitType } from '../db';
import type { Habit } from '../db';
import { X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface AddHabitModalProps {
  onClose: () => void;
}

export default function AddHabitModal({ onClose }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [habitType, setHabitType] = useState<HabitType>('A');
  const [weeklyTarget, setWeeklyTarget] = useState(3); // A类：默认每周3次
  const [totalTarget, setTotalTarget] = useState(30); // B类：默认累积30次
  const [deadline, setDeadline] = useState('');
  const [selectedColor, setSelectedColor] = useState(HABIT_COLORS[2].value); // 默认绿色

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = new Date().toISOString();
    const habitData: Partial<Habit> = {
      id: generateId(),
      name: name.trim(),
      color: selectedColor,
      habitType,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      isActive: true,
      isArchived: false,
    };

    if (habitType === 'A') {
      habitData.weeklyTarget = weeklyTarget;
    } else {
      habitData.totalTarget = totalTarget;
      if (deadline) {
        habitData.deadline = deadline;
      }
    }

    await db.habits.add(habitData as Habit);
    onClose();
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
        className="bg-bg-secondary rounded-2xl w-full max-w-md modal-shadow overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-bg-tertiary">
          <h2 className="text-xl font-bold text-text-primary">新建习惯</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              习惯名称
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例如：早起、阅读、健身"
              className="w-full px-4 py-3 bg-bg-tertiary border border-bg-tertiary rounded-xl text-text-primary placeholder-text-disabled focus:outline-none focus:border-accent transition-colors"
              maxLength={50}
              autoFocus
            />
          </div>

          {/* Habit Type Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              习惯类型
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHabitType('A')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  habitType === 'A'
                    ? 'bg-accent text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                <div className="font-bold">A类</div>
                <div className="text-xs opacity-80 mt-1">每周目标</div>
              </button>
              <button
                type="button"
                onClick={() => setHabitType('B')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  habitType === 'B'
                    ? 'bg-accent text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                <div className="font-bold">B类</div>
                <div className="text-xs opacity-80 mt-1">累积目标</div>
              </button>
            </div>
          </div>

          {/* A类：每周目标次数 */}
          {habitType === 'A' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                每周目标次数（1-7天）
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={weeklyTarget}
                  onChange={e => setWeeklyTarget(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <span className="w-12 text-center text-lg font-bold text-accent">
                  {weeklyTarget}
                </span>
              </div>
              <p className="text-xs text-text-tertiary mt-2">
                每周完成 {weeklyTarget} 天即算达成目标
              </p>
            </div>
          )}

          {/* B类：累积总目标 + 截止日期 */}
          {habitType === 'B' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  累积总目标次数
                </label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={totalTarget}
                  onChange={e => setTotalTarget(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 bg-bg-tertiary border border-bg-tertiary rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
                <p className="text-xs text-text-tertiary mt-2">
                  累计完成 {totalTarget} 次即达成目标
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  截止日期（可选）
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-tertiary border border-bg-tertiary rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
                <p className="text-xs text-text-tertiary mt-2">
                  到达此日期后习惯将自动归档
                </p>
              </div>
            </div>
          )}

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              颜色标识
            </label>
            <div className="flex gap-3 flex-wrap">
              {HABIT_COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-10 h-10 rounded-full transition-transform ${
                    selectedColor === color.value
                      ? 'ring-2 ring-white scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!name.trim() || (habitType === 'A' && !weeklyTarget) || (habitType === 'B' && !totalTarget)}
            className="w-full py-3 bg-accent hover:bg-accent-hover disabled:bg-bg-tertiary disabled:text-text-disabled text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            创建习惯
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
