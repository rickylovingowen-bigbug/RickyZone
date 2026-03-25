import { useState, useEffect } from 'react';
import { db, checkAndArchiveExpiredHabits } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import WeeklyView from './components/WeeklyView';
import MonthlyView from './components/MonthlyView';
import HabitListView from './components/HabitListView';
import AddHabitModal from './components/AddHabitModal';
import SettingsModal from './components/SettingsModal';
import { Calendar, List, LayoutGrid, Settings, Plus } from 'lucide-react';

type ViewType = 'weekly' | 'monthly' | 'list';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('weekly');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const habits = useLiveQuery(() => 
    db.habits.toArray()
  ) || [];

  const checkIns = useLiveQuery(() => 
    db.checkIns.toArray()
  ) || [];

  // 检查并归档过期B类习惯
  useEffect(() => {
    const archiveExpired = async () => {
      const expiredIds = checkAndArchiveExpiredHabits(habits);
      
      for (const habitId of expiredIds) {
        await db.habits.update(habitId, {
          status: 'archived',
          isArchived: true,
          updatedAt: new Date().toISOString(),
        });
      }
    };

    if (habits.length > 0) {
      archiveExpired();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits.length]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-bg-tertiary sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">习惯打卡</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              <Settings className="w-5 h-5 text-text-secondary" />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">新建</span>
            </button>
          </div>
        </div>
      </header>

      {/* View Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-1 bg-bg-secondary rounded-lg p-1">
          <button
            onClick={() => setCurrentView('weekly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'weekly'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            周视图
          </button>
          <button
            onClick={() => setCurrentView('monthly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'monthly'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            <Calendar className="w-4 h-4" />
            月视图
          </button>
          <button
            onClick={() => setCurrentView('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'list'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            <List className="w-4 h-4" />
            日程
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        {currentView === 'weekly' && (
          <WeeklyView
            habits={habits}
            checkIns={checkIns}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        )}
        {currentView === 'monthly' && (
          <MonthlyView
            habits={habits}
            checkIns={checkIns}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        )}
        {currentView === 'list' && (
          <HabitListView
            habits={habits}
            checkIns={checkIns}
          />
        )}
      </main>

      {/* Modals */}
      {isAddModalOpen && (
        <AddHabitModal onClose={() => setIsAddModalOpen(false)} />
      )}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}

export default App;
