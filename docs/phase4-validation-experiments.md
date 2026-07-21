# Phase 4 slice 3 — Package-first モデルの早期検証実験

Status: In progress (2026-07-21). 実験プロトコルの定義と coding-agent アームの実行。

`docs/package-ownership-model.md` の「早期検証」を実行可能なプロトコルに落とす。
検証対象は package-first / own-on-demand モデルの 3 つの境界であり、各実験は
危険信号(同 doc)への判定材料を返す。

## 共通プロトコル(coding-agent アーム)

- 被験者: この会話の文脈を持たない coding agent。リポジトリと同梱ドキュメント
  (README / CHARTER / docs / AGENTS.md)だけを与える — 実利用者と同じ知識条件
- タスクは利用者の言葉で与え、**期待する解法(token / own / recipe)は一切
  示唆しない**。どの経路を選ぶか自体が計測対象
- 実行は clean な main 上で行い、終了後に diff を採取して `git checkout . &&
  git clean -fd` で復元する。agent はコミットしない
- 計測: タスク完遂(機械検証 green を含む)、変更ファイル数と diff 行数、
  package/blueprint ソースへの侵入の有無、選んだ経路、agent の自己申告による
  参照ファイル。自己申告バイアスは既知の限界として記録する
- browser suite はサンドボックス制約により人間が実行する

## 実験 A — Button / theme 境界

**問い**: 通常のブランド変更は theme token だけで完了するか(危険信号 3
「theme と ownership の間の崖」/ 6「AI に扱いやすいは差別化にならない」)。

- タスク: 「playground の UI ブランドを琥珀系(#b45309)へ変更し、全体をやや
  compact にしたい。/dropdown.html と /listbox.html に反映され、既存の unit
  テストが通ること」
- 成功: `packages/core/blueprints` に変更ゼロ。アプリ側 CSS の token 上書き
  (または theme.css の差し替え相当)だけで達成。diff が小さい
- 失敗シグナル: blueprint SFC の直接編集、literal 色の総置換、token の存在に
  気づかない

## 実験 B — Dropdown / ownership 境界

**問い**: schema で表せない要求(avatar 付き account 行)に対して ownership が
局所的に働くか(危険信号 2「own した瞬間に保証が消える」/ 4「owned Blueprint が
読みにくい」)。

- タスク: 「/dropdown.html のメニュー先頭に、イニシャル avatar + 氏名 + メール
  を表示する account 行を追加したい(選択で `lastAction = "account"`)。他の
  項目の挙動は壊さないこと。unit テストが通ること」
- 成功: `nagi-ui own dropdown-menu`(または同等のコピー)→ owned union +
  template 分岐 + CSS の拡張レシピ通りの局所 diff。package ソース無変更。
  配線(`itemProps`)が renderer 内に留まる
- 失敗シグナル: package 内 blueprint の直接改変、schema を迂回した slot 化、
  ARIA 配線の破壊(lint / テストが検出するか自体も計測対象)

## 実験 C — Combobox / upstream 追従境界

**問い**: behavior を変更した owned source が upstream 修正へ追従できるか
(危険信号 2 の核心)。

- 準備(実験者側): combobox を own し、ローカル変更(例: 選択確定時に入力へ
  フォーカスを残したまま全選択する)を加えた状態を作る。その後 upstream の
  `Combobox.vue` に小さな修正を入れ、package version を bump して `nagi-ui
  diff` が `drifted` を報告する状態にする
- タスク: 「パッケージ更新後に `nagi-ui diff` が drifted と言っている。upstream
  の修正を取り込みつつ、ローカルの変更を維持してほしい」
- 成功: 取り込み後に diff が `modified`(ローカル差分のみ)へ戻り、双方の
  変更が生きている。unit テスト green
- 失敗シグナル: ローカル変更の喪失、upstream 修正の取りこぼし、stamp の
  更新忘れ、マージ不能で own を放棄

## 判定の使い方

- A が失敗 → token 語彙の不足(具体的にどの役割か)を昇格候補として記録
- B が失敗 → 拡張レシピ文書か lint の不足。slot 化へ逃げたなら §3.5 の防波堤が
  文書として弱い証拠
- C が失敗 → ownership 保守契約(diff / migration)の道具不足。Phase 4 の
  後続スライスで tooling を強化してから製品化する

## 結果記録

### 実験 A — 2026-07-21 実行(coding-agent アーム): **PASS**

- 経路: agent は自力で semantic token に到達し、`playground/src/brand.css`
  (新規、`:root` の token 上書き 13 個)+ 両エントリへの import で達成した
- **`packages/core` への変更ゼロ**(git diff で機械確認)。blueprint の直接編集も
  literal 総置換も発生せず
- diff 規模: 6 ファイル、+65 / −62 行(大半は依頼範囲内のページクローム暖色化と
  fixture のハードコード色 → fallback 付き var() 化)
- 判断品質の特記: parity test の存在から「theme.css・blueprint を触るとテストが
  壊れる。ブランド変更はアプリ側 token 上書きが設計意図」と正しく推論。
  no-Teleport による popover への custom property 継承にも言及。theme.css 後勝ち
  の import 順も正しく処理
- 機械検証: `vp run test` 96/96。agent は 2 ページの本番ビルドまで行い、出力
  CSS に `#b45309` が含まれることを確認
- 参照ファイル(自己申告): 約 12
- 危険信号への含意: 「theme と ownership の間の崖」はこの標準的ブランド変更
  タスクでは**観測されず**。「AI に扱いやすいは差別化にならない」に対しては、
  同梱ドキュメント + parity test だけで無文脈 agent が正しい経路を選んだ、
  という 1 標本の反証

### 実験 B — 2026-07-21 実行(coding-agent アーム): **PASS**

- 経路: agent は自力で `nagi-ui own dropdown-menu` に到達し、owned schema を
  拡張レシピ通りに拡張した(union member `DropdownMenuAccountNode` + `accountEntry()`
  + `menuEntries()` の case + template 分岐 + `.-account` CSS)
- **代替案の棄却理由まで正確**: package 側 schema の直接拡張は「speculative node
  kinds are not added to the package API」に反する、`#item` slot は CHARTER §3.5
  名指しの違反、として自ら却下。防波堤の文書が意図通り機能した
- **局所性**: `packages/core` への変更ゼロ。app 側 diff は DropdownLab +18/−2 と
  owned 4 ファイル(うち編集は schema + Item の 2 つ、残り 2 つは clean)。
  owned 版への import 切替は File actions のみで、RTL / Themed は package 版のまま
- **配線の保全**: ARIA / focus 配線は `menu.itemProps(accountEntry(node), …)` で
  renderer 内に留まった。`nagi-ui/verified-bindings` lint と `nagi-ui diff`
  (2 ファイル modified、他 clean)も agent 自身が実行
- **契約による教育の再現**: 初回 `nagi-css check` で `.avatar` が語彙外として
  fail → agent は CONTRACT に従い `text -avatar` variant へ自己修正。named error
  → 収束のループが第三者 agent でも機能することの実証
- 機械検証: `vp run test` 96/96、SSR スモークで account 行の描画・role・separator
  を確認。browser suite は sandbox 制約で未実行(人間アーム側で確認する)
- 参照ファイル(自己申告): 約 15
- 危険信号への含意: 「own した瞬間に保証が消える」に対し、own 直後の lint /
  diff / test が全て機能。「owned Blueprint が読みにくい」に対し、変更は
  schema + renderer の 2 ファイルに収まった
