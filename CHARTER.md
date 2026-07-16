# Nagi UI — Concept & Architecture Charter

> **この文書の位置づけ**: Nagi UI の設計判断を固定するための憲章。実装エージェントは、この文書に反する構造(compound component 化、Teleport 導入、独自状態機械の複製など)を「改善」として提案・実装してはならない。判断に迷ったら本文書の「決定原理」に立ち返ること。
>
> **正本はこのリポジトリの `CHARTER.md`**。設計判断が実装の学びで変わったときは、該当節を改訂し、末尾の「改訂履歴」に理由つきで追記する。リポジトリ外の複製(初稿の `NAGI_UI_CONCEPT.md` 等)は参照しない。

---

## 0. 一言定義

**Nagi UI は、振る舞いを JS で再演せずブラウザ標準へ委譲する、Vue 向け attribute 注入型 headless レイヤーである。**
Nagi CSS Contract(別文書 `CONTRACT.md`)を styling の基礎とし、その reference implementation として機能する。

## 1. 決定原理(すべての設計判断の根拠)

優先順に並ぶ 4 原則。下位の原則は上位に反しない範囲でのみ適用する。

1. **Platform vocabulary first** — ライブラリの出力は可能な限り「HTML 標準の語彙」(`popovertarget`, `commandfor`, `aria-*`, `<dialog>`)であること。ARIA パターンを JS で再演する装置(Radix / Base UI / Reka の方式)ではなく、標準属性へ委譲する層である。
2. **User owns the DOM** — テンプレートに残るのは利用者の素の HTML 要素のみ。ライブラリはタグを増やさない。囲いタグ(`Root` / `Trigger` / `Popup`)は禁止。
3. **Nagi CSS Contract 準拠が構造を決める** — 契約の owned DOM + `>` 必須ルールの下でペナルティゼロになる形態(attribute 注入)を採る。これはスタイル上の好みではなく、契約が課す構造的制約である。
4. **非対称投資** — ネイティブが肩代わりする部分(Dialog/Popover/Tooltip)は徹底的に薄く、ネイティブに代替がない部分(Combobox/Menu/Listbox)にだけ JS を厚く積む。

## 2. なぜ compound component を採らないか(背景の要約)

実装エージェントが「Radix 風の方が一般的」と判断して構造を戻さないよう、根拠を明記する。

- **Root が不要な理由**: Radix 系の `Root` は open 状態・フォーカス返却先・id を保持する状態機械のホストであり、React に `document` 相当のグローバル状態ホストがないことの代償。Popover API では状態機械を**ブラウザ自身**が持つ(`:popover-open`、top layer 管理、light dismiss、focus 処理は UA 実装)。よって状態を保持するための囲いタグは不要。
- **囲いタグが React 固有の制約である理由**: JSX には属性レベルの拡張機構がなく、要素に振る舞いを注入する手段が「コンポーネントで包む」しかない。Vue には `v-bind` オブジェクトスプレッド・ディレクティブ・`getSSRProps` があり、包まずに注入できる。React の設計制約を Vue に輸入しない。
- **Nagi CSS 契約上のペナルティ差**: compound 形式ではライブラリコンポーネントが boundary class となり、自分のダイアログ内部が slot sub-surface 宣言 + descendant step を要求される。Teleport 実装なら `detachedSlotSurfaces` 宣言まで必要。attribute 注入なら全域が owned DOM となり、Element Class Table と `>` チェーンがそのまま通る。
- **Teleport が不要な理由(重要)**: ネイティブ popover の top layer は**レンダリング概念であって DOM 移動ではない**。popover 要素は DOM ツリー上その場に留まる。よって契約の `>` チェーンが壊れず、`overflow: hidden` / `z-index` / `transform` の祖先にも切り取られない。**Teleport / portal を実装に導入した時点で本プロジェクトの存在理由が消える。使用禁止。**

## 3. プロダクト構成(三層)

| 層 | 配布 | 中身 | スタイル |
|---|---|---|---|
| **core** | npm パッケージ | composable 群 + ディレクティブ糖衣。ネイティブ属性 + ARIA を注入。完全に型付け | CSS を一切含まない |
| **blueprints** | copy-in(shadcn 方式) | Nagi CSS 準拠で書かれた SFC。利用者のリポジトリへ複製して所有させる | Nagi CSS 契約準拠の読める CSS。**Tailwind 不使用** |
| **contract preset** | npm(linter 側) | Nagi CSS linter 用の Nagi UI プリセット設定(`componentSlots` 等が必要になった場合のみ) | — |

- shadcn から継承するのは **copy-in 配布モデル(所有権の移譲)のみ**。Tailwind・ユーティリティクラスは採らない。コピーされたコードは契約により決定的な命名を持つため、利用者の linter を最初から通る。
- 本当の商品は契約であり、Nagi UI はその実演装置(reference implementation)である。差別化は「契約 + linter + ライブラリ」の三位一体にあり、ライブラリ単体の機能差ではない(機能差は既存勢に 2〜3 年で吸収される)。

## 4. core の API 設計

### 4.1 三層 API: composable が芯、ディレクティブは糖衣

```
composable (usePopover / useDialog / ...)   ← 設計の芯。完全な型、テスト対象
    ↓ 糖衣
directive (v-popover-trigger / ...)          ← 簡潔さ優先の表層。getSSRProps で SSR 対応
    ↓ 出力
native attributes (popovertarget, aria-*, id) ← 最終出力は常に標準語彙
```

理由: ディレクティブはテンプレート型検査(vue-tsc)が効かず、修飾子に型表現がない。型が欲しい利用者は composable、簡潔さが欲しい利用者はディレクティブを選べるようにする。**ディレクティブ単体でしか使えない機能を作ってはならない**(必ず composable に同等物があること)。

composable 形態の実証状況: 薄い側(属性オブジェクトを返すだけ)はリスクなし。厚い側(Combobox 等)も React Aria hooks が composable 形式での WAI-ARIA 準拠実装の存在証明になっている。**唯一の未検証点は `v-for` 項目群への属性配布(`itemProps(item)` 型 API)の Vue テンプレートでの書き味**であり、これは §10 Phase 2 で最優先検証する。

### 4.2 正規形(Dialog/Popover の場合)

```vue
<script setup>
const { triggerProps, popoverProps } = usePopover()
</script>

<template>
  <div class="confirm-dialog">
    <button class="button -trigger" v-bind="triggerProps">削除</button>
    <div class="panel" popover v-bind="popoverProps">
      <header class="header"><h2 class="title">確認</h2></header>
      <footer class="footer -actions">…</footer>
    </div>
  </div>
</template>

<style scoped>
.confirm-dialog {
  > .panel {
    &:popover-open { … }
  }
}
</style>
```

チェックポイント:
- テンプレートにライブラリ由来のタグが **1 つもない**
- `triggerProps` の中身は実際に `popovertarget="<useId>"` 等の**標準属性そのもの**
- 状態セレクタは `:popover-open`(native)であり `data-state` ではない

### 4.3 配線のトポロジー

- 関係は **id 参照**(`popovertarget` / `commandfor` / `aria-controls`)で張る。ネストスコープ(provide/inject)を配線の主手段にしない。
- id は `useId()` で生成し衝突を防ぐ。id はグローバル名前空間である(Shadow DOM 境界を越えられない既知の制約は文書化し、v1 では対応しない)。
- composable 間で状態共有が必要な場合(Combobox 内部など)のみ provide/inject を**内部実装として**使ってよい。公開 API に Root 相当を出さないこと。

### 4.4 Controlled mode(必須・先送り禁止)

open 状態の所有者はブラウザ(UA)だが、アプリ側 store を単一の真実として扱う controlled mode(`v-model:open`)は**製品成立の必須条件**である。「非同期処理の完了でダイアログを閉じる」「store の状態で popover を開く」は利用シーンの過半に絡むため、これがぎこちないライブラリは思想以前に採用されない。

- 実装方式: **双方向ミラー同期** — UA 発の遷移は `toggle` イベントでモデルへミラーし、モデルへの書き込みは命令的 `showPopover()` / `hidePopover()` / `showModal()` / `close()` で UA に適用する。適用関数は冪等(現在状態と一致なら no-op)にしてエコーループを断つ。同期は sync flush で行う(post flush は同一 tick の true→false 往復を「変化なし」に合体させ、UA と desync する)。
  - 初稿は「`beforetoggle` の `preventDefault` + 命令的同期」を指定していたが、Popover API 仕様では **hide 方向の `beforetoggle` は cancel 不能**(ポップオーバーが閉じられなくなる事故の防止)のため文字通りには実装できない。§4.4 の目的(`v-model:open` が素直に動く・非同期完了で閉じられる・二重管理は内部に封じ込め)はミラー同期で満たす。(2026-07-15 改訂)
- **二重管理の面倒さ(light dismiss との競合、イベント順序のエッジケース)は composable 内部に封じ込め、利用者からは `v-model:open` が素直に動くように見えること。** 「面倒」の支払い主はライブラリ実装者であり、利用者に漏らしてはならない。
- uncontrolled(デフォルト)と controlled の両モードを最初から設計する。後付けは API 破壊を招く。

### 4.5 SSR / zero-hydration(構造的差別化点)

- 属性はサーバー出力 HTML に**そのまま書かれる**こと。ディレクティブは `getSSRProps` を必ず実装する。
- 結果として `popovertarget` ベースの UI は **hydration 前・JS 到達前から動作する**。これは context(=JS ランタイム)前提の既存 headless には構造的に不可能な性質であり、Nuxt の遅延 hydration / islands 構成での動作をファーストクラスの要件とする。
- **受け入れ基準**: JS を無効化したブラウザで、Popover ベースの Dropdown が開閉すること。

## 5. 依存するネイティブ機能と方針

| 機能 | 用途 | 方針 |
|---|---|---|
| Popover API (`popover`, `popovertarget`, `:popover-open`) | Popover/Tooltip/Menu 表層 | 全主要ブラウザ対応済み。基盤として全面採用 |
| `<dialog>` (`showModal`, `[open]`, `::backdrop`) | モーダル。フォーカストラップは UA に委譲 | 全面採用。独自フォーカストラップを実装しない |
| Invoker Commands (`command` / `commandfor`) | 宣言的トリガー配線 | Chrome 135+/Firefox 138+。feature detect し、未対応環境では composable が同等のイベント配線にフォールバック |
| CSS `@starting-style` / `transition-behavior: allow-discrete` / `overlay` | 開閉アニメーション | blueprints 側の CSS で使用。JS アニメーションライブラリを core に入れない。未対応環境は即時開閉に劣化(progressive enhancement) |
| CSS Anchor Positioning | Popover/Tooltip の位置決め | Chromium 実装済み・Safari/Firefox 追従中。**対応環境ではネイティブ、未対応では Floating UI にフォールバック**する二段構え。Floating UI 依存は位置決めモジュールに隔離し、Anchor Positioning 普及後に削除できる構造にする |

アニメーションの補足: フェード/スライド/スケール程度は CSS で完結させる。スプリング物理・ジェスチャー連動・exit オーケストレーションは**スコープ外**(利用者が必要なら自前で JS を足す)。`data-starting-style` 等の Radix 風属性フックは提供しない — ネイティブの `@starting-style` がそのモデルである。

## 6. 状態表現ルール(Nagi CSS State Rule に完全準拠)

優先順を厳守する。**上位で表現できる状態を下位で二重表現してはならない。**

1. **Native**: `:popover-open`, `[open]`, `:disabled`, `:checked`
2. **ARIA**(ライブラリが注入): `aria-expanded`, `aria-selected`, `aria-invalid`, `aria-activedescendant`
3. **`data-*`**: native/ARIA に対応物がない状態のみ。例: Combobox の視覚的ハイライト `data-active`。使用する各 `data-*` は**公開 styling contract としてドキュメントに列挙**する

禁止例: popover の開閉に `data-state="open"` を付与すること(`:popover-open` と重複する)。

## 7. コンポーネント別投資マップ

| コンポーネント | 実装の厚さ | 中身 |
|---|---|---|
| Popover / Tooltip / Dialog | **薄い**(属性注入 + 位置決めのみ) | popovertarget 配線、anchor positioning、`<dialog>` 委譲 |
| Toast | 中(見た目より罠が多い) | popover ベース。**top layer の重なり順は「開いた順」固定で z-index 無効**のため、dialog が開いた際にトーストが下に潜る。さらに **`showModal()` は仕様上、開いている popover を全て強制クローズする**ため、「開いていたら hide→show」では再昇格できない。`useToast` は**自身のモデル(生きている toast があるか)を条件に、top layer の同居者が開いた toggle を検知して再 show** する。利用者には見せない (2026-07-15 改訂) |
| Disclosure / Accordion | 薄い | `<details>` ベース + アニメーション CSS |
| Tabs | 中 | roving tabindex、キーボードナビ(ネイティブ代替なし) |
| Menu / Listbox / Combobox | **厚い**(本プロジェクトの JS 工数の本丸) | タイプアヘッド、`aria-activedescendant` 管理、roving tabindex、選択モデル。表層(浮遊部)は popover に委譲しつつ、対話モデルは自前実装 |
| Select | 中〜厚 | customizable select(`<selectedcontent>` 等)の標準化動向を監視し、委譲可能になり次第委譲 |

a11y 実装工数の 7 割はここ(Menu/Listbox/Combobox 系)に集中する想定。「ネイティブで全部薄くなる」という誤解に基づく設計をしないこと。

## 8. 既知の制約と致命度トリアージ

Base UI 等の全 JS 実装との比較で判明している制約。**これらは実装エージェントが「解決」しようとしてはならないものと、必ず解くものに分かれる。** UA に主権を渡したことの直接の帰結である制約は、バグではなく契約条件として扱う。

### 8.1 本質的にできない(委譲の対価。実装で解決を試みない)

| 制約 | 内容 | 扱い |
|---|---|---|
| dismiss ポリシーの細粒度カスタム | light dismiss は UA の状態機械内。選べる粒度は `popover="auto/manual/hint"` のみ。「外側クリックで閉じるが ESC では閉じない」等は不可 | `manual` に落として自前実装するのは Base UI の再実装であり**禁止**。`<dialog>` の `closedby` 属性など、プラットフォーム側の拡張を feature detect で取り込む方針。ドキュメントに「向かないケース」として明記 |
| top layer のスタッキング制御 | 重なり順は開いた順で固定、`z-index` 無効 | Toast のみ §7 の再昇格ロジックで内部対処。それ以外の任意順序制御は提供しない |
| `::backdrop` に実 DOM を置けない | 擬似要素のためインタラクティブな overlay 不可 | 制約として文書化のみ(要件として稀) |
| UA 挙動差・UA バグの自前修正 | 振る舞いの実装が UA 側にあるため、ライブラリパッチで統一できない | evergreen ブラウザ前提と明記。対応下限はプラットフォームに従属 |
| Shadow DOM 越えの idref 配線 | `popovertarget` / `aria-controls` は shadow root を越えない | v1 非対応。Reference Target 仕様の標準化を監視 |

### 8.2 可能だが面倒(支払い主を明確にして対処)

| 制約 | 致命度 | 対処 |
|---|---|---|
| controlled mode | **高 — 未解決なら製品不成立** | §4.4 の通り composable 内部に封じ込め。§10 の vertical slice 成立条件に含める |
| Toast × Dialog の重なり順 | **高 — デモで 30 秒で露見する** | `useToast` に再昇格ロジック内蔵。共存デモで先回りして証明する(§10) |
| JS アニメーションとの統合 | 中 | popover/dialog は閉じてもアンマウントされない(display 切替)ため、`v-if` 前提の Motion 系・exit オーケストレーションと相性が悪い。CSS で足りる範囲(§5)を正とし、超える要件は「向かないケース」に明記 |
| ジェスチャー駆動の中断可能クローズ(vaul 的ボトムシート) | 中 | スコープ外と明記。copy-in 配布のため、該当コンポーネントだけ他ライブラリと混在可能なことをドキュメントで案内 |
| テスト環境(jsdom の dialog/popover サポート不完全) | 中 | Vitest browser mode / Playwright 前提のテストレシピを blueprints に同梱 |
| Invoker Commands フォールバック維持 | 低 | feature detect の二重経路を普及完了まで保守(§5 既定) |

### 8.3 ダメージを吸収する構造(エージェントへの補足)

- **自己選択**: Nagi CSS に共感する層と、spring 物理・ジェスチャー UI を最重要視する層はほぼ互いに素。全方位で勝つ必要はない。
- **混在可能性**: 囲いタグ・provider・グローバル状態がないため、コンポーネント単位で Reka 等と共存できる。all-or-nothing ではない。
- **時間はこちらの味方**: `closedby`、anchor positioning、Invoker Commands と、プラットフォームがギャップを埋め続けている。委譲層はギャップが埋まった瞬間コードを書かずに機能が増える。全 JS 実装は逆にネイティブ化の度に自前実装が負債化する。機能差を静的な欠陥として埋めにいかないこと。

## 9. アンチゴール(実装してはならないもの)

- ❌ compound component 公開 API(`<NagiRoot>` / `<NagiTrigger>` 等)
- ❌ `asChild` / `render` prop 方式(包む前提の発想ごと不要)
- ❌ Teleport / portal(top layer が代替。§2 参照)
- ❌ 独自フォーカストラップ(`<dialog>.showModal()` に委譲)
- ❌ `popover="manual"` に落として light dismiss / dismiss ポリシーを自前実装すること(§8.1)
- ❌ native/ARIA と重複する `data-state`
- ❌ core パッケージへの CSS 同梱、ユーティリティクラス、Tailwind 依存
- ❌ JS アニメーションランタイム(スプリング等)の core 組み込み
- ❌ ディレクティブ内での `document.createElement` による要素生成(矢印等は blueprints 側のマークアップ / CSS で解決)

## 10. 検証ロードマップ(この順で進める)

各フェーズには「何の仮説を検証するか」が割り当てられている。**フェーズの完了条件を満たすまで次へ進まない。** 順番を入れ替えないこと — 特に Phase 2 を後回しにして薄いコンポーネントを量産することを禁じる(composable 形態の最後の未検証点が Phase 2 にあるため)。

### Phase 0 — vertical slice(最小証明)

**検証仮説**: 契約が形態を選び、ネイティブ委譲がそれを可能にする。かつ 2 つの急所(controlled mode / Toast 重なり順)が解ける。

**4 点すべての同時成立が完了条件**であり、1 つでも欠けたまま次へ進んではならない。

1. `usePopover` + `v-popover-trigger`(getSSRProps 込み)— **uncontrolled / controlled(`v-model:open`)両対応**。非同期処理の完了で閉じるシナリオが `v-model` 経由で素直に書けること(§4.4)
2. Dropdown blueprint(Nagi CSS 準拠 SFC、`:popover-open` + `@starting-style` アニメーション、Anchor Positioning + Floating UI フォールバック)
3. デモ A: Nuxt 遅延 hydration 下で **JS 到達前に開閉が動く**こと、および同 SFC が Nagi CSS linter を通ること
4. デモ B: **Dialog + Toast 共存デモ** — modal dialog が開いている状態でトーストを発火し、トーストが backdrop の下に潜らず最上位に表示されること(§7 の再昇格ロジックの実証)

1 と 4 は「面倒だが必須」の急所。ここで設計が破綻する場合は実装を進めず本文書の見直しに戻る。

### Phase 1 — 薄い側の横展開

**検証仮説**: Phase 0 の型(属性注入 + native state)が他の薄いコンポーネントにそのまま複製できる。

- `useDialog`(`<dialog>` / `showModal` 委譲、controlled 両対応、`closedby` の feature detect)
- `useTooltip`(hover/focus 遅延、`popover="hint"`、anchor positioning)
- `useDisclosure`(`<details>` ベース)

ここは工数検証であって設計検証ではない。新しい設計判断が発生したら、それは Phase 0 の型の欠陥なので core に戻す。

### Phase 2 — リスト系 composable の DX 検証(形態の最後の未検証点)

**検証仮説**: `v-for` で回る項目群への属性配布(`itemProps(item)` 型 API)が、囲いタグ方式より苦痛にならない。

- `useMenu` を対象とする(roving tabindex、タイプアヘッド、`aria-activedescendant`)。表層の浮遊は Phase 0 の popover に委譲し、対話モデルだけを新規実装する
- composable 形式で thick component が成立すること自体は React Aria hooks が存在証明済み。**ここで検証するのは可否ではなく Vue テンプレートでの書き味**である
- 完了条件: Menu blueprint のテンプレートを Reka UI の同等品と並べ、行数・可読性・linter 適合で劣後しないこと。劣後する場合はディレクティブ糖衣(`v-menu-item`)で吸収できるかを判定してから次へ進む

### Phase 3 — 厚い側の本丸

**検証仮説**: Phase 2 の項目配布パターンが選択モデル・入力連動(filtering)と組み合わさっても崩れない。

- `useListbox`(単一/複数選択)→ `useCombobox`(入力 + filtering + activedescendant)の順
- Select は customizable select(`<selectedcontent>`)の標準化動向を見て、委譲可能なら Phase 3 末尾、不可なら Combobox の派生として実装

### Phase 4 — 製品化

- blueprints の拡充(全コンポーネントの Nagi CSS 準拠 SFC)、Nagi CSS linter プリセット同梱
- §8 の制約を「Nagi UI が向かないケース」としてドキュメント化(dismiss 細粒度・ジェスチャーシート・Motion 級アニメが要件なら他ライブラリ併用を案内)
- テストレシピ(Vitest browser mode / Playwright)同梱

---

## 改訂履歴

- **2026-07-15** リポジトリ `CHARTER.md` を正本化。§4.4 の controlled mode 実装方式を「beforetoggle preventDefault」から「双方向ミラー同期(sync flush + 冪等適用)」へ改訂 — Popover API 仕様で hide 方向の beforetoggle が cancel 不能なため。目的(4.4 の3要件)は不変。
- **2026-07-15** §7 Toast 再昇格の機構を訂正: `showModal()` が open popover を全強制クローズする(HTML 仕様)ため、「開いていたら hide→show」は成立しない。再昇格の条件は region の DOM 状態ではなく useToast 自身のモデル(生きている toast の有無)とし、top layer 同居者の open toggle で再 show する方式に改めた。実装バグとして実際に検出・修正済み。
