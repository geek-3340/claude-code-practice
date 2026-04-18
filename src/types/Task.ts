// タスクのカテゴリーを表すユニオン型
export type Category = 'Backlog' | 'InProgress' | 'Pending' | 'Done';

// カテゴリーの表示名マッピング（UIに表示するラベル）
export const CATEGORY_LABELS: Record<Category, string> = {
  Backlog: 'Backlog',
  InProgress: 'In Progress',
  Pending: 'Pending',
  Done: 'Done',
};

// カテゴリーの移行順序（Updateボタンで次のカテゴリーに進む）
export const CATEGORY_ORDER: Category[] = ['Backlog', 'InProgress', 'Pending', 'Done'];

// タスクを表すクラス（イミュータブル設計：変更時は新しいインスタンスを返す）
// erasableSyntaxOnly が有効なため、コンストラクター引数にアクセス修飾子は使えない
// → プロパティはクラス本体で明示的に宣言する必要がある
export class Task {
  public readonly id: string;
  public readonly title: string;
  public readonly category: Category;
  public readonly checked: boolean;
  public readonly createdAt: Date;

  constructor(
    id: string,
    title: string,
    category: Category,
    checked = false,
    createdAt = new Date()
  ) {
    this.id = id;
    this.title = title;
    this.category = category;
    this.checked = checked;
    this.createdAt = createdAt;
  }

  // 次のカテゴリーを返す（Doneの場合はnullを返す）
  nextCategory(): Category | null {
    const idx = CATEGORY_ORDER.indexOf(this.category);
    return idx < CATEGORY_ORDER.length - 1 ? CATEGORY_ORDER[idx + 1] : null;
  }

  // チェック状態を反転させた新しいTaskを返す（イミュータブル更新）
  toggleChecked(): Task {
    return new Task(this.id, this.title, this.category, !this.checked, this.createdAt);
  }

  // カテゴリーを変更した新しいTaskを返す（移動時はチェックを解除）
  withCategory(category: Category): Task {
    return new Task(this.id, this.title, category, false, this.createdAt);
  }

  // タイトルを変更した新しいTaskを返す
  withTitle(title: string): Task {
    return new Task(this.id, title, this.category, this.checked, this.createdAt);
  }

  // localStorageに保存するためのプレーンオブジェクトに変換
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      checked: this.checked,
      createdAt: this.createdAt.toISOString(), // Dateは文字列として保存
    };
  }

  // localStorageから復元するためのファクトリーメソッド（静的メソッド）
  static fromJSON(data: Record<string, unknown>): Task {
    const parsed = new Date(String(data.createdAt));
    // isNaN(date.getTime()) で Invalid Date を検出する
    // 旧バージョンのデータに createdAt がない場合など、無効な値は現在時刻でフォールバック
    const createdAt = isNaN(parsed.getTime()) ? new Date() : parsed;
    return new Task(
      String(data.id),
      String(data.title),
      data.category as Category,
      Boolean(data.checked),
      createdAt
    );
  }
}
