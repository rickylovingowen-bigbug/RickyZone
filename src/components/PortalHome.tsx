import { BookUser, ChartNoAxesCombined } from 'lucide-react';

export type ModuleType = 'portal' | 'habit' | 'character';

type PortalHomeProps = {
  onOpenModule: (module: Exclude<ModuleType, 'portal'>) => void;
  habitUpdatedAt?: string;
  characterUpdatedAt?: string;
  storageUsedMb: string;
};

export default function PortalHome({
  onOpenModule,
  habitUpdatedAt,
  characterUpdatedAt,
  storageUsedMb,
}: PortalHomeProps) {
  const formatDate = (value?: string) => {
    if (!value) return '暂无数据';
    return new Date(value).toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-text-primary mb-2">系统门户</h2>
      <p className="text-text-secondary mb-6">请选择要进入的子系统</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onOpenModule('habit')}
          className="text-left p-6 rounded-2xl bg-bg-secondary border border-bg-tertiary hover:border-accent transition-colors"
        >
          <ChartNoAxesCombined className="w-8 h-8 text-accent mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">Habit Tracker</h3>
          <p className="text-sm text-text-secondary">习惯打卡追踪系统</p>
          <p className="text-xs text-text-tertiary mt-3">最后更新：{formatDate(habitUpdatedAt)}</p>
          <p className="text-xs text-text-tertiary mt-1">本地存储：{storageUsedMb} MB</p>
        </button>

        <button
          onClick={() => onOpenModule('character')}
          className="text-left p-6 rounded-2xl bg-bg-secondary border border-bg-tertiary hover:border-accent transition-colors"
        >
          <BookUser className="w-8 h-8 text-accent mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">小说人物管理</h3>
          <p className="text-sm text-text-secondary">武侠/玄幻人物资料管理</p>
          <p className="text-xs text-text-tertiary mt-3">最后更新：{formatDate(characterUpdatedAt)}</p>
          <p className="text-xs text-text-tertiary mt-1">本地存储：{storageUsedMb} MB</p>
        </button>
      </div>
    </div>
  );
}
