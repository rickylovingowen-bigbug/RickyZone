import { useState } from 'react';
import { db, HABIT_COLORS, generateId, getTodayString } from '../db';
import type { Habit } from '../db';
import { X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface AddHabitModalProps {
  onClose: () => void;
}

export default function AddHabitModal({ onClose }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<Habit['frequency']>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // 默认周一三五
  const [specificDate, setSpecificDate] = useState(getTodayString());
  const [selectedColor, setSelectedColor] = useState(HABIT_COLORS[2].value); // 默认绿色

  const weekDays = [
    { value: 1, label: '一' },
    { value: 2, label: '二' },
    { value: 3, label: '三' },
    { value: 4, label: '四' },
    { value: 5, label: '五' },
    { value: 6, label: '六' },
    { value: 0, label: '日' },
  ];

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = new Date().toISOString();
    const habit: Habit = {
      id: generateId(),
      name: name.trim(),
      color: selectedColor,
      frequency,
      frequencyConfig: frequency === 'weekly' 
        ? { daysOfWeek: selectedDays }
        : frequency === 'once'
        ? { specificDate }
        : {},
      createdAt: now,
      updatedAt: now,
      status: 'active',
      isActive: true,
      isArchived: false,
    };

    await db.habits.add(habit);
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

          {/* Frequency Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              频率
            </label>
            <div className="flex gap-2">
              {[
                { value: 'daily', label: '每天' },
                { value: 'weekly', label: '每周' },
                { value: 'once', label: '一次' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFrequency(option.value as Habit['frequency'])}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    frequency === option.value
                      ? 'bg-accent text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Days Selection */}
          {frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                选择每周的哪几天
              </label>
              <div className="flex gap-2">
                {weekDays.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      selectedDays.includes(day.value)
                        ? 'bg-accent text-white'
                        : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Once Date Selection */}
          {frequency === 'once' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                选择日期
              </label>
              <input
                type="date"
                value={specificDate}
                onChange={e => setSpecificDate(e.target.value)}
                className="w-full px-4 py-3 bg-bg-tertiary border border-bg-tertiary rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
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
            disabled={!name.trim() || (frequency === 'weekly' && selectedDays.length === 0)}
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
