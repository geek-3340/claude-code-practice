import { useState } from 'react';
import { CATEGORY_LABELS, CATEGORY_ORDER, type Category } from '../types/Task';

// コンポーネントが受け取るプロパティの型定義（Props型）
// onAdd は非同期関数なので Promise<void> を返す型にする
// void にすると async 関数の中でエラーが起きても握りつぶされ、原因が分からなくなる
interface Props {
  onAdd: (title: string, category: Category) => Promise<void>;
}

// タスク追加フォームコンポーネント
export function TaskForm({ onAdd }: Props) {
  // useState：入力欄の値をReactの状態として管理
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Backlog');

  // async にして await することで、onAdd（非同期）のエラーが
  // Unhandled Promise Rejection としてコンソールに表示されるようになる
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // trim()で前後の空白を除去し、空文字チェック
    if (!title.trim()) return;
    await onAdd(title.trim(), category);
    setTitle(''); // 保存完了後にリセット（await で完了を待つ）
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="タスクを入力..."
        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
      />
      {/* セレクトボックス：カテゴリーを選択する */}
      <select
        value={category}
        onChange={e => setCategory(e.target.value as Category)}
        className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none bg-white"
      >
        {/* CATEGORY_ORDERをmapしてoptionを動的生成 */}
        {CATEGORY_ORDER.map(cat => (
          <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
        ))}
      </select>
      <button
        type="submit"
        className="bg-blue-500 text-white rounded px-4 py-2 text-sm hover:bg-blue-600 cursor-pointer"
      >
        追加
      </button>
    </form>
  );
}
