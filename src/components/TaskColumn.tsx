import { CATEGORY_LABELS, type Category, type Task } from '../types/Task';
import { TaskCard } from './TaskCard';

interface Props {
  category: Category;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onPromote: (category: Category) => void;
  onDrop: (taskId: string, category: Category) => void;
}

// カテゴリーごとのカラムコンポーネント（ドロップゾーン・Updateボタンを含む）
export function TaskColumn({
  category, tasks, onToggle, onDelete, onUpdateTitle, onPromote, onDrop
}: Props) {

  // dragover：デフォルト動作をキャンセルすることでドロップを許可する
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // drop：dataTransferからタスクIDを取り出してカテゴリー移動を呼び出す
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onDrop(taskId, category);
  };

  // チェック済みタスクの件数（Updateボタンのラベルに表示）
  const checkedCount = tasks.filter(t => t.checked).length;

  // カテゴリー別のヘッダー配色（Record型でキーと値の型を明示）
  const headerStyle: Record<Category, string> = {
    Backlog:    'bg-gray-100 text-gray-700 border-gray-200',
    InProgress: 'bg-blue-100 text-blue-700 border-blue-200',
    Pending:    'bg-yellow-100 text-yellow-700 border-yellow-200',
    Done:       'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex flex-col flex-1 min-w-52 bg-gray-50 rounded-lg border border-gray-200"
    >
      {/* カラムヘッダー：カテゴリー名とタスク件数を表示 */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg border-b font-semibold text-sm ${headerStyle[category]}`}>
        <span>{CATEGORY_LABELS[category]}</span>
        <span className="text-xs font-normal bg-white/60 rounded-full px-2 py-0.5">{tasks.length}</span>
      </div>

      {/* タスクカードリスト（縦スクロール対応） */}
      <div className="flex-1 p-2 overflow-y-auto min-h-28">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
            onUpdateTitle={onUpdateTitle}
          />
        ))}
      </div>

      {/* Updateボタン：Done カラムには表示しない */}
      {category !== 'Done' && (
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={() => onPromote(category)}
            disabled={checkedCount === 0}
            className={`w-full text-xs py-1.5 rounded border text-gray-600
              ${checkedCount > 0
                ? 'bg-white border-gray-300 hover:bg-gray-100 cursor-pointer'
                : 'bg-gray-50 border-gray-200 opacity-40 cursor-not-allowed'}`}
          >
            {/* チェック件数が1件以上のとき件数を表示 */}
            Update{checkedCount > 0 ? ` (${checkedCount})` : ''}
          </button>
        </div>
      )}
    </div>
  );
}
