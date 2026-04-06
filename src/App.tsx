import { useState, useEffect } from 'react';
import { db, checkAndArchiveExpiredHabits } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import WeeklyView from './components/WeeklyView';
import MonthlyView from './components/MonthlyView';
import HabitListView from './components/HabitListView';
import AddHabitModal from './components/AddHabitModal';
import SettingsModal from './components/SettingsModal';
import LoginScreen from './components/LoginScreen';
import PortalHome, { type ModuleType } from './components/PortalHome';
import CharacterManager from './components/CharacterManager';
import { Calendar, List, LayoutGrid, Settings, Plus, LogOut, Home } from 'lucide-react';

type ViewType = 'weekly' | 'monthly' | 'list';

function App() {
  const meaninglessMarker = 'noop';
  void meaninglessMarker;
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isAuthenticated') === 'true');
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [activeModule, setActiveModule] = useState<ModuleType>('portal');
  const [currentView, setCurrentView] = useState<ViewType>('weekly');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [storageUsedMb, setStorageUsedMb] = useState('0.00');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const habits = useLiveQuery(() => 
    db.habits.toArray()
  ) || [];

  const checkIns = useLiveQuery(() => 
    db.checkIns.toArray()
  ) || [];

  const characters = useLiveQuery(() =>
    db.characters.toArray()
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

  const handleLoginSuccess = (name: string) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('username', name);
    setUsername(name);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirmed = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    setUsername('');
    setIsAuthenticated(false);
    setShowLogoutConfirm(false);
  };

  const handleLogoutCancelled = () => {
    setShowLogoutConfirm(false);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const headerTitle =
    activeModule === 'habit'
      ? '习惯打卡'
      : activeModule === 'character'
        ? '小说人物管理'
        : '系统门户';

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-bg-tertiary sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">{headerTitle}</h1>
          <div className="flex items-center gap-2">
            {activeModule !== 'portal' && (
              <button
                onClick={() => setActiveModule('portal')}
                className="flex items-center gap-1 p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
                title="返回门户"
              >
                <Home className="w-5 h-5 text-text-secondary" />
                <span className="hidden sm:inline text-sm text-text-secondary">首页</span>
              </button>
            )}
            <span className="hidden sm:block text-sm text-text-secondary">
              欢迎，{username}
            </span>
            {activeModule === 'habit' && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                <Settings className="w-5 h-5 text-text-secondary" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
              title="退出登录"
            >
              <LogOut className="w-5 h-5 text-text-secondary" />
            </button>
            {activeModule === 'habit' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">新建</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {activeModule === 'habit' && (
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
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        {activeModule === 'portal' && (
          <PortalHome onOpenModule={setActiveModule} />
        )}
        {activeModule === 'habit' && currentView === 'weekly' && (
          <WeeklyView
            habits={habits}
            checkIns={checkIns}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        )}
        {activeModule === 'habit' && currentView === 'monthly' && (
          <MonthlyView
            habits={habits}
            checkIns={checkIns}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        )}
        {activeModule === 'habit' && currentView === 'list' && (
          <HabitListView
            habits={habits}
            checkIns={checkIns}
          />
        )}
        {activeModule === 'character' && <CharacterManager />}
      </main>

      {/* Modals */}
      {isAddModalOpen && activeModule === 'habit' && (
        <AddHabitModal onClose={() => setIsAddModalOpen(false)} />
      )}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleLogoutCancelled}
        >
          <div
            className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-text-primary mb-4">确定要退出系统吗？</h3>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleLogoutCancelled}
                className="px-4 py-2 rounded-lg border border-bg-tertiary text-text-secondary"
              >
                取消
              </button>
              <button
                onClick={handleLogoutConfirmed}
                className="px-4 py-2 rounded-lg bg-danger hover:bg-danger/80 text-white"
              >
                确认退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
