import { useState, useRef } from 'react';
import { Task } from '../types/Task';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
}

// タスクカードコンポーネント（チェック・インライン編集・削除・ドラッグに対応）
export function TaskCard({ task, onToggle, onDelete, onUpdateTitle }: Props) {
  // 編集モードのON/OFF状態
  const [editing, setEditing] = useState(false);
  // 編集中のテキスト値
  const [editValue, setEditValue] = useState(task.title);
  // useRef：入力欄のDOM参照（フォーカス制御に使用）
  const inputRef = useRef<HTMLInputElement>(null);

  // ダブルクリックで編集モードを開始する
  const startEdit = () => {
    setEditing(true);
    setEditValue(task.title);
    // setTimeoutでDOM更新後にフォーカスを当てる
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // 編集内容を確定する（onBlurまたはEnterキーで呼ばれる）
  const commitEdit = () => {
    if (editValue.trim() && editValue.trim() !== task.title) {
      onUpdateTitle(task.id, editValue.trim());
    }
    setEditing(false);
  };

  // ドラッグ開始時：dataTransferにタスクIDをセットして受け取り側に渡す
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`bg-white border border-gray-200 rounded p-3 mb-2 cursor-grab active:cursor-grabbing shadow-sm
        ${task.checked ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-2">
        {/* チェックボックス：チェックするとUpdateボタンで次のカテゴリーに移動できる */}
        <input
          type="checkbox"
          checked={task.checked}
          onChange={() => onToggle(task.id)}
          className="mt-0.5 cursor-pointer shrink-0"
        />
        {editing ? (
          // 編集モード：テキスト入力欄を表示
          <input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') setEditing(false);
            }}
            className="flex-1 border border-blue-400 rounded px-1 text-sm focus:outline-none"
          />
        ) : (
          // 通常モード：ダブルクリックで編集モードに切り替える
          <span
            onDoubleClick={startEdit}
            title="ダブルクリックで編集"
            className={`flex-1 text-sm break-all ${task.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}
          >
            {task.title}
          </span>
        )}
        {/* 削除ボタン */}
        <button
          onClick={() => onDelete(task.id)}
          className="text-gray-300 hover:text-red-400 text-xs shrink-0 cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
