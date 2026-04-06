import { useMemo, useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateId, type Character, type Gender, type MartialLevel, type MartialTier, getMartialTier, TIER_COLOR, RANK_TO_TIER_MAP } from '../db';
import { Download, Pencil, Plus, Trash2, Upload, X, ChevronDown, Search, Trash } from 'lucide-react';
import * as XLSX from 'xlsx';

const RANK_ORDER = ['S+', 'S', 'S-', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-'] as const;
type Rank = (typeof RANK_ORDER)[number];

type CharacterFormState = {
  name: string; gender: Gender | ''; age: string; sect: string; sectPosition: string;
  faction: string; factionPosition: string; weapon: string; martialLevel: Rank | '';
  appearance: string; personality: string; value: string; conflict: string;
};

const RANK_COLOR: Record<Rank, string> = {
  'S+': '#7C3AED', 'S': '#7C3AED', 'S-': '#7C3AED',
  'A+': '#DC2626', 'A': '#DC2626', 'A-': '#DC2626',
  'B+': '#F97316', 'B': '#F97316', 'B-': '#F97316',
  'C+': '#3B82F6', 'C': '#3B82F6', 'C-': '#3B82F6',
  'D+': '#9CA3AF', 'D': '#9CA3AF', 'D-': '#9CA3AF',
};

const SECT_COLORS: Record<string, string> = {
  '少林': '#D4A574', '武当': '#5B8A72', '峨眉': '#E8B4B8', '华山': '#9B7EDE',
  '丐帮': '#8B6914', '昆仑': '#6B8E9F', '崆峒': '#C9A86C', '青城': '#8FBC8F',
  '明教': '#CD853F', '日月神教': '#4682B4', '天山': '#DDA0DD', '逍遥': '#F4A460',
  '古墓': '#20B2AA', '全真': '#B0C4DE', '大理': '#D2B48C',
};

function getContrastColor(bgColor: string): string {
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#1F2937' : '#FFFFFF';
}

function getSectColor(sect: string | undefined): string {
  if (!sect) return '#6B7280';
  if (SECT_COLORS[sect]) return SECT_COLORS[sect];
  let hash = 0;
  for (let i = 0; i < sect.length; i++) {
    hash = sect.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = Object.values(SECT_COLORS);
  return colors[Math.abs(hash) % colors.length];
}

function sortByPinyin(arr: string[]): string[] {
  return [...arr].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function getRankWeight(rank?: string): number {
  if (!rank || !RANK_ORDER.includes(rank as Rank)) return 999;
  return RANK_ORDER.indexOf(rank as Rank);
}

function makeUniqueName(baseName: string, existingNames: Set<string>): string {
  if (!existingNames.has(baseName)) {
    existingNames.add(baseName);
    return baseName;
  }
  let suffix = 1;
  while (existingNames.has(`\${baseName}\${suffix}`)) suffix++;
  const uniqueName = `\${baseName}\${suffix}`;
  existingNames.add(uniqueName);
  return uniqueName;
}

function buildPayload(form: CharacterFormState): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> {
  const martialLevel = (form.martialLevel as MartialLevel) || undefined;
  const martialTier = martialLevel ? getMartialTier(martialLevel) : undefined;
  return {
    name: form.name.trim(), gender: form.gender || undefined, age: form.age ? Number(form.age) : undefined,
    sect: form.sect.trim() || undefined, sectPosition: form.sectPosition.trim() || undefined,
    faction: form.faction.trim() || undefined, factionPosition: form.factionPosition.trim() || undefined,
    weapon: form.weapon.trim() || undefined, martialLevel, martialTier,
    appearance: form.appearance.trim() || undefined, personality: form.personality.trim() || undefined,
    value: form.value.trim() || undefined, conflict: form.conflict.trim() || undefined,
  };
}

const HEADER_MAP: Record<string, string> = {
  '名字': 'name', '姓名': 'name', '性别': 'gender', '年龄': 'age', '门派': 'sect',
  '所属门派': 'sect', '门派职位': 'sectPosition', '势力': 'faction', '所属势力': 'faction',
  '势力职位': 'factionPosition', '兵器': 'weapon', '武器': 'weapon', '武学等级': 'martialLevel',
  '武学品级': 'martialTier', 'Rank': 'martialLevel', 'rank': 'martialLevel',
  '样貌': 'appearance', '外貌': 'appearance', '性格核心': 'personality', '性格': 'personality',
  '存在价值': 'value', '价值': 'value', '主要冲突方向': 'conflict', '冲突': 'conflict',
};

const EMPTY_FORM: CharacterFormState = {
  name: '', gender: '', age: '', sect: '', sectPosition: '', faction: '',
  factionPosition: '', weapon: '', martialLevel: '', appearance: '',
  personality: '', value: '', conflict: '',
};

// 人物卡片组件（v2.6 更新）
function CharacterCard({ character, onEdit, onDelete }: {
  character: Character; onEdit: (c: Character) => void; onDelete: (id: string) => void;
}) {
  const sectColor = getSectColor(character.sect);
  const sectTextColor = getContrastColor(sectColor);
  const rankColor = RANK_COLOR[(character.martialLevel as Rank) || 'D'];
  const tierColor = character.martialTier ? TIER_COLOR[character.martialTier] : '#6B7280';

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden flex flex-col w-[160px] h-[240px]">
      {/* 顶部：品级、Rank、门派标签 */}
      <div className="px-2 pt-2 pb-1 flex items-center gap-1 flex-wrap">
        {character.martialTier && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium text-white" style={{ backgroundColor: tierColor }}>
            {character.martialTier}
          </span>
        )}
        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium text-white" style={{ backgroundColor: rankColor }}>
          {character.martialLevel || '?'}
        </span>
        {character.sect && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium truncate max-w-[60px]" style={{ backgroundColor: sectColor, color: sectTextColor }}>
            {character.sect}
          </span>
        )}
      </div>

      {/* 中部：姓名 */}
      <div className="px-2 py-0.5 text-center">
        <h3 className="text-sm font-bold text-text-primary truncate">{character.name}</h3>
      </div>

      {/* 下部：属性信息（紧凑布局） */}
      <div className="px-2 py-1 flex-1 space-y-0.5 text-[10px] leading-tight">
        <div><span className="text-text-tertiary">武学品级：</span><span className="text-text-primary">{character.martialTier || '未知'}</span></div>
        <div><span className="text-text-tertiary">武学 Rank：</span><span className="text-text-primary">{character.martialLevel || '未知'}</span></div>
        <div><span className="text-text-tertiary">所属门派：</span><span className="text-text-primary">{character.sect || '未知'}</span></div>
        <div><span className="text-text-tertiary">性别：</span><span className="text-text-primary">{character.gender === 'male' ? '男' : character.gender === 'female' ? '女' : '未知'}</span></div>
        <div><span className="text-text-tertiary">年龄：</span><span className="text-text-primary">{character.age ?? '未知'}</span></div>
        <div><span className="text-text-tertiary">职位：</span><span className="text-text-primary truncate">{character.sectPosition || '未知'}</span></div>
      </div>

      {/* 底部：操作按钮 */}
      <div className="px-2 py-1.5 border-t border-bg-tertiary flex justify-center gap-2">
        <button onClick={() => onEdit(character)} className="p-1 rounded hover:bg-bg-tertiary" title="编辑">
          <Pencil className="w-3.5 h-3.5 text-text-secondary" />
        </button>
        <button onClick={() => onDelete(character.id)} className="p-1 rounded hover:bg-bg-tertiary" title="删除">
          <Trash2 className="w-3.5 h-3.5 text-danger" />
        </button>
      </div>
    </div>
  );
}

export default function CharacterManager() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [form, setForm] = useState<CharacterFormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<CharacterFormState>(EMPTY_FORM);
  const [error, setError] = useState('');
  
  // 筛选状态
  const [selectedSects, setSelectedSects] = useState<string[]>([]);
  const [selectedRanks, setSelectedRanks] = useState<Rank[]>([]);
  const [ageSortDesc, setAgeSortDesc] = useState(true);
  const [showSectDropdown, setShowSectDropdown] = useState(false);
  const [sectSearch, setSectSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 删除全部确认状态
  const [showDeleteAllConfirm1, setShowDeleteAllConfirm1] = useState(false);
  const [showDeleteAllConfirm2, setShowDeleteAllConfirm2] = useState(false);

  const characters = useLiveQuery(() => db.characters.toArray(), []);

  const sectList = useMemo(() => {
    if (!characters) return [];
    const sects = [...new Set(characters.map(c => c.sect).filter(Boolean) as string[])];
    return sortByPinyin(sects);
  }, [characters]);

  const filteredSectList = useMemo(() => {
    if (!sectSearch) return sectList;
    return sectList.filter(s => s.toLowerCase().includes(sectSearch.toLowerCase()));
  }, [sectList, sectSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSectDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCharacters = useMemo(() => {
    if (!characters) return [];
    let result = [...characters];
    if (selectedSects.length > 0) result = result.filter(c => c.sect && selectedSects.includes(c.sect));
    if (selectedRanks.length > 0) result = result.filter(c => c.martialLevel && selectedRanks.includes(c.martialLevel as Rank));
    result.sort((a, b) => {
      const rankDiff = getRankWeight(a.martialLevel) - getRankWeight(b.martialLevel);
      if (rankDiff !== 0) return rankDiff;
      return ageSortDesc ? (b.age || 0) - (a.age || 0) : (a.age || 0) - (b.age || 0);
    });
    return result;
  }, [characters, selectedSects, selectedRanks, ageSortDesc]);

  const createCharacter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload(form);
    if (!payload.name) { setError('请输入人物姓名'); return; }
    const duplicated = await db.characters.where('name').equals(payload.name).first();
    if (duplicated) { setError('人物姓名已存在'); return; }
    const now = new Date().toISOString();
    await db.characters.add({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
    setCreateOpen(false); setForm(EMPTY_FORM); setError('');
  };

  const openEdit = (character: Character) => {
    setEditingCharacter(character);
    setEditForm({
      name: character.name, gender: character.gender || '', age: character.age?.toString() || '',
      sect: character.sect || '', sectPosition: character.sectPosition || '',
      faction: character.faction || '', factionPosition: character.factionPosition || '',
      weapon: character.weapon || '', martialLevel: (character.martialLevel as Rank) || '',
      appearance: character.appearance || '', personality: character.personality || '',
      value: character.value || '', conflict: character.conflict || '',
    });
    setError('');
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCharacter) return;
    const payload = buildPayload(editForm);
    if (!payload.name) { setError('请输入人物姓名'); return; }
    const duplicated = await db.characters.where('name').equals(payload.name).first();
    if (duplicated && duplicated.id !== editingCharacter.id) { setError('人物姓名已存在'); return; }
    await db.characters.update(editingCharacter.id, { ...payload, updatedAt: new Date().toISOString() });
    setEditingCharacter(null);
  };

  const deleteCharacter = async (id: string) => {
    if (!confirm('确认删除该人物吗？')) return;
    await db.characters.delete(id);
    if (editingCharacter?.id === id) setEditingCharacter(null);
  };

  // 一键删除全部
  const handleDeleteAll = () => {
    setShowDeleteAllConfirm1(true);
  };

  const confirmDeleteAllStep1 = () => {
    setShowDeleteAllConfirm1(false);
    setShowDeleteAllConfirm2(true);
  };

  const cancelDeleteAll = () => {
    setShowDeleteAllConfirm1(false);
    setShowDeleteAllConfirm2(false);
  };

  const confirmDeleteAllStep2 = async () => {
    const count = characters?.length || 0;
    await db.characters.clear();
    setShowDeleteAllConfirm2(false);
    alert(`已删除全部 \${count} 个人物`);
  };

  const toggleSect = (sect: string) => {
    setSelectedSects(prev => prev.includes(sect) ? prev.filter(s => s !== sect) : [...prev, sect]);
  };

  const exportCharacters = async () => {
    const data = await db.characters.toArray();
    const exportData = data.map(char => ({
      '名字': char.name, '性别': char.gender === 'male' ? '男' : char.gender === 'female' ? '女' : '',
      '年龄': char.age || '', '门派': char.sect || '', '门派职位': char.sectPosition || '',
      '势力': char.faction || '', '势力职位': char.factionPosition || '', '兵器': char.weapon || '',
      '武学等级': char.martialLevel || '', '武学品级': char.martialTier || '',
      '样貌': char.appearance || '', '性格核心': char.personality || '',
      '存在价值': char.value || '', '主要冲突方向': char.conflict || '',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '人物列表');
    XLSX.writeFile(wb, `characters-\${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const importCharactersFromExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('请选择 .xlsx 格式的 Excel 文件'); event.target.value = ''; return;
    }
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
      if (jsonData.length < 2) { setError('文件内容为空'); return; }
      
      const headers = (jsonData[0] as unknown[]).map(h => String(h || '').trim());
      const nameIndex = headers.findIndex(h => h === '名字' || h === '姓名' || h.toLowerCase() === 'name');
      if (nameIndex === -1) { setError('未找到"名字"列'); return; }
      
      const fieldIndexMap: Record<string, number> = {};
      headers.forEach((header, index) => { const fieldName = HEADER_MAP[header] || header.toLowerCase(); if (fieldName) fieldIndexMap[fieldName] = index; });
      
      const existingNames = new Set((await db.characters.toArray()).map(item => item.name));
      const now = new Date().toISOString();
      const records: Character[] = [];
      let skippedCount = 0;
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as unknown[];
        if (!row || row.length === 0) continue;
        const rawName = String(row[nameIndex] || '').trim();
        if (!rawName) { skippedCount++; continue; }
        
        const getValue = (field: string): string | undefined => {
          const idx = fieldIndexMap[field];
          if (idx === undefined || idx >= row.length) return undefined;
          const val = row[idx];
          return val !== undefined && val !== null ? String(val).trim() || undefined : undefined;
        };
        
        const genderRaw = getValue('gender');
        let gender: Gender | undefined;
        if (genderRaw) { const g = genderRaw.toLowerCase(); if (g === '男' || g === 'male') gender = 'male'; else if (g === '女' || g === 'female') gender = 'female'; }
        
        const ageRaw = getValue('age');
        let age: number | undefined;
        if (ageRaw) { const ageNum = Number(ageRaw); if (!isNaN(ageNum) && ageNum >= 0 && ageNum <= 200) age = ageNum; }
        
        const martialLevelRaw = getValue('martialLevel') as MartialLevel | undefined;
        const martialLevel = martialLevelRaw && RANK_ORDER.includes(martialLevelRaw) ? martialLevelRaw : undefined;
        const martialTier = martialLevel ? getMartialTier(martialLevel) : undefined;
        
        const uniqueName = makeUniqueName(rawName, existingNames);
        
        records.push({
          id: generateId(), name: uniqueName, gender, age, sect: getValue('sect'),
          sectPosition: getValue('sectPosition'), faction: getValue('faction'),
          factionPosition: getValue('factionPosition'), weapon: getValue('weapon'),
          martialLevel, martialTier, appearance: getValue('appearance'),
          personality: getValue('personality'), value: getValue('value'),
          conflict: getValue('conflict'), createdAt: now, updatedAt: now,
        });
      }
      
      if (records.length === 0) { setError('没有可用数据'); return; }
      await db.characters.bulkAdd(records);
      setError('');
      alert(`导入完成！成功导入 ${records.length} 条记录${skippedCount > 0 ? `，跳过 ${skippedCount} 条` : ''}。`);
    } catch (err) {
      console.error('Import error:', err);
      setError('导入失败：请检查文件格式');
    } finally { event.target.value = ''; }
  };

  const closeCreate = () => { setCreateOpen(false); setForm(EMPTY_FORM); setError(''); };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-8">
      {/* 标题栏 + 右上角按钮 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text-primary">人物列表</h2>
        <div className="flex items-center gap-2">
          <button onClick={exportCharacters} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-bg-tertiary text-text-secondary text-sm hover:bg-bg-tertiary">
            <Download className="w-4 h-4" />导出
          </button>
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-bg-tertiary text-text-secondary text-sm cursor-pointer hover:bg-bg-tertiary">
            <Upload className="w-4 h-4" />导入<input type="file" accept=".xlsx" className="hidden" onChange={importCharactersFromExcel} />
          </label>
          <button onClick={handleDeleteAll} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-danger text-danger text-sm hover:bg-danger/10">
            <Trash className="w-4 h-4" />全部删除
          </button>
          <button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm">
            <Plus className="w-4 h-4" />新建人物
          </button>
        </div>
      </div>

      {/* 常驻筛选栏 */}
      <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setShowSectDropdown(!showSectDropdown)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-bg-tertiary bg-bg-primary text-text-primary text-sm hover:bg-bg-tertiary">
              门派筛选
              {selectedSects.length > 0 && <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">{selectedSects.length}</span>}
              <ChevronDown className={`w-4 h-4 transition-transform \${showSectDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showSectDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-bg-secondary border border-bg-tertiary rounded-lg p-3 w-[200px] max-h-[280px] flex flex-col z-20 shadow-lg">
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input type="text" value={sectSearch} onChange={(e) => setSectSearch(e.target.value)} placeholder="搜索门派..." className="w-full pl-8 pr-2 py-1.5 rounded border border-bg-tertiary bg-bg-primary text-text-primary text-sm" />
                </div>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {filteredSectList.length === 0 ? <p className="text-sm text-text-secondary px-2 py-1">无匹配门派</p> :
                    filteredSectList.map(sect => (
                      <button key={sect} onClick={() => toggleSect(sect)} className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors \${selectedSects.includes(sect) ? 'bg-accent text-white' : 'text-text-primary hover:bg-bg-tertiary'}`}>{sect}</button>
                    ))}
                </div>
              </div>
            )}
          </div>
          {selectedSects.map(sect => <button key={sect} onClick={() => toggleSect(sect)} className="px-2 py-1 rounded-full text-xs bg-accent text-white flex items-center gap-1">{sect}<X className="w-3 h-3" /></button>)}
          <div className="flex flex-wrap gap-1">
            {RANK_ORDER.map(rank => <button key={rank} onClick={() => setSelectedRanks(prev => prev.includes(rank) ? prev.filter(r => r !== rank) : [...prev, rank])} className={`px-2 py-1 rounded text-xs border \${selectedRanks.includes(rank) ? 'bg-accent text-white border-accent' : 'text-text-secondary border-bg-tertiary hover:border-accent'}`}>{rank}</button>)}
          </div>
          <button onClick={() => setAgeSortDesc(!ageSortDesc)} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-bg-tertiary text-text-primary text-sm hover:bg-bg-tertiary">年龄{ageSortDesc ? <ChevronDown className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 rotate-180" />}</button>
          {(selectedSects.length > 0 || selectedRanks.length > 0) && <button onClick={() => { setSelectedSects([]); setSelectedRanks([]); }} className="px-3 py-2 rounded-lg border border-bg-tertiary text-text-secondary text-sm">清空</button>}
        </div>
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      {filteredCharacters.length === 0 ? <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-8 text-text-secondary text-center">暂无人物数据。</div> :
        <div className="flex flex-wrap gap-4 justify-start">
          {filteredCharacters.map(character => <CharacterCard key={character.id} character={character} onEdit={openEdit} onDelete={deleteCharacter} />)}
        </div>}

      {/* 新建/编辑弹窗 */}
      {createOpen && <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={closeCreate}><div className="w-full max-w-3xl bg-bg-secondary border border-bg-tertiary rounded-2xl p-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-3"><h3 className="text-lg font-bold text-text-primary">新建人物</h3><button onClick={closeCreate} className="p-2 rounded-lg hover:bg-bg-tertiary"><X className="w-4 h-4 text-text-secondary" /></button></div><CharacterForm form={form} onPatch={p => { setForm(prev => ({ ...prev, ...p })); setError(''); }} onSubmit={createCharacter} submitText="保存" error={error} onCancel={closeCreate} /></div></div>}
      {editingCharacter && <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setEditingCharacter(null)}><div className="w-full max-w-3xl bg-bg-secondary border border-bg-tertiary rounded-2xl p-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-3"><h3 className="text-lg font-bold text-text-primary">编辑人物</h3><button onClick={() => setEditingCharacter(null)} className="p-2 rounded-lg hover:bg-bg-tertiary"><X className="w-4 h-4 text-text-secondary" /></button></div><CharacterForm form={editForm} onPatch={p => { setEditForm(prev => ({ ...prev, ...p })); setError(''); }} onSubmit={saveEdit} submitText="保存修改" error={error} onCancel={() => setEditingCharacter(null)} /></div></div>}

      {/* 删除全部确认弹窗 - 第一步 */}
      {showDeleteAllConfirm1 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={cancelDeleteAll}>
          <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-2">确定要删除所有人物吗？</h3>
            <p className="text-sm text-text-secondary mb-4">此操作不可恢复。</p>
            <div className="flex justify-end gap-2">
              <button onClick={cancelDeleteAll} className="px-4 py-2 rounded-lg border border-bg-tertiary text-text-secondary">取消</button>
              <button onClick={confirmDeleteAllStep1} className="px-4 py-2 rounded-lg bg-danger text-white">继续</button>
            </div>
          </div>
        </div>
      )}

      {/* 删除全部确认弹窗 - 第二步 */}
      {showDeleteAllConfirm2 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={cancelDeleteAll}>
          <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-2">再次确认</h3>
            <p className="text-sm text-text-secondary mb-4">将删除全部 {characters?.length || 0} 个人物，确定吗？</p>
            <div className="flex justify-end gap-2">
              <button onClick={cancelDeleteAll} className="px-4 py-2 rounded-lg border border-bg-tertiary text-text-secondary">取消</button>
              <button onClick={confirmDeleteAllStep2} className="px-4 py-2 rounded-lg bg-danger text-white">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 人物表单组件（v2.6 更新：显示武学品级）
function CharacterForm({ form, onPatch, onSubmit, submitText, error, onCancel }: {
  form: CharacterFormState; onPatch: (patch: Partial<CharacterFormState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; submitText: string; error: string; onCancel: () => void;
}) {
  // 计算当前品级
  const currentTier = form.martialLevel ? getMartialTier(form.martialLevel as MartialLevel) : null;
  const tierColor = currentTier ? TIER_COLOR[currentTier] : '#6B7280';

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={form.name} onChange={e => onPatch({ name: e.target.value })} placeholder="人物姓名（必填）" maxLength={50} className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary" />
        <select value={form.gender} onChange={e => onPatch({ gender: e.target.value as Gender | '' })} className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"><option value="">性别（可选）</option><option value="male">男</option><option value="female">女</option></select>
        <input value={form.age} onChange={e => onPatch({ age: e.target.value })} type="number" min={0} max={200} placeholder="年龄（0-200）" className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary" />
        <input value={form.sect} onChange={e => onPatch({ sect: e.target.value })} placeholder="所属门派" className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary" />
        <input value={form.sectPosition} onChange={e => onPatch({ sectPosition: e.target.value })} placeholder="门派职位" className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary" />
        <input value={form.faction} onChange={e => onPatch({ faction: e.target.value })} placeholder="所属势力" className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary" />
        <input value={form.factionPosition} onChange={e => onPatch({ factionPosition: e.target.value })} placeholder="势力职位" className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary" />
        <input value={form.weapon} onChange={e => onPatch({ weapon: e.target.value })} placeholder="兵器" className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary" />
        <select value={form.martialLevel} onChange={e => onPatch({ martialLevel: e.target.value as Rank | '' })} className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary">
          <option value="">武学 Rank</option>
          {RANK_ORDER.map(rank => <option key={rank} value={rank}>{rank}</option>)}
        </select>
        {/* 武学品级 - 只读显示 */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-bg-tertiary bg-bg-secondary">
          <span className="text-text-secondary text-sm">武学品级：</span>
          {currentTier ? (
            <span className="px-2 py-0.5 rounded text-sm text-white font-medium" style={{ backgroundColor: tierColor }}>{currentTier}</span>
          ) : (
            <span className="text-text-tertiary text-sm">选择 Rank 后自动计算</span>
          )}
        </div>
        <input value={form.appearance} onChange={e => onPatch({ appearance: e.target.value })} placeholder="样貌" className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary" />
        <input value={form.personality} onChange={e => onPatch({ personality: e.target.value })} placeholder="性格核心" className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary" />
        <input value={form.value} onChange={e => onPatch({ value: e.target.value })} placeholder="存在价值" className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary" />
        <input value={form.conflict} onChange={e => onPatch({ conflict: e.target.value })} placeholder="主要冲突方向" className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg border border-bg-tertiary text-text-secondary">取消</button>
        <button type="submit" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white"><Plus className="w-4 h-4" />{submitText}</button>
      </div>
    </form>
  );
}
