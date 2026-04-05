import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateId, type Character, type Gender } from '../db';
import { Download, Filter, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';

const RANK_ORDER = ['S+', 'S', 'S-', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-'] as const;
type Rank = (typeof RANK_ORDER)[number];
import { db, generateId, type Character, type Gender, type MartialLevel } from '../db';
import { Download, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';

const LEVEL_ORDER: MartialLevel[] = ['S', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D'];

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
  martialLevel: MartialLevel | '';
  appearance: string;
  personality: string;
  value: string;
  conflict: string;
};

type CharacterFilterState = {
  ranks: Rank[];
  levels: MartialLevel[];
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

function getLevelWeight(level?: MartialLevel): number {
  if (!level) return 999;
  return LEVEL_ORDER.indexOf(level);
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

  const unique = `${baseName}${suffix}`;
  existingNames.add(unique);
  return unique;
}

function toCharacterPayload(form: CharacterFormState): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> {
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
  title,
  form,
  onChange,
  onSubmit,
  submitText,
  error,
}: {
  title: string;
  form: CharacterFormState;
  onChange: (patch: Partial<CharacterFormState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitText: string;
  error: string;
}) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-4 mb-6">
      {title && <h2 className="text-lg font-bold text-text-primary mb-3">{title}</h2>}
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={form.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="人物姓名（必填）"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <select
          value={form.gender}
          onChange={(event) => onChange({ gender: event.target.value as Gender | '' })}
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        >
          <option value="">性别（可选）</option>
          <option value="male">男</option>
          <option value="female">女</option>
        </select>
        <input
          value={form.age}
          onChange={(event) => onChange({ age: event.target.value })}
          placeholder="年龄"
          type="number"
          min={0}
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.sect}
          onChange={(event) => onChange({ sect: event.target.value })}
          placeholder="所属门派"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.sectPosition}
          onChange={(event) => onChange({ sectPosition: event.target.value })}
          placeholder="门派职位"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.faction}
          onChange={(event) => onChange({ faction: event.target.value })}
          placeholder="所属势力"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.factionPosition}
          onChange={(event) => onChange({ factionPosition: event.target.value })}
          placeholder="势力职位"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.weapon}
          onChange={(event) => onChange({ weapon: event.target.value })}
          placeholder="兵器"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <select
          value={form.martialLevel}
          onChange={(event) => onChange({ martialLevel: event.target.value as MartialLevel | '' })}
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        >
          <option value="">武学等级</option>
          {LEVEL_ORDER.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
        <input
          value={form.appearance}
          onChange={(event) => onChange({ appearance: event.target.value })}
          placeholder="样貌描述"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.personality}
          onChange={(event) => onChange({ personality: event.target.value })}
          placeholder="性格核心"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.value}
          onChange={(event) => onChange({ value: event.target.value })}
          placeholder="存在价值"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />
        <input
          value={form.conflict}
          onChange={(event) => onChange({ conflict: event.target.value })}
          placeholder="主要冲突"
          className="rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary"
        />

        <button
          type="submit"
          className="md:col-span-2 flex items-center justify-center gap-2 rounded-lg bg-accent hover:bg-accent-hover text-white px-3 py-2"
        >
          <Plus className="w-4 h-4" />
          {submitText}
        </button>
      </form>
      {error && <p className="text-sm text-danger mt-2">{error}</p>}
    </div>
  );
}

export default function CharacterManager() {
  const [form, setForm] = useState<CharacterFormState>(EMPTY_FORM);
  const [filter, setFilter] = useState<CharacterFilterState>({ levels: [], sect: '', ageSort: 'desc' });
  const [error, setError] = useState('');
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [editForm, setEditForm] = useState<CharacterFormState>(EMPTY_FORM);

  const characters = useLiveQuery(() => db.characters.toArray(), []);

  const filteredCharacters = useMemo(() => {
    const normalizedSect = filter.sect.trim().toLowerCase();
    const source = characters || [];
    const data = source.filter((character) => {
      if (filter.levels.length > 0 && (!character.martialLevel || !filter.levels.includes(character.martialLevel))) {
        return false;
      }
      if (normalizedSect && !(character.sect || '').toLowerCase().includes(normalizedSect)) {
        return false;
      }
      return true;
    });

    return data.sort((a, b) => {
      const levelDiff = getLevelWeight(a.martialLevel) - getLevelWeight(b.martialLevel);
      if (levelDiff !== 0) return levelDiff;
      return filter.ageSort === 'asc' ? (a.age || 0) - (b.age || 0) : (b.age || 0) - (a.age || 0);
    });
  }, [characters, filter]);

  const updateForm = (patch: Partial<CharacterFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError('');
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = toCharacterPayload(form);

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
    await db.characters.add({
      id: generateId(),
      ...payload,
      createdAt: now,
      updatedAt: now,
    });

    setForm(EMPTY_FORM);
  };

  const openEditModal = (character: Character) => {
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
      martialLevel: character.martialLevel || '',
      appearance: character.appearance || '',
      personality: character.personality || '',
      value: character.value || '',
      conflict: character.conflict || '',
    });
  };

  const handleSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCharacter) return;

    const payload = toCharacterPayload(editForm);
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
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该人物吗？')) return;
    await db.characters.delete(id);
    if (editingCharacter?.id === id) {
      setEditingCharacter(null);
    }
  };

  const handleExportCharacters = async () => {
    const data = await db.characters.toArray();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `characters-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportCharacters = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const list = JSON.parse(text);
      if (!Array.isArray(list)) {
        setError('导入失败：文件格式不正确');
        return;
      }

      const existingNames = new Set((await db.characters.toArray()).map((item) => item.name));
      const now = new Date().toISOString();
      const importRecords: Character[] = list
        .filter((item): item is Partial<Character> => typeof item?.name === 'string')
        .map((item) => {
          const name = makeUniqueName(item.name!.trim(), existingNames);
          return {
            id: generateId(),
            name,
            gender: item.gender,
            age: item.age,
            sect: item.sect,
            sectPosition: item.sectPosition,
            faction: item.faction,
            factionPosition: item.factionPosition,
            weapon: item.weapon,
            martialLevel: item.martialLevel,
            appearance: item.appearance,
            personality: item.personality,
            value: item.value,
            conflict: item.conflict,
            createdAt: now,
            updatedAt: now,
          };
        });

      if (importRecords.length === 0) {
        setError('导入失败：没有可用人物数据');
        return;
      }

      await db.characters.bulkAdd(importRecords);
      setError('');
    } catch {
      setError('导入失败：文件格式不正确');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-8">
      <CharacterForm
        title="新增人物"
        form={form}
        onChange={updateForm}
        onSubmit={handleCreate}
        submitText="添加人物"
        error={error}
      />

      <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-4 mb-6">
        <h3 className="text-lg font-bold text-text-primary mb-3">筛选与导入导出</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            value={filter.sect}
            onChange={(event) => setFilter((prev) => ({ ...prev, sect: event.target.value }))}
            placeholder="按门派筛选"
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
            onClick={() => setFilter({ levels: [], sect: '', ageSort: 'desc' })}
            className="rounded-lg border border-bg-tertiary px-3 py-2 text-text-secondary hover:bg-bg-tertiary"
          >
            一键清空筛选
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {LEVEL_ORDER.map(level => (
            <button
              key={level}
              onClick={() => {
                setFilter((prev) => {
                  const exists = prev.levels.includes(level);
                  return {
                    ...prev,
                    levels: exists ? prev.levels.filter(item => item !== level) : [...prev.levels, level],
                  };
                });
              }}
              className={`px-3 py-1 rounded-full text-sm border ${
                filter.levels.includes(level)
                  ? 'bg-accent text-white border-accent'
                  : 'border-bg-tertiary text-text-secondary'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCharacters}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-primary border border-bg-tertiary text-text-primary"
          >
            <Download className="w-4 h-4" />
            导出人物(JSON)
          </button>
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-primary border border-bg-tertiary text-text-primary cursor-pointer">
            <Upload className="w-4 h-4" />
            导入人物(JSON)
            <input type="file" accept="application/json" className="hidden" onChange={handleImportCharacters} />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {filteredCharacters.length === 0 ? (
          <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 text-text-secondary">
            暂无符合条件的人物。
          </div>
        ) : (
          filteredCharacters.map(character => (
            <div
              key={character.id}
              className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-text-primary font-medium">{character.name}</p>
                <p className="text-sm text-text-secondary mt-1">
                  门派：{character.sect || '未填写'} · 等级：{character.martialLevel || '未填写'} · 年龄：{character.age ?? '未填写'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(character)}
                  className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
                  title="编辑"
                >
                  <Pencil className="w-4 h-4 text-text-secondary" />
                </button>
                <button
                  onClick={() => handleDelete(character.id)}
                  className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4 text-danger" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {createOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={closeCreate}>
          <div className="w-full max-w-3xl bg-bg-secondary border border-bg-tertiary rounded-2xl p-4 max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
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
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setEditingCharacter(null)}>
          <div className="w-full max-w-3xl bg-bg-secondary border border-bg-tertiary rounded-2xl p-4 max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
      {editingCharacter && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setEditingCharacter(null)}>
          <div
            className="bg-bg-secondary border border-bg-tertiary rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-text-primary">编辑人物</h3>
              <button onClick={() => setEditingCharacter(null)} className="p-2 rounded-lg hover:bg-bg-tertiary">
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <CharacterForm
              title=""
              form={editForm}
              onChange={(patch) => {
                setEditForm((prev) => ({ ...prev, ...patch }));
                setError('');
              }}
              onSubmit={handleSaveEdit}
              submitText="保存修改"
              error={error}
            />
          </div>
        </div>
      )}
    </div>
  );
}
