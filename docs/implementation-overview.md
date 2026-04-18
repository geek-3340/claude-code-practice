# タスク管理アプリ 実装概要

## アーキテクチャ全体像

```
src/
├── types/Task.ts                  # ドメインモデル（Task クラス・型定義）
├── repositories/TaskRepository.ts # データ永続化層（localStorage）
├── hooks/useTasks.ts              # 状態管理層（React カスタムフック）
└── components/
    ├── TaskForm.tsx               # タスク追加フォーム
    ├── TaskCard.tsx               # タスクカード（1件分）
    ├── TaskColumn.tsx             # カテゴリーカラム
    └── TaskBoard.tsx              # ボード全体（ルートコンポーネント）
```

### データの流れ

```
localStorage
    ↕ 非同期CRUD
TaskRepository
    ↕ Promise
useTasks（カスタムフック）
    ↕ props / コールバック
TaskBoard → TaskColumn → TaskCard
                ↑
            TaskForm
```

---

## 各ファイルの役割

### `src/types/Task.ts`

**役割：** アプリのドメインモデル。タスクを表す `Task` クラスと関連する型・定数を定義。

**ポイント：**
- `erasableSyntaxOnly` の制約により、クラスのプロパティはコンストラクター引数ではなくクラス本体で宣言
- **イミュータブル設計**：`toggleChecked()` / `withCategory()` / `withTitle()` はすべて元のインスタンスを変更せず新しい `Task` を返す
- `toJSON()` / `static fromJSON()` で localStorage との変換を自己完結させている

```typescript
// 変更例：状態を変えたい場合は新しいインスタンスを返す
task.withCategory('Done')  // ← task 自体は変わらない
```

**主な型：**

| 識別子 | 種別 | 内容 |
|---|---|---|
| `Category` | ユニオン型 | `'Backlog' \| 'InProgress' \| 'Pending' \| 'Done'` |
| `CATEGORY_LABELS` | 定数 | カテゴリー → 表示名のマッピング |
| `CATEGORY_ORDER` | 定数 | カテゴリーの移行順序（配列） |
| `Task` | クラス | タスク本体。メソッドで不変更新 |

---

### `src/repositories/TaskRepository.ts`

**役割：** localStorage への読み書きを非同期 API として提供するデータアクセス層（リポジトリパターン）。

**ポイント：**
- localStorage は本来同期だが、`Promise.resolve().then(...)` でラップして非同期 API として扱う（将来 API に差し替えやすい設計）
- 各メソッドは操作後の最新タスク配列を返す → フック側が `setTasks(updated)` するだけで済む
- `updateMany()` では `Map` を使って O(1) で更新対象を検索

**メソッド一覧：**

| メソッド | 説明 |
|---|---|
| `findAll()` | 全タスクを取得（localStorage → Task[] に変換） |
| `save(task)` | 新規タスクを追加 |
| `update(task)` | 既存タスクを1件更新 |
| `updateMany(tasks)` | 複数タスクを一括更新（チェック済み一括移動で使用） |
| `delete(id)` | タスクを削除 |

---

### `src/hooks/useTasks.ts`

**役割：** コンポーネントから CRUD 操作を呼び出すためのカスタムフック。状態（`tasks`）と操作関数を一元管理。

**ポイント：**
- `TaskRepository` のインスタンスはモジュールスコープで1つだけ生成（再レンダリングで再生成しない）
- `useEffect` の依存配列を空 `[]` にすることでマウント時のみデータ取得
- `useCallback` で関数をメモ化し、不要な子コンポーネントの再レンダリングを抑制

**提供する関数：**

| 関数 | 説明 |
|---|---|
| `addTask(title, category)` | タスクを追加（Create） |
| `updateTitle(id, title)` | タイトルを更新（Update） |
| `toggleCheck(id)` | チェック状態を切り替え |
| `promoteChecked(category)` | チェック済みタスクを次カテゴリーに一括移動 |
| `moveTask(id, category)` | ドラッグ&ドロップでカテゴリー変更 |
| `deleteTask(id)` | タスクを削除（Delete） |
| `tasksByCategory(category)` | カテゴリー別にフィルターして返す |

---

### `src/components/TaskBoard.tsx`

**役割：** ボード全体のルートコンポーネント。`useTasks` フックを呼び出し、操作関数を子コンポーネントに配布する。

**ポイント：**
- `CATEGORY_ORDER.map(...)` で4カラムを動的生成（カテゴリー追加時もここだけ変更）
- `loading` フラグでデータ取得中はスケルトンを表示

---

### `src/components/TaskColumn.tsx`

**役割：** 1つのカテゴリーカラム。ドロップゾーンの役割も担う。

**ポイント：**
- `onDragOver` で `e.preventDefault()` を呼ぶことで HTML5 DnD のドロップを有効化
- `onDrop` で `dataTransfer.getData('taskId')` を取り出し `onDrop` コールバックに渡す
- `Update` ボタンは `Done` カラムには表示しない（`category !== 'Done'` で制御）
- チェック件数が 0 のとき `disabled` で押せないようにする

---

### `src/components/TaskCard.tsx`

**役割：** タスク1件を表示するカード。ドラッグ・チェック・編集・削除に対応。

**ポイント：**
- `draggable` 属性と `onDragStart` で `dataTransfer` にタスク ID をセット
- ダブルクリックでインライン編集モードへ切り替え（`useState` で `editing` フラグを管理）
- `useRef` で編集入力欄の参照を持ち、編集開始時に `setTimeout` でフォーカスを当てる
- `onBlur` または `Enter` キーで編集を確定、`Escape` でキャンセル

---

### `src/components/TaskForm.tsx`

**役割：** タスクのタイトルとカテゴリーを入力して追加するフォーム。

**ポイント：**
- `e.preventDefault()` でフォーム送信によるページリロードを防ぐ
- 送信後に `setTitle('')` で入力欄をリセット
- `CATEGORY_ORDER.map(...)` でセレクトボックスの選択肢を動的生成

---

## 機能一覧

| 機能 | 操作方法 |
|---|---|
| タスク追加 | フォームにタイトルを入力 → カテゴリーを選択 → 「追加」ボタン |
| タイトル編集 | タスクカードのタイトルをダブルクリック → 入力 → Enter / フォーカスを外す |
| タスク削除 | タスクカード右上の「✕」ボタン |
| カテゴリー移動（一括） | チェックボックスをオン → カラム下部の「Update」ボタン |
| カテゴリー移動（個別） | タスクカードを別のカラムにドラッグ&ドロップ |
| データ永続化 | すべての操作が自動で localStorage に保存 |

---

## TypeScript 設定による制約と対応

| 設定 | 制約 | 対応方法 |
|---|---|---|
| `erasableSyntaxOnly` | クラスのコンストラクター引数プロパティ（`constructor(public foo: string)`）が使えない | プロパティをクラス本体で明示的に宣言 |
| `verbatimModuleSyntax` | 型のみのインポートに `type` 修飾子が必要 | `import { type Category } from '...'` |
| `noUnusedLocals` / `noUnusedParameters` | 未使用の変数・引数はビルドエラー | 宣言したものは必ず使う |

---

## バグ修正履歴

### [#1] タスク追加ボタンを押しても追加されない

**発生箇所**: `src/components/TaskForm.tsx`

**原因**: `handleSubmit` が同期関数のまま、`async` な `onAdd`（= `addTask`）を `await` せずに呼び出していた。

```typescript
// 修正前：await なしで呼び出し
const handleSubmit = (e: React.FormEvent) => {
  onAdd(title.trim(), category);  // 返ってきた Promise を無視
  setTitle('');
};
```

`addTask` は `async` 関数なので呼び出すと `Promise` を返すが、それを捨てていた。
内部で `repo.save()` や `setTasks()` がエラーを起こしても **Unhandled Promise Rejection** として握りつぶされ、画面に何も起こらない状態になっていた。

また `Props.onAdd` の型が `void` 返却だったため、TypeScript もこの不整合を検出できなかった。

**修正内容**:

```typescript
// 修正後：Props の型を Promise<void> に変更し、handleSubmit を async 化
interface Props {
  onAdd: (title: string, category: Category) => Promise<void>; // void → Promise<void>
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!title.trim()) return;
  await onAdd(title.trim(), category); // await を付けて完了を待つ
  setTitle('');
};
```

**学習ポイント**:
- `async` 関数の戻り値は `Promise<T>` になる。Props の型も合わせて `Promise<void>` にしないと TypeScript の型チェックが機能しない
- `async` 関数を `await` せずに呼び出すと、内部エラーが握りつぶされて**デバッグが非常に困難**になる
- `void` 型はあらゆる値（`Promise` を含む）を受け付けてしまうため、非同期コールバックの型には使わない

---

### [#2] タスク追加時に `RangeError: Invalid time value`

**発生箇所**:
- `src/types/Task.ts` — `toJSON()` の `this.createdAt.toISOString()`
- `src/repositories/TaskRepository.ts` — `findAll()` の `JSON.parse` / `data.map(Task.fromJSON)`

**原因**: 以前のバージョンのアプリ（工程管理アプリ）が同じキー `'tasks'` で localStorage にデータを保存していた。このデータには `createdAt` フィールドが存在しないため、`fromJSON` 内の `new Date(String(undefined))` = `new Date('undefined')` = **Invalid Date** が生成される。その後 `persist` が全タスクを `toJSON()` でシリアライズする際、`invalidDate.toISOString()` が `RangeError` を投げていた。

なお、このエラーが `#1` の修正（`handleSubmit` の `await` 化）によって初めてコンソールに表示されるようになった。修正前は完全に握りつぶされていた。

**エラーの連鎖（スタックトレース）**:

```
handleSubmit → addTask → repo.save()
  → findAll()  … 旧データを Invalid Date で復元
  → persist()  … toJSON() → toISOString() → RangeError 🔥
```

**修正内容**:

`src/types/Task.ts` — `fromJSON` に Invalid Date の検出とフォールバックを追加:

```typescript
static fromJSON(data: Record<string, unknown>): Task {
  const parsed = new Date(String(data.createdAt));
  // isNaN(date.getTime()) で Invalid Date を検出する
  const createdAt = isNaN(parsed.getTime()) ? new Date() : parsed;
  return new Task(..., createdAt);
}
```

`src/repositories/TaskRepository.ts` — `findAll` に try/catch を追加:

```typescript
try {
  const data = JSON.parse(raw) as Record<string, unknown>[];
  return data.map(Task.fromJSON);
} catch {
  // JSON破損・旧フォーマット等でパース失敗した場合はクリアして空配列を返す
  localStorage.removeItem(this.STORAGE_KEY);
  return [];
}
```

**学習ポイント**:
- `isNaN(date.getTime())` が Invalid Date を検出する標準的な方法（`date instanceof Date` では判別できない）
- `new Date('undefined')` や `new Date('invalid')` はエラーを投げずに Invalid Date を返す点に注意
- localStorage のデータはアプリのバージョンアップで構造が変わることがある。外部データを読み込む際は**常にバリデーションとフォールバック**が必要
- `#1` の修正がなければこのエラーは永久に気づけなかった。**エラーを握りつぶさない**ことがデバッグの基本
