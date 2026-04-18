# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## このリポジトリについて

Claude Code の学習を目的とした Vite + React + TypeScript + Tailwind CSS のプロジェクト。
`guides/` ディレクトリに Phase 1〜6 のClaude Code学習ガイド（日本語）が格納されている。

## コマンド

```bash
npm run dev       # 開発サーバー起動（http://localhost:5173）
npm run build     # 型チェック（tsc -b）+ プロダクションビルド
npm run lint      # ESLint 実行
npm run preview   # ビルド成果物のプレビュー
```

テストは未導入。

## 技術スタック・設定の注意点

- **Tailwind CSS v4**：`tailwind.config.js` は不要。`vite.config.ts` の `@tailwindcss/vite` プラグインで動作し、`src/index.css` の `@import "tailwindcss"` がエントリーポイント。
- **React 19**：`useState` 等のフックは `react` から直接インポート。
- **TypeScript**：`noUnusedLocals` / `noUnusedParameters` が有効。未使用の変数・引数はビルドエラーになる。
- **ESLint**：`eslint-plugin-react-hooks`（フックのルール）と `eslint-plugin-react-refresh`（HMR互換性）を使用。型チェック付きルール（`recommendedTypeChecked`）は未有効化。

## 演習用プロジェクトの内容

### プロジェクトの概要
タスク管理アプリ

### プロジェクトの要件

- ローカルストレージを採用し、バックエンドレスで実装

- UIはシンプルに最小限で。凝らなくて良い

- 基本的なCRUDが出来て、CRUDは非同期で画面描画

- 作成したタスクは、「Backlog」「in Progress」「Pending」「Done」のカテゴリー領域に振り分けできる

- タスクにはチェックボックスを付けて、押すことでcheck済みのタスクを次のカテゴリー領域に一括で移動する「Update」ボタンを用意する

- タスクのカテゴリー領域の異動はドラッグアンドドロップでも可能

## 重要なルール

- TSの処理は原則オブジェクト指向で記述する

- 私はreact,typescriptの基礎は習得したが、実装経験はないので、各処理にはどんなメソッド・ヘルパー関数、機能であるか、見返して学習できるようにコメントを付けてほしい

- コメントは日本語で！

- 再利用可能なUIはコンポーネント化し可読性・保守性を重視すること