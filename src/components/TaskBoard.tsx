import { CATEGORY_ORDER } from '../types/Task';
import { useTasks } from '../hooks/useTasks';
import { TaskForm } from './TaskForm';
import { TaskColumn } from './TaskColumn';

// タスクボード全体のコンポーネント（4カラムを横並びに表示）
export function TaskBoard() {
  // カスタムフックからCRUD操作と状態を受け取る
  const {
    loading,
    addTask,
    updateTitle,
    toggleCheck,
    promoteChecked,
    moveTask,
    deleteTask,
    tasksByCategory,
  } = useTasks();

  // ローディング中はフォールバックUIを表示
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 text-sm">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4 text-gray-800">タスク管理</h1>

      {/* タスク追加フォーム */}
      <TaskForm onAdd={addTask} />

      {/* 4カラムレイアウト（overflow-x-autoで横スクロール対応） */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {/* CATEGORY_ORDERをmapして各カラムをレンダリング */}
        {CATEGORY_ORDER.map(category => (
          <TaskColumn
            key={category}
            category={category}
            tasks={tasksByCategory(category)}
            onToggle={toggleCheck}
            onDelete={deleteTask}
            onUpdateTitle={updateTitle}
            onPromote={promoteChecked}
            onDrop={moveTask}
          />
        ))}
      </div>
    </div>
  );
}
