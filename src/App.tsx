/**
 * App.tsx - 工程管理アプリのメインコンポーネント
 *
 * このファイルで学べること：
 * - useState：コンポーネント内の状態管理
 * - useEffect：副作用（localStorage への保存など）
 * - useRef：DOM要素への参照
 * - TypeScript の型定義（type / interface）
 * - コンポーネント分割と props の受け渡し
 * - 条件付きレンダリング
 * - 配列メソッド（map / filter / reduce）
 */

import { useState, useEffect, useRef } from 'react'
import './App.css'

// =====================================================================
// 型定義（TypeScript）
// =====================================================================

/**
 * type：文字列リテラルの Union 型
 * 'pending' | 'in_progress' | ... と書くことで、
 * これら4つの文字列しか代入できない型になる。
 * タイポや想定外の値の混入をコンパイル時に防げる。
 */
type Status = 'pending' | 'in_progress' | 'completed' | 'delayed'

/**
 * as const：配列をリテラル型（変更不可の定数）として扱う
 * これにより CATEGORIES[number] で要素の Union 型を作れる。
 * → '基礎工事' | '躯体工事' | ... という型になる
 */
const CATEGORIES = ['基礎工事', '躯体工事', '仕上げ工事', '設備工事', '外構工事', 'その他'] as const
type Category = typeof CATEGORIES[number]

/**
 * interface：オブジェクトの「形（shape）」を定義する
 * Process 型のオブジェクトは必ずこれらのプロパティを持つことが保証される。
 * 関数の引数や useState の型として使うことで、
 * 「このオブジェクトに何が入っているか」が常に明確になる。
 */
interface Process {
  id: number        // 一意なID（Date.now() で生成）
  name: string
  category: Category
  startDate: string
  endDate: string
  assignee: string
  status: Status
  progress: number  // 0〜100
  note: string
}

// =====================================================================
// 定数（アプリ全体で共有する設定値）
// =====================================================================

/**
 * Record<K, V>：キーが K 型、値が V 型のオブジェクト型
 * ここでは「Status の各値をキーにした設定オブジェクト」を定義している。
 * UI 上でステータスに応じた色やラベルを表示するときに参照する。
 */
const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  pending:     { label: '未着手', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  in_progress: { label: '進行中', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  completed:   { label: '完了',   color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  delayed:     { label: '遅延',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

const CATEGORY_COLORS: Record<Category, string> = {
  '基礎工事':   '#fb923c',
  '躯体工事':   '#a78bfa',
  '仕上げ工事': '#34d399',
  '設備工事':   '#60a5fa',
  '外構工事':   '#f472b6',
  'その他':     '#94a3b8',
}

/**
 * フォームの初期値。追加モーダルを開くたびにリセットするために使う。
 * オブジェクトリテラルとして定数にしておくことで、
 * 「空のフォーム」の定義が一箇所にまとまる。
 */
const EMPTY_FORM = {
  name: '',
  category: CATEGORIES[0] as Category,
  startDate: '',
  endDate: '',
  assignee: '',
  status: 'pending' as Status,
  progress: 0,
  note: '',
}

/** 初回起動時に表示するサンプルデータ */
const SAMPLE: Process[] = [
  { id: 1, name: '杭打ち工事',    category: '基礎工事', startDate: '2025-04-01', endDate: '2025-04-10', assignee: '田中班', status: 'completed',  progress: 100, note: '' },
  { id: 2, name: 'コンクリート打設', category: '基礎工事', startDate: '2025-04-11', endDate: '2025-04-20', assignee: '田中班', status: 'completed',  progress: 100, note: '' },
  { id: 3, name: '鉄骨建方',      category: '躯体工事', startDate: '2025-04-21', endDate: '2025-05-10', assignee: '鈴木班', status: 'in_progress', progress: 60,  note: '資材搬入済み' },
  { id: 4, name: '外壁工事',      category: '仕上げ工事', startDate: '2025-05-11', endDate: '2025-05-30', assignee: '山田班', status: 'pending',    progress: 0,   note: '' },
  { id: 5, name: '電気配管',      category: '設備工事', startDate: '2025-05-01', endDate: '2025-05-20', assignee: '佐藤班', status: 'delayed',    progress: 30,  note: '資材調達遅延' },
]

// =====================================================================
// 子コンポーネント①：StatusDropdown
// =====================================================================

/**
 * コンポーネントを分割する理由：
 * - ステータスバッジ＋ドロップダウンという「まとまった UI の塊」を切り出す
 * - 再利用しやすくなる
 * - 親（App）のコードが読みやすくなる
 *
 * props の型を interface で定義することで、
 * このコンポーネントが「何を受け取るか」が一目でわかる。
 */
interface StatusDropdownProps {
  process: Process
  onChangeStatus: (id: number, status: Status) => void
}

function StatusDropdown({ process, onChangeStatus }: StatusDropdownProps) {
  /**
   * useState：コンポーネントが「覚えておく」必要がある値を管理する
   * open は「ドロップダウンが開いているか」の真偽値。
   * setOpen を呼ぶたびにコンポーネントが再レンダリングされる。
   */
  const [open, setOpen] = useState(false)

  /**
   * useRef：DOM 要素への参照を保持する
   * ここでは「ドロップダウンの外をクリックしたら閉じる」処理のために、
   * div 要素を参照している。
   * useState と違い、ref を変更しても再レンダリングは発生しない。
   */
  const ref = useRef<HTMLDivElement>(null)

  /**
   * useEffect：コンポーネントの外側（DOM イベントなど）との連携に使う
   * 第2引数の [] は「マウント時に1回だけ実行」を意味する。
   * クリーンアップ関数（return の中）でイベントリスナーを解除することで
   * メモリリークを防ぐ。
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // ref.current に DOM 要素が入っており、クリックがその外なら閉じる
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    // クリーンアップ：コンポーネントがアンマウントされたときにリスナーを削除
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const st = STATUS_CONFIG[process.status]

  return (
    <div className="status-dropdown-wrap" ref={ref}>
      {/* クリックで open を反転（true→false / false→true） */}
      <button
        className="status-badge status-badge-btn"
        style={{ background: st.bg, color: st.color }}
        onClick={() => setOpen(prev => !prev)}
        title="クリックでステータス変更"
      >
        {st.label} <span className="dropdown-arrow">▾</span>
      </button>

      {/*
        条件付きレンダリング：open が true のときだけ表示
        JSX では { 条件 && <JSX> } で「条件が真なら描画」を表現できる
      */}
      {open && (
        <div className="status-dropdown">
          {/*
            Object.entries でオブジェクトを [key, value] の配列に変換し、
            map で各ステータスの選択肢を描画する。
            as [...] はTypeScriptに型を正しく伝えるためのキャスト。
          */}
          {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, cfg]) => (
            <button
              key={key}  // React がリストの各要素を識別するために必要
              className={`status-option ${process.status === key ? 'current' : ''}`}
              style={{ color: cfg.color }}
              onClick={() => {
                onChangeStatus(process.id, key)  // 親コンポーネントに変更を通知
                setOpen(false)
              }}
            >
              <span className="status-dot" style={{ background: cfg.color }} />
              {cfg.label}
              {process.status === key && <span className="check-mark">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// =====================================================================
// 子コンポーネント②：DeleteConfirmModal
// =====================================================================

/**
 * モーダルも独立したコンポーネントに分割。
 * 「削除対象の工程」と「確認・キャンセルのコールバック」を props で受け取る。
 *
 * コールバック関数（onConfirm / onCancel）を props で渡すのは React の基本パターン。
 * 子が「何かが起きた」ことを親に伝える手段として使う。
 */
interface DeleteConfirmModalProps {
  process: Process
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirmModal({ process, onConfirm, onCancel }: DeleteConfirmModalProps) {
  // オーバーレイ自体をクリックしたら閉じる（e.target と e.currentTarget の比較）
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal-sm">
        <div className="modal-header">
          <h2>工程を削除</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p className="delete-confirm-text">
            以下の工程を削除します。この操作は取り消せません。
          </p>
          <div className="delete-target-card">
            <span
              className="category-badge"
              style={{
                background: CATEGORY_COLORS[process.category] + '22',
                color: CATEGORY_COLORS[process.category],
              }}
            >
              {process.category}
            </span>
            <span className="delete-target-name">{process.name}</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onCancel}>キャンセル</button>
          <button className="btn-danger" onClick={onConfirm}>削除する</button>
        </div>
      </div>
    </div>
  )
}

// =====================================================================
// メインコンポーネント：App
// =====================================================================

/**
 * export default：このファイルのメインの export。
 * main.tsx から import App from './App' で読み込まれる。
 */
export default function App() {

  // --- state の定義 ---

  /**
   * useState の初期値に関数を渡す「遅延初期化」パターン。
   * () => { ... } とすることで、初回レンダリング時だけ実行される。
   * localStorage.getItem は毎回呼ぶとコストがかかるため、この書き方が適切。
   */
  const [processes, setProcesses] = useState<Process[]>(() => {
    const saved = localStorage.getItem('construction-processes')
    // saved が null でなければ JSON をパースして返す、なければサンプルデータを使う
    return saved ? JSON.parse(saved) : SAMPLE
  })

  // モーダルの表示/非表示
  const [showModal, setShowModal] = useState(false)

  // 編集対象（null なら「新規追加モード」）
  const [editTarget, setEditTarget] = useState<Process | null>(null)

  // フォームの入力値
  const [form, setForm] = useState(EMPTY_FORM)

  // 削除確認モーダルの対象（null なら非表示）
  const [deleteTarget, setDeleteTarget] = useState<Process | null>(null)

  // フィルターの状態
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all')
  const [search, setSearch] = useState('')

  // --- 副作用 ---

  /**
   * useEffect で localStorage への保存を自動化する。
   * 第2引数 [processes] は「processes が変わるたびに実行」を意味する。
   * これにより「保存し忘れ」が起きない。
   */
  useEffect(() => {
    localStorage.setItem('construction-processes', JSON.stringify(processes))
  }, [processes])

  // --- イベントハンドラ ---

  /** 追加モーダルを開く：editTarget を null にしてフォームをリセット */
  const openAdd = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  /** 編集モーダルを開く：対象の工程データをフォームに詰める */
  const openEdit = (p: Process) => {
    setEditTarget(p)
    setForm({
      name: p.name,
      category: p.category,
      startDate: p.startDate,
      endDate: p.endDate,
      assignee: p.assignee,
      status: p.status,
      progress: p.progress,
      note: p.note,
    })
    setShowModal(true)
  }

  /**
   * フォームを保存する。
   * editTarget があれば「更新」、なければ「追加」。
   * map で「該当 ID だけ差し替えた新しい配列」を作るのがイミュータブル更新の基本。
   */
  const saveForm = () => {
    if (!form.name.trim()) return  // 空文字は保存しない

    if (editTarget) {
      // スプレッド構文で既存オブジェクトに form の内容を上書き
      setProcesses(processes.map(p =>
        p.id === editTarget.id ? { ...p, ...form } : p
      ))
    } else {
      // Date.now() はミリ秒単位のタイムスタンプ → 簡易的な一意 ID として使用
      setProcesses([...processes, { id: Date.now(), ...form }])
    }
    setShowModal(false)
  }

  /** 削除を確定する：filter で対象以外の配列を作る */
  const confirmDelete = () => {
    if (deleteTarget) {
      setProcesses(processes.filter(p => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    }
  }

  /** カードのステータスバッジからインラインで変更する */
  const changeStatus = (id: number, status: Status) => {
    setProcesses(processes.map(p => p.id === id ? { ...p, status } : p))
  }

  // --- 表示用の計算 ---

  /**
   * filter で絞り込んだ配列を作る。
   * 元の processes は変更せず「表示用の派生データ」として使う。
   * これにより フィルター解除すると元のデータが戻る。
   */
  const filtered = processes.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterCategory !== 'all' && p.category !== filterCategory) return false
    if (search && !p.name.includes(search) && !p.assignee.includes(search)) return false
    return true
  })

  /** サマリーカード用の集計 */
  const stats = {
    total:       processes.length,
    pending:     processes.filter(p => p.status === 'pending').length,
    in_progress: processes.filter(p => p.status === 'in_progress').length,
    completed:   processes.filter(p => p.status === 'completed').length,
    delayed:     processes.filter(p => p.status === 'delayed').length,
  }

  /**
   * reduce：配列を1つの値に畳み込む
   * ここでは全工程の progress を合計して平均を求めている。
   * acc は「累積値」、p は「現在の要素」。
   */
  const overallProgress = processes.length
    ? Math.round(processes.reduce((acc, p) => acc + p.progress, 0) / processes.length)
    : 0

  // --- JSX（UI の定義）---

  return (
    <div className="layout">

      {/* ===== ヘッダー ===== */}
      <header className="header">
        <div className="header-left">
          <div className="header-icon">🏗</div>
          <div>
            <h1 className="header-title">工程管理システム</h1>
            <p className="header-sub">Construction Process Manager</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <span>＋</span> 工程を追加
        </button>
      </header>

      <main className="main">

        {/* ===== サマリーカード ===== */}
        <section className="summary-grid">
          {/* 全体進捗カード */}
          <div className="summary-card">
            <p className="summary-label">全体進捗</p>
            <p className="summary-value">
              {overallProgress}<span className="summary-unit">%</span>
            </p>
            <div className="progress-track">
              {/* インラインスタイルで動的に幅を変える */}
              <div className="progress-bar overall" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>

          {/* ステータス別カード：map でオブジェクトのエントリを展開 */}
          {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, cfg]) => (
            <div
              key={key}
              // テンプレートリテラルで className を動的に組み立てる
              className={`summary-card status-card ${filterStatus === key ? 'active' : ''}`}
              onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
            >
              <p className="summary-label">{cfg.label}</p>
              <p className="summary-value" style={{ color: cfg.color }}>{stats[key]}</p>
              <p className="summary-unit2">工程</p>
            </div>
          ))}
        </section>

        {/* ===== フィルター・検索バー ===== */}
        <section className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            {/*
              onChange で入力のたびに state を更新。
              value={search} で state と input の値を同期（制御コンポーネント）。
            */}
            <input
              className="search-input"
              placeholder="工程名・担当で検索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select
              className="filter-select"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as Category | 'all')}
            >
              <option value="all">すべての工種</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as Status | 'all')}
            >
              <option value="all">すべてのステータス</option>
              {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([k, v]) =>
                <option key={k} value={k}>{v.label}</option>
              )}
            </select>
          </div>
        </section>

        {/* ===== 工程リスト ===== */}
        <section className="process-list">
          {/*
            条件付きレンダリング：三項演算子パターン
            filtered.length === 0 なら空メッセージ、そうでなければリストを表示
          */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>🔍</p>
              <p>該当する工程がありません</p>
            </div>
          ) : filtered.map(p => (
            <div key={p.id} className="process-card">
              <div className="card-top">
                <div className="card-left">
                  <span
                    className="category-badge"
                    style={{
                      // 16進カラーコードに '22'（透明度10%）を追加して背景色を作る
                      background: CATEGORY_COLORS[p.category] + '22',
                      color: CATEGORY_COLORS[p.category],
                    }}
                  >
                    {p.category}
                  </span>
                  <h3 className="process-name">{p.name}</h3>
                </div>
                <div className="card-right">
                  {/*
                    子コンポーネントに props を渡す。
                    onChangeStatus はコールバック関数（子から親への通知手段）。
                  */}
                  <StatusDropdown process={p} onChangeStatus={changeStatus} />
                  <button className="icon-btn" onClick={() => openEdit(p)} title="編集">✏️</button>
                  <button
                    className="icon-btn icon-btn-danger"
                    onClick={() => setDeleteTarget(p)}
                    title="削除"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="card-meta">
                <span>📅 {p.startDate} 〜 {p.endDate}</span>
                <span>👷 {p.assignee || '未割当'}</span>
                {/* p.note が空文字や undefined なら何も表示しない */}
                {p.note && <span>📝 {p.note}</span>}
              </div>

              <div className="progress-row">
                <div className="progress-track flex1">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${p.progress}%`,
                      // ステータスに応じて色を切り替え
                      background:
                        p.status === 'delayed'   ? '#f87171' :
                        p.status === 'completed' ? '#4ade80' : '#38bdf8',
                    }}
                  />
                </div>
                <span className="progress-pct">{p.progress}%</span>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* ===== 追加・編集モーダル ===== */}
      {/*
        showModal が true のときだけレンダリングされる。
        false になると DOM からも除去され、フォームの状態もリセットされる。
      */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal">
            <div className="modal-header">
              {/* editTarget の有無で「追加」か「編集」かを切り替え */}
              <h2>{editTarget ? '工程を編集' : '工程を追加'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>工程名 <span className="required">*</span></label>
                <input
                  className="form-input"
                  value={form.name}
                  // スプレッド構文で form の他のプロパティを保持しつつ name だけ更新
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="例：コンクリート打設"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>工種</label>
                  <select
                    className="form-input"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as Category })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>ステータス</label>
                  <select
                    className="form-input"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as Status })}
                  >
                    {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([k, v]) =>
                      <option key={k} value={k}>{v.label}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>開始日</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>終了予定日</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>担当</label>
                  <input
                    className="form-input"
                    value={form.assignee}
                    onChange={e => setForm({ ...form, assignee: e.target.value })}
                    placeholder="例：田中班"
                  />
                </div>
                <div className="form-group">
                  <label>進捗率 ({form.progress}%)</label>
                  <input
                    className="form-input"
                    type="range"
                    min={0}
                    max={100}
                    value={form.progress}
                    onChange={e => setForm({ ...form, progress: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>備考</label>
                <textarea
                  className="form-input form-textarea"
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  placeholder="特記事項など..."
                />
              </div>
            </div>

            <div className="modal-footer">
              {/* editTarget があるときだけ削除ボタンを表示 */}
              {editTarget && (
                <button
                  className="btn-danger btn-danger-outline"
                  onClick={() => {
                    setShowModal(false)
                    setDeleteTarget(editTarget)
                  }}
                >
                  削除
                </button>
              )}
              <div className="modal-footer-right">
                <button className="btn-ghost" onClick={() => setShowModal(false)}>
                  キャンセル
                </button>
                <button className="btn-primary" onClick={saveForm}>
                  {editTarget ? '更新する' : '追加する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 削除確認モーダル ===== */}
      {/*
        deleteTarget が null 以外のときだけ表示。
        子コンポーネントに処理を委譲し、結果を onConfirm / onCancel で受け取る。
      */}
      {deleteTarget && (
        <DeleteConfirmModal
          process={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
