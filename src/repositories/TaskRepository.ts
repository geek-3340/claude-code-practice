import { Task } from '../types/Task';

// localStorageを使ったタスクの永続化クラス（リポジトリパターン）
// Promise.resolve()でラップすることで非同期APIとして扱う
export class TaskRepository {
  // localStorageのキー名
  private readonly STORAGE_KEY = 'tasks';

  // 全タスクを取得する（非同期）
  async findAll(): Promise<Task[]> {
    return Promise.resolve().then(() => {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      try {
        // JSONパースしてTaskクラスのインスタンスに復元
        const data = JSON.parse(raw) as Record<string, unknown>[];
        return data.map(Task.fromJSON);
      } catch {
        // JSON破損・旧フォーマット等でパース失敗した場合はストレージをクリアして空配列を返す
        localStorage.removeItem(this.STORAGE_KEY);
        return [];
      }
    });
  }

  // 新規タスクを保存する（Create）
  async save(task: Task): Promise<Task[]> {
    const tasks = await this.findAll();
    const updated = [...tasks, task]; // スプレッド構文で新しい配列を生成
    this.persist(updated);
    return updated;
  }

  // 既存タスクを更新する（Update）
  async update(task: Task): Promise<Task[]> {
    const tasks = await this.findAll();
    // mapで同じidのタスクのみ差し替える
    const updated = tasks.map(t => t.id === task.id ? task : t);
    this.persist(updated);
    return updated;
  }

  // 複数タスクを一括更新する（Updateボタンの一括移動で使用）
  async updateMany(updatedTasks: Task[]): Promise<Task[]> {
    const tasks = await this.findAll();
    // Mapで更新対象をO(1)検索できるようにする
    const updateMap = new Map(updatedTasks.map(t => [t.id, t]));
    const updated = tasks.map(t => updateMap.get(t.id) ?? t);
    this.persist(updated);
    return updated;
  }

  // タスクを削除する（Delete）
  async delete(id: string): Promise<Task[]> {
    const tasks = await this.findAll();
    // filterで削除対象以外を残す
    const updated = tasks.filter(t => t.id !== id);
    this.persist(updated);
    return updated;
  }

  // localStorageにJSON文字列として書き込む内部メソッド
  private persist(tasks: Task[]): void {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(tasks.map(t => t.toJSON()))
    );
  }
}
