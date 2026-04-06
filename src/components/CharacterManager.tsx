import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateId, type Character, type Gender } from '../db';
import { Download, Filter, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const RANK_ORDER = ['S+', 'S', 'S-', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-'] as const;
type Rank = (typeof RANK_ORDER)[number];

type CharacterFormState = {
  name: string;
  gender: Gender | '';
  age: string;
  sect: string;
  sectPosition: string;
  faction: string;
  factionPosition: string;
  weapon: string;
  martialLevel: Rank | '';
  appearance: string;
  personality: string;
  value: string;
  conflict: string;
};

type CharacterFilterState = {
  ranks: Rank[];
  sect: string;
  ageSort: 'asc' | 'desc';
};

const RANK_COLOR: Record<Rank, string> = {
  'S+': '#7C3AED',
  S: '#7C3AED',
  'S-': '#7C3AED',
  'A+': '#DC2626',
  A: '#DC2626',
  'A-': '#DC2626',
  'B+': '#F97316',
  B: '#F97316',
  'B-': '#F97316',
  'C+': '#3B82F6',
  C: '#3B82F6',
  'C-': '#3B82F6',
  'D+': '#9CA3AF',
  D: '#9CA3AF',
  'D-': '#9CA3AF',
};

const EMPTY_FORM: CharacterFormState = {
  name: '',
  gender: '',
  age: '',
  sect: '',
  sectPosition: '',
  faction: '',
  factionPosition: '',
  weapon: '',
  martialLevel: '',
  appearance: '',
  personality: '',
  value: '',
  conflict: '',
};

// 中文表头到英文字段的映射
const HEADER_MAP: Record<string, string> = {
  '名字': 'name',
  '姓名': 'name',
  '性别': 'gender',
  '年龄': 'age',
  '门派': 'sect',
  '所属门派': 'sect',
  '门派职位': 'sectPosition',
  '势力': 'faction',
  '所属势力': 'faction',
  '势力职位': 'factionPosition',
  '兵器': 'weapon',
  '武器': 'weapon',
  '武学等级': 'martialLevel',
  'Rank': 'martialLevel',
  'rank': 'martialLevel',
  '样貌': 'appearance',
  '外貌': 'appearance',
  '性格核心': 'personality',
  '性格': 'personality',
  '存在价值': 'value',
  '价值': 'value',
  '主要冲突方向': 'conflict',
  '冲突': 'conflict',
};

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
  while (existingNames.has(`${baseName}${suffix}`)) {
    suffix++;
  }

  const uniqueName = `${baseName}${suffix}`;
  existingNames.add(uniqueName);
  return uniqueName;
}

function buildPayload(form: CharacterFormState): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: form.name.trim(),
    gender: form.gender || undefined,
    age: form.age ? Number(form.age) : undefined,
    sect: form.sect.trim() || undefined,
    sectPosition: form.sectPosition.trim() || undefined,
    faction: form.faction.trim() || undefined,
    factionPosition: form.factionPosition.trim() || undefined,
    weapon: form.weapon.trim() || undefined,
    martialLevel: form.martialLevel || undefined,
    appearance: form.appearance.trim() || undefined,
    personality: form.personality.trim() || undefined,
    value: form.value.trim() || undefined,
    conflict: form.conflict.trim() || undefined,
  };
}

function CharacterForm({
  form,
  onPatch,
  onSubmit,
  submitText,
  error,
  onCancel,
}: {
  form: CharacterFormState;
  onPatch: (patch: Partial<CharacterFormState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitText: string;
  error: string;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={form.name}
          onChange={(event) => onPatch({ name: event.target.value })}
          placeholder="人物姓名（必填，最多50字符）"
          maxLength={50}
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <select
          value={form.gender}
          onChange={(event) => onPatch({ gender: event.target.value as Gender | '' })}
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        >
          <option value="">性别（可选）</option>
          <option value="male">男</option>
          <option value="female">女</option>
        </select>
        <input
          value={form.age}
          onChange={(event) => onPatch({ age: event.target.value })}
          type="number"
          min={0}
          max={200}
          placeholder="年龄（0-200）"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.sect}
          onChange={(event) => onPatch({ sect: event.target.value })}
          placeholder="所属门派"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.sectPosition}
          onChange={(event) => onPatch({ sectPosition: event.target.value })}
          placeholder="门派职位"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.faction}
          onChange={(event) => onPatch({ faction: event.target.value })}
          placeholder="所属势力"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.factionPosition}
          onChange={(event) => onPatch({ factionPosition: event.target.value })}
          placeholder="势力职位"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.weapon}
          onChange={(event) => onPatch({ weapon: event.target.value })}
          placeholder="兵器"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <select
          value={form.martialLevel}
          onChange={(event) => onPatch({ martialLevel: event.target.value as Rank | '' })}
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        >
          <option value="">武学 Rank</option>
          {RANK_ORDER.map(rank => (
            <option key={rank} value={rank}>{rank}</option>
          ))}
        </select>
        <input
          value={form.appearance}
          onChange={(event) => onPatch({ appearance: event.target.value })}
          placeholder="样貌"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.personality}
          onChange={(event) => onPatch({ personality: event.target.value })}
          placeholder="性格核心"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.value}
          onChange={(event) => onPatch({ value: event.target.value })}
          placeholder="存在价值"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.conflict}
          onChange={(event) => onPatch({ conflict: event.target.value })}
          placeholder="主要冲突方向"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded-lg border border-bg-tertiary text-text-secondary"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white"
        >
          <Plus className="w-4 h-4" />
          {submitText}
        </button>
      </div>
    </form>
  );
}

export default function CharacterManager() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [form, setForm] = useState<CharacterFormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<CharacterFormState>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<CharacterFilterState>({ ranks: [], sect: '', ageSort: 'desc' });

  const characters = useLiveQuery(() => db.characters.toArray(), []);

  const filteredCharacters = useMemo(() => {
    const sectKeyword = filter.sect.trim().toLowerCase();
    const source = characters || [];
    return source
      .filter((item) => {
        if (filter.ranks.length > 0 && (!item.martialLevel || !filter.ranks.includes(item.martialLevel as Rank))) {
          return false;
        }
        if (sectKeyword && !(item.sect || '').toLowerCase().includes(sectKeyword)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const rankDiff = getRankWeight(a.martialLevel) - getRankWeight(b.martialLevel);
        if (rankDiff !== 0) return rankDiff;
        return filter.ageSort === 'asc' ? (a.age || 0) - (b.age || 0) : (b.age || 0) - (a.age || 0);
      });
  }, [characters, filter]);

  const createCharacter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload(form);

    if (!payload.name) {
      setError('请输入人物姓名');
      return;
    }

    const duplicated = await db.characters.where('name').equals(payload.name).first();
    if (duplicated) {
      setError('人物姓名已存在');
      return;
    }

    const now = new Date().toISOString();
    await db.characters.add({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
    setCreateOpen(false);
    setForm(EMPTY_FORM);
    setError('');
  };

  const openEdit = (character: Character) => {
    setEditingCharacter(character);
    setEditForm({
      name: character.name,
      gender: character.gender || '',
      age: character.age?.toString() || '',
      sect: character.sect || '',
      sectPosition: character.sectPosition || '',
      faction: character.faction || '',
      factionPosition: character.factionPosition || '',
      weapon: character.weapon || '',
      martialLevel: (character.martialLevel as Rank) || '',
      appearance: character.appearance || '',
      personality: character.personality || '',
      value: character.value || '',
      conflict: character.conflict || '',
    });
    setError('');
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCharacter) return;

    const payload = buildPayload(editForm);
    if (!payload.name) {
      setError('请输入人物姓名');
      return;
    }

    const duplicated = await db.characters.where('name').equals(payload.name).first();
    if (duplicated && duplicated.id !== editingCharacter.id) {
      setError('人物姓名已存在');
      return;
    }

    await db.characters.update(editingCharacter.id, {
      ...payload,
      updatedAt: new Date().toISOString(),
    });
    setEditingCharacter(null);
  };

  const deleteCharacter = async (id: string) => {
    if (!confirm('确认删除该人物吗？')) return;
    await db.characters.delete(id);
    if (editingCharacter?.id === id) setEditingCharacter(null);
  };

  const exportCharacters = async () => {
    const data = await db.characters.toArray();
    
    // 转换为 Excel 格式
    const exportData = data.map(char => ({
      '名字': char.name,
      '性别': char.gender === 'male' ? '男' : char.gender === 'female' ? '女' : '',
      '年龄': char.age || '',
      '门派': char.sect || '',
      '门派职位': char.sectPosition || '',
      '势力': char.faction || '',
      '势力职位': char.factionPosition || '',
      '兵器': char.weapon || '',
      '武学等级': char.martialLevel || '',
      '样貌': char.appearance || '',
      '性格核心': char.personality || '',
      '存在价值': char.value || '',
      '主要冲突方向': char.conflict || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '人物列表');
    
    const fileName = `characters-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const importCharactersFromExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件格式
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('导入失败：请选择 .xlsx 或 .xls 格式的 Excel 文件');
      event.target.value = '';
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // 获取第一个工作表
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // 转换为 JSON，使用 header: 1 获取数组格式
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
      
      if (jsonData.length < 2) {
        setError('导入失败：文件内容为空或格式不正确');
        return;
      }

      // 获取表头（第一行）
      const headers = (jsonData[0] as unknown[]).map((h: unknown) => String(h || '').trim());
      
      // 查找名字列的索引
      const nameIndex = headers.findIndex(h => 
        h === '名字' || h === '姓名' || h.toLowerCase() === 'name'
      );
      
      if (nameIndex === -1) {
        setError('导入失败：未找到"名字"列，请确保 Excel 包含正确的表头');
        return;
      }

      // 构建字段索引映射
      const fieldIndexMap: Record<string, number> = {};
      headers.forEach((header, index) => {
        const fieldName = HEADER_MAP[header] || header.toLowerCase();
        if (fieldName) {
          fieldIndexMap[fieldName] = index;
        }
      });

      const existingNames = new Set((await db.characters.toArray()).map((item) => item.name));
      const now = new Date().toISOString();
      const records: Character[] = [];
      let skippedCount = 0;

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as unknown[];
        if (!row || row.length === 0) continue;

        const rawName = String(row[nameIndex] || '').trim();
        if (!rawName) {
          skippedCount++;
          continue;
        }

        const getValue = (field: string): string | undefined => {
          const idx = fieldIndexMap[field];
          if (idx === undefined || idx >= row.length) return undefined;
          const val = row[idx];
          return val !== undefined && val !== null ? String(val).trim() || undefined : undefined;
        };

        const genderRaw = getValue('gender');
        let gender: Gender | undefined;
        if (genderRaw) {
          const g = genderRaw.toLowerCase();
          if (g === '男' || g === 'male') gender = 'male';
          else if (g === '女' || g === 'female') gender = 'female';
        }

        const ageRaw = getValue('age');
        let age: number | undefined;
        if (ageRaw) {
          const ageNum = Number(ageRaw);
          if (!isNaN(ageNum) && ageNum >= 0 && ageNum <= 200) {
            age = ageNum;
          }
        }

        const martialLevelRaw = getValue('martialLevel');
        const martialLevel = RANK_ORDER.includes(martialLevelRaw as Rank) 
          ? (martialLevelRaw as Rank) 
          : undefined;

        const uniqueName = makeUniqueName(rawName, existingNames);

        records.push({
          id: generateId(),
          name: uniqueName,
          gender,
          age,
          sect: getValue('sect'),
          sectPosition: getValue('sectPosition'),
          faction: getValue('faction'),
          factionPosition: getValue('factionPosition'),
          weapon: getValue('weapon'),
          martialLevel,
          appearance: getValue('appearance'),
          personality: getValue('personality'),
          value: getValue('value'),
          conflict: getValue('conflict'),
          createdAt: now,
          updatedAt: now,
        });
      }

      if (records.length === 0) {
        setError('导入失败：没有可用数据');
        return;
      }

      await db.characters.bulkAdd(records);
      setError('');
      alert(`导入完成！成功导入 ${records.length} 条记录${skippedCount > 0 ? `，跳过 ${skippedCount} 条无效记录` : ''}。`);
    } catch (err) {
      console.error('Import error:', err);
      setError('导入失败：请检查文件格式是否正确');
    } finally {
      event.target.value = '';
    }
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setForm(EMPTY_FORM);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text-primary">人物列表</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-bg-tertiary text-text-secondary"
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white"
          >
            <Plus className="w-4 h-4" />
            新建人物
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input
              value={filter.sect}
              onChange={(event) => setFilter((prev) => ({ ...prev, sect: event.target.value }))}
              placeholder="门派筛选"
              className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
            />
            <select
              value={filter.ageSort}
              onChange={(event) => setFilter((prev) => ({ ...prev, ageSort: event.target.value as 'asc' | 'desc' }))}
              className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
            >
              <option value="desc">年龄从大到小</option>
              <option value="asc">年龄从小到大</option>
            </select>
            <button
              onClick={() => setFilter({ ranks: [], sect: '', ageSort: 'desc' })}
              className="rounded-lg border border-bg-tertiary px-3 py-2 text-text-secondary"
            >
              一键清空
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {RANK_ORDER.map(rank => (
              <button
                key={rank}
                onClick={() => {
                  setFilter((prev) => {
                    const exists = prev.ranks.includes(rank);
                    return {
                      ...prev,
                      ranks: exists ? prev.ranks.filter((item) => item !== rank) : [...prev.ranks, rank],
                    };
                  });
                }}
                className={`px-3 py-1 rounded-full text-sm border ${
                  filter.ranks.includes(rank)
                    ? 'bg-accent text-white border-accent'
                    : 'text-text-secondary border-bg-tertiary'
                }`}
              >
                {rank}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={exportCharacters}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-bg-tertiary text-text-secondary"
        >
          <Download className="w-4 h-4" />
          导出 Excel
        </button>
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-bg-tertiary text-text-secondary cursor-pointer">
          <Upload className="w-4 h-4" />
          导入 Excel（.xlsx）
          <input 
            type="file" 
            accept=".xlsx,.xls" 
            className="hidden" 
            onChange={importCharactersFromExcel} 
          />
        </label>
      </div>

      {error && <p className="text-sm text-danger mb-2">{error}</p>}

      <div className="space-y-3">
        {filteredCharacters.length === 0 ? (
          <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 text-text-secondary">暂无人物数据。</div>
        ) : (
          filteredCharacters.map((character) => (
            <div key={character.id} className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-text-primary font-medium">{character.name}</p>
                <p className="text-sm text-text-secondary mt-1">
                  性别：{character.gender === 'male' ? '男' : character.gender === 'female' ? '女' : '未填'} · 年龄：{character.age ?? '未填'} · 门派：{character.sect || '未填'}
                </p>
                <span
                  className="inline-block mt-2 px-2 py-1 rounded text-xs text-white"
                  style={{ backgroundColor: RANK_COLOR[(character.martialLevel as Rank) || 'D'] }}
                >
                  Rank: {character.martialLevel || '未设'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(character)} className="p-2 rounded-lg hover:bg-bg-tertiary" title="编辑">
                  <Pencil className="w-4 h-4 text-text-secondary" />
                </button>
                <button onClick={() => deleteCharacter(character.id)} className="p-2 rounded-lg hover:bg-bg-tertiary" title="删除">
                  <Trash2 className="w-4 h-4 text-danger" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {createOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
          onClick={closeCreate}
        >
          <div
            className="w-full max-w-3xl bg-bg-secondary border border-bg-tertiary rounded-2xl p-4 max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-text-primary">新建人物</h3>
              <button onClick={closeCreate} className="p-2 rounded-lg hover:bg-bg-tertiary">
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <CharacterForm
              form={form}
              onPatch={(patch) => {
                setForm((prev) => ({ ...prev, ...patch }));
                setError('');
              }}
              onSubmit={createCharacter}
              submitText="保存"
              error={error}
              onCancel={closeCreate}
            />
          </div>
        </div>
      )}

      {editingCharacter && (
        <div
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
          onClick={() => setEditingCharacter(null)}
        >
          <div
            className="w-full max-w-3xl bg-bg-secondary border border-bg-tertiary rounded-2xl p-4 max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-text-primary">编辑人物</h3>
              <button onClick={() => setEditingCharacter(null)} className="p-2 rounded-lg hover:bg-bg-tertiary">
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <CharacterForm
              form={editForm}
              onPatch={(patch) => {
                setEditForm((prev) => ({ ...prev, ...patch }));
                setError('');
              }}
              onSubmit={saveEdit}
              submitText="保存修改"
              error={error}
              onCancel={() => setEditingCharacter(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
