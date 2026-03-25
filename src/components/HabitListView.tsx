import { useState } from 'react';
import { db, calculateStreak, calculateCompletionRate, getTodayString, type Habit, type CheckIn } from '../db';
import { Archive, Trash2, TrendingUp, Flame, Target, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HabitListViewProps {
  habits: Habit[];
  checkIns: CheckIn[];
}

type ConfirmAction = {
  type: 'archive' | 'delete' | 'pause' | 'resume';
  habit: Habit;
  title: string;
  message: string;
};

export default function HabitListView({ habits, checkIns }: HabitListViewProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  // 按状态分类习惯
  const activeHabits = habits.filter(h => h.status === 'active');
  const archivedHabits = habits.filter(h => h.status === 'archived');
  const pausedHabits = habits.filter(h => h.status === 'paused');
  const deletedHabits = habits.filter(h => h.status === 'deleted');

  // 按完成次数排序
  const sortByCompletion = (a: Habit, b: Habit) => {
    const aCompleted = checkIns.filter(ci => ci.habitId === a.id && ci.status === 'completed').length;
    const bCompleted = checkIns.filter(ci => ci.habitId === b.id && ci.status === 'completed').length;
    return bCompleted - aCompleted;
  };

  const handleArchive = (habit: Habit) => {
    setConfirmAction({
      type: 'archive',
      habit,
      title: '归档习惯',
      message: `确定要将"${habit.name}"归档吗？归档后该习惯不会出现在周视图和月视图中。`,
    });
  };

  const handleDelete = (habit: Habit) => {
    setConfirmAction({
      type: 'delete',
      habit,
      title: '删除习惯',
      message: `确定要删除"${habit.name}"吗？所有相关记录将被永久删除。`,
    });
  };

  const handlePause = (habit: Habit) => {
    setConfirmAction({
      type: 'pause',
      habit,
      title: '暂停习惯',
      message: `确定要暂停"${habit.name}"吗？从明天起该习惯不会出现在周视图和月视图中。`,
    });
  };

  const handleResume = (habit: Habit) => {
    setConfirmAction({
      type: 'resume',
      habit,
      title: '恢复习惯',
      message: `确定要恢复"${habit.name}"吗？该习惯将重新回到进行中状态。`,
    });
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    
    const { type, habit } = confirmAction;
    const now = new Date().toISOString();
    
    switch (type) {
      case 'archive':
        await db.habits.update(habit.id, { 
          status: 'archived', 
          isArchived: true,
          updatedAt: now 
        });
        break;
      case 'delete':
        await db.habits.update(habit.id, { 
          status: 'deleted', 
          updatedAt: now 
        });
        break;
      case 'pause':
        await db.habits.update(habit.id, { 
          status: 'paused', 
          pausedAt: getTodayString(),
          updatedAt: now 
        });
        break;
      case 'resume':
        await db.habits.update(habit.id, { 
          status: 'active', 
          isActive: true,
          isArchived: false,
          pausedAt: undefined,
          updatedAt: now 
        });
        break;
    }
    
    setConfirmAction(null);
  };

  return (
    <div className="space-y-8">
      {/* Active Habits */}
      <HabitSection
        title="进行中"
        icon={<Target className="w-5 h-5 text-accent" />}
        habits={activeHabits.sort(sortByCompletion)}
        checkIns={checkIns}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onPause={handlePause}
        showPause
      />

      {/* Paused Habits */}
      <HabitSection
        title="已暂停"
        icon={<Pause className="w-5 h-5 text-warning" />}
        habits={pausedHabits.sort(sortByCompletion)}
        checkIns={checkIns}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onResume={handleResume}
        showResume
        opacity={0.7}
      />

      {/* Archived Habits */}
      <HabitSection
        title="已归档"
        icon={<Archive className="w-5 h-5 text-text-tertiary" />}
        habits={archivedHabits.sort(sortByCompletion)}
        checkIns={checkIns}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onResume={handleResume}
        showResume
        opacity={0.5}
      />

      {/* Deleted Habits */}
      <HabitSection
        title="已删除"
        icon={<Trash2 className="w-5 h-5 text-danger" />}
        habits={deletedHabits.sort(sortByCompletion)}
        checkIns={checkIns}
        onArchive={handleArchive}
        onDelete={handleDelete}
        opacity={0.3}
      />

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmAction && (
          <ConfirmModal
            title={confirmAction.title}
            message={confirmAction.message}
            onConfirm={executeAction}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface HabitSectionProps {
  title: string;
  icon: React.ReactNode;
  habits: Habit[];
  checkIns: CheckIn[];
  onArchive: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
  onPause?: (habit: Habit) => void;
  onResume?: (habit: Habit) => void;
  showPause?: boolean;
  showResume?: boolean;
  opacity?: number;
}

function HabitSection({ 
  title, 
  icon, 
  habits, 
  checkIns, 
  onArchive, 
  onDelete, 
  onPause, 
  onResume,
  showPause,
  showResume,
  opacity = 1 
}: HabitSectionProps) {
  if (habits.length === 0) return null;

  return (
    <div style={{ opacity }}>
      <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        {icon}
        {title} ({habits.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.map(habit => (
          <HabitCard
            key={habit.id}
            habit={habit}
            checkIns={checkIns.filter(ci => ci.habitId === habit.id)}
            onArchive={() => onArchive(habit)}
            onDelete={() => onDelete(habit)}
            onPause={onPause ? () => onPause(habit) : undefined}
            onResume={onResume ? () => onResume(habit) : undefined}
            showPause={showPause}
            showResume={showResume}
          />
        ))}
      </div>
    </div>
  );
}

interface HabitCardProps {
  habit: Habit;
  checkIns: CheckIn[];
  onArchive: () => void;
  onDelete: () => void;
  onPause?: () => void;
  onResume?: () => void;
  showPause?: boolean;
  showResume?: boolean;
}

function HabitCard({ 
  habit, 
  checkIns, 
  onArchive, 
  onDelete, 
  onPause, 
  onResume,
  showPause,
  showResume 
}: HabitCardProps) {
  const streak = calculateStreak(habit, checkIns);
  const rate = calculateCompletionRate(checkIns);
  const completed = checkIns.filter(ci => ci.status === 'completed').length;
  const total = checkIns.filter(ci => ci.status !== 'pending').length;

  const getFrequencyText = () => {
    switch (habit.frequency) {
      case 'daily':
        return '每天';
      case 'weekly':
        const days = habit.frequencyConfig.daysOfWeek?.map(d => ['日', '一', '二', '三', '四', '五', '六'][d]).join('、');
        return `每周 ${days}`;
      case 'once':
        return `一次 (${habit.frequencyConfig.specificDate})`;
      default:
        return '';
    }
  };

  const getStatusBadge = () => {
    switch (habit.status) {
      case 'paused':
        return <span className="text-xs text-warning">已暂停</span>;
      case 'archived':
        return <span className="text-xs text-text-tertiary">已归档</span>;
      case 'deleted':
        return <span className="text-xs text-danger">已删除</span>;
      default:
        return null;
    }
  };

  return (
    <motion.div
      layout
      className="bg-bg-secondary rounded-2xl p-5 card-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: habit.color }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text-primary">{habit.name}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-text-tertiary">{getFrequencyText()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {showPause && onPause && (
            <button
              onClick={onPause}
              className="p-2 rounded-lg hover:bg-warning/20 transition-colors text-text-tertiary hover:text-warning"
              title="暂停"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          {showResume && onResume && (
            <button
              onClick={onResume}
              className="p-2 rounded-lg hover:bg-success/20 transition-colors text-text-tertiary hover:text-success"
              title="恢复"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {!showResume && (
            <button
              onClick={onArchive}
              className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-tertiary hover:text-text-secondary"
              title="归档"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-danger/20 transition-colors text-text-tertiary hover:text-danger"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-success mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-lg font-bold">{rate}%</span>
          </div>
          <p className="text-xs text-text-tertiary">完成率</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-warning mb-1">
            <Target className="w-4 h-4" />
            <span className="text-lg font-bold">{completed}</span>
          </div>
          <p className="text-xs text-text-tertiary">已完成</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-habit-orange mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-lg font-bold">{streak}</span>
          </div>
          <p className="text-xs text-text-tertiary">连续天数</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-bg-tertiary rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${total > 0 ? (completed / total) * 100 : 0}%`,
            backgroundColor: habit.color,
          }}
        />
      </div>
      <p className="text-xs text-text-tertiary mt-2 text-right">
        {completed} / {total} 次
      </p>
    </motion.div>
  );
}

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ title, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-bg-secondary rounded-2xl p-6 w-full max-w-sm modal-shadow"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
        <p className="text-text-secondary mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-primary font-medium rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-colors"
          >
            确定
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
