import { useState, useEffect, useCallback } from 'react';
// verbatimModuleSyntax が有効なため、型のみのインポートには type 修飾子が必要
import { Task, type Category } from '../types/Task';
import { TaskRepository } from '../repositories/TaskRepository';

// モジュールスコープで初期化することで再レンダリングのたびに生成されるのを防ぐ
const repo = new TaskRepository();

// タスクのCRUD操作と状態管理をまとめたカスタムフック
export function useTasks() {
  // タスク一覧の状態（配列）
  const [tasks, setTasks] = useState<Task[]>([]);
  // 初回ロード中フラグ
  const [loading, setLoading] = useState(true);

  // useEffect：コンポーネントのマウント時に一度だけlocalStorageからタスクを読み込む
  useEffect(() => {
    repo.findAll().then(loaded => {
      setTasks(loaded);
      setLoading(false);
    });
  }, []); // 依存配列が空なのでマウント時のみ実行

  // 新規タスクを追加する（Create）
  // useCallback：依存する値が変わらない限り関数を再生成しない（パフォーマンス最適化）
  const addTask = useCallback(async (title: string, category: Category) => {
    // crypto.randomUUID()：ブラウザ標準のUUID生成API
    const task = new Task(crypto.randomUUID(), title, category);
    const updated = await repo.save(task);
    setTasks(updated);
  }, []);

  // タスクのタイトルを更新する（Update）
  const updateTitle = useCallback(async (id: string, title: string) => {
    // Array.find()：条件に一致する最初の要素を返す
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated = await repo.update(task.withTitle(title));
    setTasks(updated);
  }, [tasks]);

  // タスクのチェック状態を切り替える
  const toggleCheck = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated = await repo.update(task.toggleChecked());
    setTasks(updated);
  }, [tasks]);

  // チェック済みのタスクを次のカテゴリーに一括移動する（Updateボタン）
  const promoteChecked = useCallback(async (category: Category) => {
    // filterで対象カラムのチェック済みタスクのみ抽出
    const toPromote = tasks
      .filter(t => t.category === category && t.checked)
      .map(t => {
        const next = t.nextCategory();
        // 次カテゴリーがある場合のみ移動（Doneはそのまま）
        return next ? t.withCategory(next) : t;
      });
    if (toPromote.length === 0) return;
    const updated = await repo.updateMany(toPromote);
    setTasks(updated);
  }, [tasks]);

  // ドラッグ&ドロップでカテゴリーを変更する
  const moveTask = useCallback(async (id: string, category: Category) => {
    const task = tasks.find(t => t.id === id);
    // 同じカテゴリーへのドロップは無視
    if (!task || task.category === category) return;
    const updated = await repo.update(task.withCategory(category));
    setTasks(updated);
  }, [tasks]);

  // タスクを削除する（Delete）
  const deleteTask = useCallback(async (id: string) => {
    const updated = await repo.delete(id);
    setTasks(updated);
  }, []);

  // 特定カテゴリーのタスク一覧を返すヘルパー（メモ化で不要な再計算を防ぐ）
  const tasksByCategory = useCallback((category: Category): Task[] => {
    return tasks.filter(t => t.category === category);
  }, [tasks]);

  return {
    loading,
    addTask,
    updateTitle,
    toggleCheck,
    promoteChecked,
    moveTask,
    deleteTask,
    tasksByCategory,
  };
}
