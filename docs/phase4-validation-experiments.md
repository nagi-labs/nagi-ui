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

(実行ごとに追記)
