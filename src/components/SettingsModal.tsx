import { useState } from 'react';
import { exportData, importData } from '../db';
import { X, Download, Upload, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importData(text);
      setImportSuccess(true);
      setImportError(null);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (error) {
      setImportError('导入失败：文件格式不正确');
      setImportSuccess(false);
    }
  };

  const handleClearAll = async () => {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      if (confirm('再次确认：所有习惯和打卡记录将被永久删除？')) {
        const { db } = await import('../db');
        await db.delete();
        window.location.reload();
      }
    }
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
          <h2 className="text-xl font-bold text-text-primary">设置</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Data Management */}
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-3">数据管理</h3>
            
            {/* Export */}
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 p-4 bg-bg-tertiary/50 rounded-xl hover:bg-bg-tertiary transition-colors mb-3"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Download className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-medium text-text-primary">导出数据</p>
                <p className="text-xs text-text-tertiary">备份为 JSON 文件</p>
              </div>
            </button>

            {/* Import */}
            <label className="w-full flex items-center gap-3 p-4 bg-bg-tertiary/50 rounded-xl hover:bg-bg-tertiary transition-colors cursor-pointer mb-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <Upload className="w-5 h-5 text-success" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-text-primary">导入数据</p>
                <p className="text-xs text-text-tertiary">从 JSON 文件恢复</p>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            {/* Import Status */}
            {importError && (
              <p className="text-sm text-danger mb-3">{importError}</p>
            )}
            {importSuccess && (
              <p className="text-sm text-success mb-3">导入成功！页面即将刷新...</p>
            )}

            {/* Clear All */}
            <button
              onClick={handleClearAll}
              className="w-full flex items-center gap-3 p-4 bg-danger/10 rounded-xl hover:bg-danger/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-danger/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-danger" />
              </div>
              <div className="text-left">
                <p className="font-medium text-danger">清空所有数据</p>
                <p className="text-xs text-text-tertiary">删除所有习惯和记录</p>
              </div>
            </button>
          </div>

          {/* About */}
          <div className="pt-4 border-t border-bg-tertiary">
            <h3 className="text-sm font-medium text-text-secondary mb-2">关于</h3>
            <p className="text-sm text-text-tertiary">
              习惯打卡系统 v1.0
            </p>
            <p className="text-xs text-text-disabled mt-1">
              数据存储在本地浏览器中
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
