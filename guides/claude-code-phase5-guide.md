# Phase 5：MCP（外部ツール連携）を導入する

> 目標：MCP の仕組みを理解し、自分が使う外部ツールを1つ以上接続する
>
> 所要時間：1〜2週間
>
> 前提：Phase 4 まで完了

---

## このフェーズで身につけること

1. MCP とは何か — シンプルに理解する
2. MCP の追加方法
3. 実用的な MCP サーバー5選
4. 接続のトラブルシューティング
5. MCP を活かした実践ワークフロー

---

## 1. MCP とは何か

MCP（Model Context Protocol）は、Claude Code を外部ツールに接続するための仕組みです。

**例え：** Claude Code 本体がスマホだとしたら、MCP はアプリのようなもの。
インストールすると、Claude Code から直接 Notion や Slack、GitHub API にアクセスできるようになります。

### MCP なしでもできること

- ファイルの読み書き
- ターミナルコマンドの実行
- Git 操作（ローカル）
- Web 検索

### MCP があると追加でできること

- GitHub の Issue / PR をAPI経由で操作
- Notion のページを読み書き
- Slack のメッセージを送受信
- ブラウザを直接操作（Playwright）
- データベースに直接クエリ

---

## 2. MCP の追加方法

### コマンドで追加

```bash
# 基本構文
claude mcp add <サーバー名> <コマンド> [引数...]

# 例：GitHub MCP を追加
claude mcp add github -- npx -y @modelcontextprotocol/server-github

# 例：ファイルシステム MCP を追加
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /path/to/dir
```

### 設定ファイルで追加

`.claude/settings.json` に直接書くこともできます。

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxx"
      }
    }
  }
}
```

### 接続確認

```
/mcp
```

接続中の MCP サーバーの一覧が表示されます。

---

## 3. 実用的な MCP サーバー5選

すべてを一度に入れる必要はありません。
自分が普段使っているツールから1つずつ試してください。

### ① GitHub MCP — Issue / PR をAPI操作

```bash
claude mcp add github -- npx -y @modelcontextprotocol/server-github
```

**できること：**
- Issue の一覧取得・作成・更新
- PR の作成・レビューコメント投稿
- リポジトリの検索

**必要な設定：** GitHub Personal Access Token

**使い方の例：**
```
「未解決の Issue を優先度順に整理して」
「Issue #15 に基づいて実装して、完了したら PR を作って」
```

### ② Playwright MCP — ブラウザを直接操作

```bash
claude mcp add playwright -- npx -y @anthropic-ai/mcp-server-playwright
```

**できること：**
- E2E テストの実行
- Web ページのスクリーンショット取得
- フォーム入力やクリックの自動化

**使い方の例：**
```
「ログインページにアクセスして、フォームが正しく表示されるか確認して」
「/signup のE2Eテストを Playwright で書いて」
```

### ③ Notion MCP — ドキュメント連携

```bash
claude mcp add notion -- npx -y @notionhq/mcp-server
```

**できること：**
- Notion ページの読み取り
- 設計ドキュメントの参照

**使い方の例：**
```
「Notion の設計ドキュメントを読んで、それに基づいて実装して」
```

### ④ Slack MCP — チャット連携

**できること：**
- チャンネルのメッセージ取得
- メッセージ送信

### ⑤ PostgreSQL / SQLite MCP — データベース直接操作

**できること：**
- スキーマの確認
- クエリの実行
- マイグレーションの作成

**使い方の例：**
```
「データベースのスキーマを確認して、users テーブルの構造を教えて」
「このクエリのパフォーマンスを分析して改善案を出して」
```

---

## 4. トラブルシューティング

### 接続できない場合

```
/mcp                  ← まず接続状態を確認
/doctor               ← 環境の診断
```

### よくある問題

| 症状 | 原因 | 対処法 |
|------|------|--------|
| サーバーが見つからない | npx のパッケージ名が間違っている | パッケージ名をダブルチェック |
| 認証エラー | トークンが設定されていない | env に API キーを追加 |
| タイムアウト | サーバーの起動が遅い | 再度 `/mcp` で接続を試みる |

---

## 5. MCP を活かした実践ワークフロー

### Issue 駆動開発フロー

```
1. 「GitHub の未対応 Issue を見せて」
2. 「Issue #23 の内容を確認して、実装計画を立てて」
3. Plan mode で計画をレビュー
4. 実装 → テスト → コミット
5. 「PR を作って Issue #23 を closes で紐づけて」
```

### 仕様書駆動開発フロー（Notion 連携）

```
1. 「Notion の設計ドキュメント"API仕様 v2"を読んで」
2. 「この仕様に基づいて、新しいエンドポイントを実装して」
3. 「実装が仕様通りか確認するテストも書いて」
```

---

## Phase 5 チェックリスト

- [ ] MCP の役割（Claude Code に外部ツールへのアクセスを追加する）を理解している
- [ ] `claude mcp add` でサーバーを追加できる
- [ ] `/mcp` で接続状態を確認できる
- [ ] 最低1つの MCP サーバーを接続して実際に使った
- [ ] MCP を活用したワークフローを1つ実践した

---

## 参考リンク

- MCP 公式：https://code.claude.com/docs/ja/mcp
- MCP サーバー一覧：https://github.com/modelcontextprotocol/servers
