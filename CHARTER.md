# Nagi UI — Concept & Architecture Charter

> **この文書の位置づけ**: Nagi UI の設計判断を固定するための憲章。実装エージェントは、この文書に反する構造(compound component 化、Teleport 導入、独自状態機械の複製など)を「改善」として提案・実装してはならない。判断に迷ったら本文書の「決定原理」に立ち返ること。
>
> **正本はこのリポジトリの `CHARTER.md`**。設計判断が実装の学びで変わったときは、該当節を改訂し、末尾の「改訂履歴」に理由つきで追記する。リポジトリ外の複製(初稿の `NAGI_UI_CONCEPT.md` 等)は参照しない。

---

## 0. 一言定義

**Nagi UI は、振る舞いを JS で再演せずブラウザ標準へ委譲し、通常は themeable package、必要時は所有可能な SFC として使える Vue UI システムである。**
attribute 注入型 headless core を内部の芯とし、Nagi CSS Contract(別文書 `CONTRACT.md`)を styling の基礎、その reference implementation を package component / Blueprint の単一ソースとして提供する。

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

## 3. プロダクト構成(package-first / own-on-demand)

| 層 | 配布 | 中身 | スタイル |
|---|---|---|---|
| **core** | npm パッケージ | composable 群 + ディレクティブ糖衣。ネイティブ属性 + ARIA を注入。完全に型付け | CSS を一切含まない |
| **components / blueprints** | npm component + on-demand copy-in | Nagi CSS 準拠の同一 SFC。通常は import して使い、構造変更が必要になった component だけ利用者のリポジトリへ複製する | Nagi CSS 契約準拠の読める CSS。**Tailwind 不使用** |
| **theme** | `@nagi-labs/nagi-ui/default-theme.css` + Nagi CSS contract | 色・spacing・radius・typography・shadow・control size・state appearance の token | DOM / behavior は変更しない |
| **contract preset** | npm(linter 側) | Nagi CSS linter 用の Nagi UI プリセット設定(`componentSlots` 等が必要になった場合のみ) | — |

- 通常の導入体験は PrimeVue 型(package import + theme token)とし、**最初から全 SFC の copy を要求しない**。package API で足りない component だけ `nagi-ui own <component>` 相当の workflow で所有へ移る。
- framework integration は `nagi-ui setup` で選択する。Vue Router / Nuxt Link は実 `<a href>` を保ったまま `navigate` / `prefetch` callback へ変換し、Nuxt Image は標準 `<img>` 用 URL へ変換する。framework component 自体やその props DSL を Blueprint schema へ流入させず、package / own の単一 SFC を維持する。詳細は `docs/setup-integrations.md`。
- shadcn から継承するのは **必要時に source ownership を移譲できること**。Tailwind・ユーティリティクラスは採らない。コピーされたコードは契約により決定的な命名を持つため、利用者の linter を最初から通る。
- component名とSFC filenameはlibrary名を付けず `Button` / `Button.vue` とする。
  Nagi CSS surfaceだけを厳密なnamespaceへ置き、`surfaceRootPrefixes: ["n-"]`
  とfilename kebabから `.n-button` を導出する。prefix欠落やfilename不一致の
  `.n-control`はlint errorであり、prefixの`startsWith`だけでは許可しない。
- 本当の商品は契約であり、Nagi UI はその実演装置(reference implementation)である。差別化は「契約 + linter + ライブラリ」の三位一体にあり、ライブラリ単体の機能差ではない(機能差は既存勢に 2〜3 年で吸収される)。

### 単一ソース原則(必須)

package component と own コマンドのコピー元を**別実装にしてはならない**。`blueprints/<component>/*.vue` の同じ SFC を package build と source ownership の双方へ使う。package だけ修正され copy 元が古い、または逆の状態は出荷不具合である。

### カスタマイズの段階

1. Theme token
2. 小さな props / items schema
3. 宣言済みの少数 slot
4. それ以上は source ownership

Blueprint の token 参照に literal fallback を書いてはならない。既定値は
`default-theme.css` に一元化し、通常はそれを import して必要な token だけ後勝ちで
上書きする。完全 replacement theme は `nagi-ui theme check` を CI gate とし、実 cascade
の不足は opt-in の dev diagnostic で検出する。欠落を見た目だけ成立させる fallback は、
theme 契約の不備を隠すため禁止する。旧 `theme.css` export は互換 alias に限る。

PrimeVue 型の巨大な pass-through props / slot surface は作らない。「API で表せない要求は source を所有する」が package API を小さく保つ境界である。一方、avatar・router-link・description 程度の要求で毎回所有が必要になるなら Theme と ownership の間が崖になっている。§3.5 の優先順と実利用データで境界を調整し、投機的 API は増やさない。

### ownership 後の保守契約

「所有可能」は「fork して取り残される」の言い換えであってはならない。owned source にはコピー元 component と version を機械可読な形で記録し、upstream diff / migration、Nagi UI lint、integration test により a11y・browser 修正を追えるようにする。`own` / `diff` と metadata 形式は Phase 4 で固定済み(`docs/phase4-ownership-cli.md`)。

このモデルの成功条件・失敗パターン・検証実験は `docs/package-ownership-model.md` を正本とする。

## 3.5 Blueprint の形態選択(owned DOM / props / items schema / slot)

Blueprint の各部分をどの機構で利用者へ開くかは、次の優先順で判定する。上の行で表せるものを下の行の機構にしてはならない。

| 中身の性質 | 機構 | 例 |
|---|---|---|
| 構造が固定 | owned DOM(template 直書き) | menu の list 骨格、card の frame |
| 文字列・真偽・列挙で表せる | props | plain title、image src、`variant` |
| 同型項目の繰り返し | items schema(blueprint-local) | menu items、select options、toast |
| 本当に自由な markup | slot(宣言済み sub-surface) | card の本文、rich title content、dialog の本文 |

### items schema の位置づけ

- Blueprint 内部の**編集可能な型**として提供する。core 公開 API へ昇格させない(core の商品は composable。schema を core に入れた瞬間、安定 DSL としての互換性負債が発生する)。
- package-first 化(§3)の帰結として、package 利用中はこの union が **component の props API** として公開される。したがって node 種は component version に紐づく最小の安定 API であり、「DSL を育てない」規律は copy-first 時代より**強く**適用する。union に表せない要求への答えは property 追加ではなく source ownership である。
- menu 系(Dropdown / ContextMenu / Menubar)が該当する。menu item は icon+label+shortcut の同型行であり、プラットフォーム(NSMenu、Electron、VS Code)が一貫してデータとして定義してきた UI である。**この判断は menu の性質に依存する例外であり、既定方針ではない。**
- schema の拡張手順(union member 追加 → template 分岐追加 → CSS 追加 → `nagi-css check`)を Blueprint に文書として同梱する。**この拡張レシピの同梱が採用の成功条件である**(欠けると利用者が slot 化へ逃げて CSS ownership が崩れる)。
- escape hatch(slot 差し込み・`component` field)は設けない。離脱路は①source を所有(own)した renderer の編集、②owned union の拡張、③`useMenu` / `useSubmenu` への降下、の 3 つで足りる。

### slot の位置づけ

slot は正当な機構である。§2 の compound 禁止は「**ライブラリが behavior の状態機械を複数タグへ分散して出荷する**」形態の禁止であり、package / ownership の単一ソース SFC が slot を持つことは対象外。Nagi CSS は slot sub-surface として境界を価格付けしており(宣言 + descendant step)、宣言して払えば契約違反ではない。条件:

- **境界は最小に保つ。** タグ族への分割(`CardHeader` / `CardContent` / `CardFooter` 等)は禁止。frame の anatomy は owned DOM で持ち、穴は default slot(必要なら named slot)で開ける。
- **slot を behavior 配線の通り道にしない。** slot 内容と親の状態を provide/inject で結合し始めたら、それは compound の再実装である。behavior は composable / props 経由のみ。menu の item 用 slot(`#item` に `itemProps` を渡して bind させる形)はこの違反例であり、item のカスタマイズは owned renderer の union 拡張で行う。
- データ形で表せる部分(title、image 等)の**基本経路を slot だけにしない**(上表の優先順)。plain text は props に寄せる。一方、複数の product reference で rich content が定着した安定 visible part は、owned wrapper を維持した content-only の同名 slot を prop fallback 付きで追加してよい。slot 指定時は slot を優先するが、header 全体や behavior 配線までは渡さない(Card の `title` / `description`、Alert の `title`、Dialog の `title` / `description`、Disclosure の `summary`、Badge の `label` が正規例)。slot content は wrapper の HTML content model に従い、`h2` / `p` / Badge の `span` 内では phrasing content、`summary` 内では phrasing content または heading content に限定する。summary 内へ別の interactive control は置かない。accessible name や基準テキストの保証に使う required prop は optional に落とさず slot prop として同じ文字列を渡す。
- **投機的な named slot を出荷しない。** slot は後から利用者が自分のコピーへ足すのは安いが、一度配ると利用箇所が依存して消せない。出荷形は「存在理由そのものの slot(Card / Dialog の本文等)」に限り、`#header-extra` のような予備枠は実際の要求が出てから追加する。

### 「User owns the DOM」の解釈

利用者が必要になった時点で**所有できるコード**により、最終 DOM・state selector・CSS ownership が追えること。package 利用中から全 DOM が利用側 SFC に現れることは要求しない。ownership 後は package と同じ source SFC が手元に移り、schema 版 menu でも DOM は owned `DropdownMenu.vue` から追える。

### Blueprint に配線を残す基準

ownership 後に利用者へ修正してほしい **policy と markup** は Blueprint に残す。一方、native event の順序、Vue model と DOM property の同期、browser 差異の吸収など、利用者へ修正してほしくない **mechanism** は小さな helper に隠す。判断は「変更できるか」ではなく「通常ここを変更してほしいか」で行い、helper の採用基準を呼び出し回数に置かない。全件監査の台帳は `docs/blueprint-wiring-audit.md`。

- 万能な config object、control kind の分岐、変換 callback 群を持つ汎用 helper は作らない。`useNativeRadioReset(input, model)` のように一つの固定された意味へ名前を付ける
- helper を使うために Blueprint 側で同じ写像や DOM 規則を再宣言するなら抽象化に失敗しているため、明示実装へ戻す
- composable の option object も自動的にpolicyとはみなさない。`openDelay: props.openDelay`、`disabled: () => props.disabled`、`area` / `offset` を `anchor` へ包むだけの一対一転送・reactive getter化・API形状変換は、利用者の編集箇所ではないためcomponent-specificなpackage adapterへ隠す。adapterは`@nagi-labs/nagi-ui/component-controls`へ隔離し、custom renderer向けのheadless root APIへ混ぜない。propsの定義とdefaultはSFCに残す
- Blueprint-local schemaの`getKey` / `getTextValue` / `isDisabled`、loading時のitems分岐、公開eventへの変換など、rendererのデータ解釈を決めるoption mappingはSFCに残す。schema解釈を含む一つのcallを、転送だけ隠す目的で複数helperへ分断しない
- 出荷SFC内の `watch` / `watchEffect` は禁止ではなく**要レビューのシグナル**とする。まず derived state で消せないか、次に固定意味の component-specific helper / composable へ移せないかを確認し、利用者が変更する policy の監視だけをSFCへ残す
- renderer の DOM 構造を変更したとき同時に直す必要がある処理（schema node から menu option への変換等）は、mechanism に見えても Blueprint に残す。ただし変更不能なa11y invariantとして固定するfocus repairは、DOM契約をbrowser testで拘束したcomponent-specific composableへ隠してよい
- 特殊要件で既定 mechanism を変えたい利用者は、ownership 後に helper を外して局所実装へ降りる。投機的な hook や options を helper に増やさない

### styling-only blueprint

behavior(core composable)を持たない blueprint(Card、Alert、Badge 等)は Nagi UI の composable 検証(§10 の phase 系列)の対象外であり、Nagi CSS 準拠の package component / ownable SFC として **phase 進行と独立に追加してよい**。一回きり・ページ固有の構造はコンポーネント化せず inline で書く選択も通常どおり有効。

### component benchmark の採用基準

component の機能選定は一つの catalog だけで決めない。Base UI は behavior / a11y / keyboard / focus 保証、shadcn-vue は Vue の実用 anatomy と source ownership、PrimeVue は package-first / themeable component に期待される props・slots・完成度の比較対象とする。Web platform の語彙と本 CHARTER は常にこれらより優先する。

- shadcn-vue と PrimeVue の両方に同じ visible part または小さな enum がある場合、それ自体を product evidence とみなし、追加の Nagi 固有利用例がなくても review 対象へ上げる。「投機的 API」を避ける規律は、複数の代表的 product library で定着した anatomy を無視する意味ではない
- 共通性は capability の証拠であり API 形態の指示ではない。compound parts、`asChild`、pass-through props をコピーせず、本節の owned DOM → props → items schema → 最小 slot → ownership の順へ翻訳する
- 一方の styled library にしかない機能は実要求待ちとする。複数 library に共通していても native ownership と衝突する custom Select、gesture Drawer、portal / focus-trap runtime 等は明示的に不採用または独立 component として判定してよい
- 出荷済み component と Base UI baseline の比較・採否台帳は `docs/base-ui-component-comparison.md` を正本とする

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

composable 形態の実証状況: 薄い側(属性オブジェクトを返すだけ)はリスクなし。厚い側(Combobox 等)も React Aria hooks が composable 形式での WAI-ARIA 準拠実装の存在証明になっている。`v-for` 項目群への属性配布(`itemProps(item)` 型 API)の Vue テンプレートでの書き味は §10 Phase 2 の `useMenu` + ActionMenu blueprint で検証済み。結果と比較は `docs/phase2-menu.md` を正本とする。

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
3. **`data-*`**: native/ARIA に対応物がない状態のみ。例: Menu / Listbox の選択とは独立した視覚的フォーカス `data-active`。Combobox popup は APG の selection-follows-focus に従い active option を `aria-selected` で表せるため `data-active` を重ねない。使用する各 `data-*` は**公開 styling contract としてドキュメントに列挙**する

禁止例: popover の開閉に `data-state="open"` を付与すること(`:popover-open` と重複する)。

## 7. コンポーネント別投資マップ

| コンポーネント | 実装の厚さ | 中身 |
|---|---|---|
| Popover / Tooltip / Dialog | **薄い**(属性注入 + 位置決めのみ) | popovertarget 配線、anchor positioning、`<dialog>` 委譲 |
| Toast | 中(見た目より罠が多い) | queue/timer は明示的 `createToastManager()`、DOM/top-layer/F6 配線は `useToast` に分離し、Provider・singleton は持たない。popover の重なり順は open 順で `z-index` 無効、さらに `showModal()` は open popover を強制 close するため、**生きている toast model を条件に再 show**する。title/description だけを top-layer 外の polite/assertive live node で通知し、hover/focus/document hidden 中はtimerを停止する。詳細は `docs/base-ui-alignment-c.md`。 |
| Disclosure / Accordion | 薄い | `<details>` ベース + アニメーション CSS |
| Tabs | 中 | `useTabs` が roving tabindex、manual/automatic activation、orientation/RTL、disabled/dynamic fallbackを所有する(ネイティブ代替なし)。Blueprintはnative button + owned tabpanel、flat items schema + content-only `panel` slotとし、compound partsやIndicator geometry runtimeを持たない。詳細は `docs/base-ui-alignment-d-tabs.md`。 |
| Menu / Listbox / Combobox | **厚い**(本プロジェクトの JS 工数の本丸) | タイプアヘッド、focus 管理、選択モデル。Menu は `aria-activedescendant` 方式を採用し、roving tabindex と混在させない。表層(浮遊部)は popover に委譲しつつ、対話モデルだけを自前実装 |
| Select | **薄い**(native stable path) | 通常の `<select>` / `<option>` に behavior・form・validation・a11y を委譲する。`appearance: base-select` は progressive enhancement としてのみ使用可。`<selectedcontent>` は Vue と3エンジンの出荷条件を満たすまで stable Blueprint に含めない |

a11y 実装工数の 7 割はここ(Menu/Listbox/Combobox 系)に集中する想定。「ネイティブで全部薄くなる」という誤解に基づく設計をしないこと。

## 8. 既知の制約と致命度トリアージ

Base UI 等の全 JS 実装との比較で判明している制約。**これらは実装エージェントが「解決」しようとしてはならないものと、必ず解くものに分かれる。** UA に主権を渡したことの直接の帰結である制約は、バグではなく契約条件として扱う。

### 8.1 本質的にできない(委譲の対価。実装で解決を試みない)

| 制約 | 内容 | 扱い |
|---|---|---|
| dismiss ポリシーの細粒度カスタム | light dismiss は UA の状態機械内。選べる粒度は `popover="auto/manual/hint"` のみ。「外側クリックで閉じるが ESC では閉じない」等は不可 | `manual` に落として自前実装するのは Base UI の再実装であり**禁止**。`<dialog>` の `closedby` 属性など、プラットフォーム側の拡張を feature detect で取り込む方針。ドキュメントに「向かないケース」として明記 |
| top layer のスタッキング制御 | 重なり順は開いた順で固定、`z-index` 無効 | Toast のみ §7 の再昇格ロジックで内部対処。それ以外の任意順序制御は提供しない |
| modal 外 Toast の操作・通知 | native modal は dialog 外を inert にする。外側の Toast を再昇格して視認できても action / focus は modal 外へ出せず、外側 live node も accessibility tree から外れ得る | `F6` は active modal 外へ focus を移さない。modal 中に操作または AT 通知が必要なら同じ明示 manager の renderer を dialog 内へ置く。Teleport / inert 解除はしない |
| `::backdrop` に実 DOM を置けない | 擬似要素のためインタラクティブな overlay 不可 | 制約として文書化のみ(要件として稀) |
| UA 挙動差・UA バグの自前修正 | 振る舞いの実装が UA 側にあるため、ライブラリパッチで統一できない | evergreen ブラウザ前提と明記。対応下限はプラットフォームに従属 |
| Shadow DOM 越えの idref 配線 | `popovertarget` / `aria-controls` は shadow root を越えない | v1 非対応。Reference Target 仕様の標準化を監視 |

### 8.2 可能だが面倒(支払い主を明確にして対処)

| 制約 | 致命度 | 対処 |
|---|---|---|
| controlled mode | **高 — 未解決なら製品不成立** | §4.4 の通り composable 内部に封じ込め。§10 の vertical slice 成立条件に含める |
| Toast × Dialog の重なり順 | **高 — デモで 30 秒で露見する** | `useToast` に再昇格ロジック内蔵。共存デモで先回りして証明する(§10) |
| JS アニメーションとの統合 | 中 | popover/dialog は閉じてもアンマウントされない(display 切替)ため、`v-if` 前提の Motion 系・exit オーケストレーションと相性が悪い。CSS で足りる範囲(§5)を正とし、超える要件は「向かないケース」に明記 |
| ジェスチャー駆動の中断可能クローズ(vaul 的ボトムシート) | 中 | スコープ外と明記。囲いタグ・provider・グローバル状態がなく component 単位で導入できるため、該当コンポーネントだけ他ライブラリと混在可能なことをドキュメントで案内 |
| テスト環境(jsdom の dialog/popover サポート不完全) | 中 | Vitest browser mode / Playwright 前提のテストレシピを blueprints に同梱 |
| Invoker Commands フォールバック維持 | 低 | feature detect の二重経路を普及完了まで保守(§5 既定) |

### 8.3 ダメージを吸収する構造(エージェントへの補足)

- **自己選択**: Nagi CSS に共感する層と、spring 物理・ジェスチャー UI を最重要視する層はほぼ互いに素。全方位で勝つ必要はない。
- **混在可能性**: 囲いタグ・provider・グローバル状態がないため、コンポーネント単位で Reka 等と共存できる。all-or-nothing ではない。
- **AI との語彙共有**: Blueprint は Web 標準の HTML / CSS / ARIA と Vue SFC という事前学習済み語彙に全振りし、Nagi 独自の抽象語彙を増やさない。新規語彙は Nagi CSS 契約だけに限定し、そこだけを `nagi-css check` で機械検査することで、エージェントが追加知識を最小化したまま DOM と表示を対応づけて編集できる構造にする。
- **時間はこちらの味方**: `closedby`、anchor positioning、Invoker Commands と、プラットフォームがギャップを埋め続けている。委譲層はギャップが埋まった瞬間コードを書かずに機能が増える。全 JS 実装は逆にネイティブ化の度に自前実装が負債化する。機能差を静的な欠陥として埋めにいかないこと。

## 9. アンチゴール(実装してはならないもの)

- ❌ compound component 公開 API(`<NagiRoot>` / `<NagiTrigger>` 等)。禁止対象はライブラリ出荷の behavior 分散タグ族であり、利用者が所有する SFC の slot は対象外(§3.5)
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

**Status: Complete (2026-07-16)**

**検証仮説**: Phase 0 の型(属性注入 + native state)が他の薄いコンポーネントにそのまま複製できる。

- `useDialog`(`<dialog>` / `showModal` 委譲、controlled 両対応、`closedby` の feature detect)
- `useTooltip`(hover/focus 遅延、`popover="hint"`、anchor positioning)
- `useDisclosure`(`<details>` ベース)

ここは工数検証であって設計検証ではない。新しい設計判断が発生したら、それは Phase 0 の型の欠陥なので core に戻す。

### Phase 2 — リスト系 composable の DX 検証(形態の最後の未検証点)

**Status: Complete (2026-07-17)**

**検証仮説**: `v-for` で回る項目群への属性配布(`itemProps(item)` 型 API)が、囲いタグ方式より苦痛にならない。

- `useMenu` を対象とする(typeahead、disabled skip、keyboard selection、focus restoration)。表層の浮遊は Phase 0 の popover に委譲し、対話モデルだけを新規実装する
- focus 戦略は WAI-ARIA APG が示す代替案のうち `aria-activedescendant` を採用した。DOM focus は `role="menu"` container に置き、items は `tabindex="-1"` とする。roving tabindex とは混在させない
- composable 形式で thick component が成立すること自体は React Aria hooks が存在証明済み。**ここで検証するのは可否ではなく Vue テンプレートでの書き味**である
- 完了条件: Menu blueprint のテンプレートを Reka UI の同等品と並べ、行数・可読性・linter 適合で劣後しないこと。劣後する場合はディレクティブ糖衣(`v-menu-item`)で吸収できるかを判定してから次へ進む

### Phase 2.5 — Dropdown の完成形検証

**Status: Complete (2026-07-17)**

**検証仮説**: action item だけで成立した Phase 2 の明示的な DOM + 属性注入形式が、Dropdown Menu の全機能を載せても compound components より理解しやすいまま保てる。

- 表示専用 parts: group、label、separator、shortcut。専用 component を増やさず、semantic HTML と Blueprint の anatomy として表現する
- stateful items: checkbox item、radio group / radio item、indeterminate state、選択後に menu を閉じるか維持するかの policy
- submenu: 独立した `useMenu` の入れ子ではなく、open path、active item、focus owner、close depth、RTL、pointer grace を共有する menu tree model を設計する
- nested Popover と Anchor Positioning を利用し、overlay の top-layer / collision 処理は可能な限り platform へ委譲する
- keyboard: Enter / Space、ArrowRight / ArrowLeft、Escape、Tab、typeahead を階層単位で処理し、子 menu の event が親 menu で二重処理されないこと
- Blueprint は「完成した Dropdown Menu SFC」と「それを利用する側の SFC」の両方を提示する。最終 DOM、state selector、CSS ownership が一つの SFC から追えることを優先する
- 完了条件: Reka UI / shadcn-vue の Dropdown Menu suite と同じ機能境界で比較し、submenu・checkbox・radio を含めても Nagi の SFC が局所変更しやすく、browser / keyboard / focus tests が通ること

この Phase は機能 parity 自体を目的にしない。**Dropdown を最後まで複雑化した時にも「behavior は core に隠し、structure と integration は見せる」という設計が維持できるか**を判定する最終形の検証である。

**判定: 維持できる。** `useSubmenu(parent, triggerItem, options)` が menu tree の open path / focus owner / close depth / RTL / pointer grace を core に閉じ込め、SFC は native な group / label / separator / shortcut と各 item への props 適用をそのまま表示する。action / checkbox / radio の close policy も props 単位で明示できる。完成形と利用側 SFC、比較、invariant、検証結果は `docs/phase2.5-dropdown.md` に記録した。

### Phase 2.6 — Dropdown items schema blueprint

**Status: Complete (2026-07-17)** — unit / type / SSR / `nagi-css check` / browser(Playwright 10 件 pass、items 再計算・動的 submenu 含む)をすべて検証済み。学び(内部 SFC は設定namespace + filename由来の surface root class を持ち element class を置き換える、surface は自分の margin を持たない)は `docs/phase2.6-dropdown-schema.md` に記録。

**検証仮説**: blueprint-local の recursive items schema(§3.5)が、明示 DOM 版と同じ behavior 保証・Nagi CSS 適合を保ったまま、利用側の認知負荷と配線ミスを減らす。

この Phase は blueprint の**配布形態**の検証であり、core composable の検証系列とは独立。Phase 3 と並行してよい。

- schema は blueprint-local(§3.5)。node は `action` / `link` / `checkbox` / `radio-group` / `group` / `separator` / `submenu` の 7 種類。`link` は URL を受け取って実際の `<a href>` を出す Web 標準の基本項目であり、framework component を受け取る escape hatch ではない。`label` は独立 node にせず `group`(`role="group"` + `aria-labelledby` と一致)へ統合。`action` に `variant?: "danger"`。`checked` は `MaybeRefOrGetter` ではなく plain 値とし、親が items 全体を computed で再生成する(core は `getKey` 同定 + `toValue(items)` のため状態は壊れない)
- submenu の再帰描画は blueprint 内部の自己参照 component で行う(`useSubmenu` が setup 文脈を要するため)。core は動的 register/unregister 済みで改修不要
- avatar / Vue Router の `<RouterLink>` / Nuxt の `<NuxtLink>` component 自体 / description / permission 制御は schema に**入れない**。表示制御は computed での filter、構造変更は拡張レシピの題材とする。標準 URL navigation は常に実 `<a href>` の `link` node。`nagi-ui setup` の local adapter は router 固有の `to` object を `href` + framework-neutral な `navigate` / `prefetch` callback に境界変換してから node へ渡す。custom link component や active-class rendering が必要なら ownership で拡張する
- 現行の hardcoded `DropdownMenu.vue` は playground の全機能 fixture へ降格し、明示 DOM 版の書き方は composable への離脱パスの実例として docs に残す
- 完了条件:
  1. 再帰 renderer が `nagi-css check` を通る(通らなければ案自体を見直す)
  2. menu open 中に items が再計算されても open path / active item / focus owner が維持されることを browser test で固定化する
  3. submenu node の動的追加・削除で register/unregister が leak しない
  4. schema を故意に壊した際の TS エラーが変更箇所を指す(AI agent 前提の指標)
  5. 拡張レシピ文書を同梱し、schema 外の要求(avatar / router-link)をレシピ通りの局所 diff で追加できることを実証する

### Phase 3 — 厚い側の本丸

**検証仮説**: Phase 2 の項目配布パターンが選択モデル・入力連動(filtering)と組み合わさっても崩れない。

**Status: Complete (2026-07-18)** — `useListbox` の no-prune selection を土台に、`useCombobox` では入力値・確定選択・候補内 active option を分離。DOM focus を input に保った `aria-activedescendant`、filtering、disabled skip、Enter/click commit、lossless Escape、native Popover + Anchor Positioning を unit / type / SSR / `nagi-css check` / browser で検証した。Select は native `<select>` への委譲を stable path とし、自前の `useSelect` や Combobox 派生 fallback は作らないと決定した。詳細は `docs/phase3-listbox.md`、`docs/phase3-combobox.md`、`docs/phase3-select-decision.md`。

- `useListbox`(単一/複数選択)→ `useCombobox`(入力 + filtering + activedescendant)の順
- Select の stable surface は通常の `<select>` / `<option>`。`appearance: base-select` は非対応環境が native rendering に戻る progressive enhancement とし、rich option DOM や `<selectedcontent>` を前提にしない
- `<selectedcontent>` は HTML Standard に存在しても、Vue compiler の native tag / nesting 対応、Blink・WebKit・Gecko の stable 実装、SSR/hydration と keyboard/form の相互運用検証が揃うまで採用保留。見た目の同一性のために Combobox から Select を再実装しない

### Phase 3.5 — Verified integration

**Status: Complete (2026-07-18)** — `mergeNagiProps()`、template-only `eslint-plugin-nagi-ui/verified-bindings`、最終 DOM の relationship verifier、開いた Blueprint 状態の axe-core 検査を実装。valid/corrupted DOM graph と keyboard/focus contract を含む browser suite 28/28 を検証した。詳細は `docs/phase3.5-verified-integration.md`。

出荷済み core の挙動テストとは別に、利用者や coding agent が Blueprint を変更した後の integration contract を機械的に守る。

- `mergeNagiProps()` — event / class / style と token-list ARIA 属性を結合し、それ以外の重複値が異なれば semantic conflict として例外にする。reactive getter は freeze しない
- `eslint-plugin-nagi-ui` — `triggerProps` / `menuProps` / `itemProps(item)` 等の適用先、必要な native 属性、直接上書き、複数 object binding、`v-for` key を Vue template AST から検証する。TypeScript 7 対応 parser がない間は公式の `parser: false` による template-only pass とし、script data-flow / component 境界をまたぐ親子関係は runtime 側で検証する
- runtime DOM verification — `verifyNagiDom()` / `assertNagiDom()` と明示的に dev で有効化する `observeNagiDom()` により、動的 ID reference、active descendant、重複 ID、native popover target、実 DOM 上の trigger / popup 関係を検査する。production observer は暗黙に導入しない
- rendered accessibility checks — Action Menu、完全な Dropdown + submenu、Listbox、Combobox、Dialog、Tooltip を開いた状態で axe-core WCAG 2.1 AA 検査を行い、Playwright の keyboard / focus contract tests と併用する。rule 除外は行わない
- Nagi CSS は owned DOM / selector contract、Nagi UI lint は behavior wiring を担当し、責務を混在させない

この Phase を後段に置く理由は、Menu / Listbox / Combobox の props contract が固まる前に lint 規則を固定して二重改修することを避けるためである。

### Phase 4 — 製品化

**Status: Complete (2026-07-21)** — package-first / own-on-demand の通常利用、
source ownership、upstream追従、v0 catalog、制約の自己選択、consumer側の実browser
回帰契約までを一続きの製品経路として出荷した。各sliceの正本は下記リンクに置く。

**検証仮説**: package-first / own-on-demand(§3)が実装として成立する — 通常利用は package import + theme token で完結し、所有しても保守可能である。§0 の一言定義を実装が追い越すまで製品とは呼ばない。

スライス順:

1. **Package 実体化** — **完了(2026-07-18、theme契約を2026-07-21改訂)**。blueprints を `packages/core/blueprints/` へ移し raw SFC のまま `/components` から export。semantic token はfallbackなしのBlueprint参照 + `default-theme.css` + coverage check / replacement-theme診断で管理する。playground が package 消費経路と token-only ブランド変更の実証。設計と実装結果は `docs/phase4-package-design.md`
2. **`own` / `diff` CLI と `@nagi-source` metadata 形式の固定** — **完了(2026-07-18)**。`nagi-ui own/diff/list` を package 同梱 bin として実装し、metadata を `@nagi-source <component>/<file>@<version>`(per-file 刻印)に固定。`diff` は clean / modified / drifted / unknown-source を判定し CI gate に使える。詳細は `docs/phase4-ownership-cli.md`
3. **早期検証実験** — **coding-agent アーム完了(2026-07-21)**。Button(theme)/ Dropdown(ownership)/ Combobox(upstream 追従)の 3 境界すべてで、無文脈 agent が誘導なしに設計意図の経路(token 上書き / own + 拡張レシピ / 3-way merge + stamp 更新)を選び PASS。副産物: CLI テストのバグ修正、`diff` の gate を `drifted` / `unknown-source` に限定、「own したら即コミット」の base 確保手順。記録は `docs/phase4-validation-experiments.md`。人間アームと反復実行は今後の課題
4. **blueprints の拡充** — **完了(2026-07-21)**。Popover / Dialog / Tooltip / Disclosure / Toast を追加して公開 behavior core との欠落を解消し、styling-only baseline を Button / Card / Alert / Badge に固定。全12 componentをpackage + ownable raw SFCで出荷し、consumer用Nagi CSS presetも同梱した。unit 103/103、SSR、ownership、verified-bindings、theme parity、owned/consumer Nagi CSS、browser + axe 37/37を検証。将来のstyling-only追加は実要求ベースでphase独立に行い、このsliceを再openしない。詳細は `docs/phase4-blueprint-catalog.md`
5. **consumer guidance / test recipe** — **完了(2026-07-21)**。§8 を利用者向けの[`docs/when-not-to-use-nagi-ui.md`](docs/when-not-to-use-nagi-ui.md)へ翻訳し、dismiss細粒度・任意stack・interactive backdrop・gesture sheet・Motion級animation・custom Select等はcomponent単位で別ライブラリへ任せる境界を明文化。Vitest Browser Mode / Playwrightのcopyable contractを`packages/core/recipes/testing/`としてnpm packageへ同梱し、keyboard / focus / dismiss / form / `assertNagiDom` / axe / SSR・zero-JS選択条件と、`own`即commit → `diff` → merge → real-browser testの更新loopを固定。unit 116/116、TypeScript 7、verified-bindings、owned/consumer Nagi CSS、browser + axe 41/41、package tarballへのrecipe 6 files収録を確認した

---

## 改訂履歴

- **2026-07-22** expanded catalog small interactive sliceとして FileInput / Pagination / Ratingを追加し、一般UI scopeの進捗を37/54 = 68.5%へ更新。FileInputはvisible native controlにchooser/FileList/form/resetを委譲し、Paginationはflat schemaをreal link/native buttonへ描画してrouter/data-fetchingを持たず、Ratingはnative radio groupと固定2引数reset helperだけに限定した。全SFCの最終露出監査、forced-colors、keyboard、FormData、reset、package/ownership/preset/tarball経路を検証。全browser gateで見つかったthemed Dropdownの境界的shortcut contrastもtheme token overrideで修正し、unit 208/208、browser + axe 78/78、TypeScript 7、integration lint、owned/consumer Nagi CSSを確認。正本は`docs/expanded-catalog-small-interactive-slice.md`。
- **2026-07-22** expanded catalog thin sliceとして Breadcrumb / ButtonGroup / EmptyState / Kbd / Skeleton / Spinner / Textareaを追加し、一般UI scopeの進捗を34/54 = 63.0%へ更新。native/presentationだけで成立する境界に限定し、router node、Button API複製、shortcut registry、loading state machine、autosizeは持ち込まなかった。package export・ownership・consumer preset・catalogを同じSFCへ接続し、Nagi CSS presetのcomponent class手書きmapを廃止して`componentClassPrefix: "n-"` + component名からの規約導出へ統一。unit 198/198、browser + axe 75/75、TypeScript 7、owned/consumer Nagi CSS、tarball収録を確認。正本は`docs/expanded-catalog-thin-slice.md`。
- **2026-07-22** Base UI + shadcn-vue + PrimeVueの全catalogをNagi sliceへ正規化し、一般UIとして採用する全体scopeを54（27 shipped + 27 backlog）へ拡張。全体進捗を27/54 = 50.0%とし、従来の27/37 = 73.0%はBase UI aligned指標として併記する。Nagi Grid等の別product、Native/recipe、Declineは分母から除外。正本は`docs/expanded-vue-component-catalog.md`。
- **2026-07-22** Nagi CSSのSTN anatomy語彙変更に合わせ、出荷Blueprint・playground・自動テストの`.zone`を`.unit`へ一括移行。後方互換aliasは残さず、同時監査で見つかった旧Blueprintの色リテラルも既存theme tokenへ統一した。packageに混入していたPhase 0 zero-JS用Dropdownを`demos/NativePopoverDropdown.vue`へ移し、package/ownership正本をschema-driven版へ一本化。unit testで旧anatomyと色リテラルの再混入を禁止し、canonical / consumerのcross-repo lintを両方通過させた。
- **2026-07-22** Base UI alignment D3として Accordion / AlertDialogを追加し、Base UI aligned進捗を採用37 slice中27出荷の73.0%へ更新。Accordionはflat items schemaをnative `<details name>`へ描画し、single/multiple共通のcontrolled `openKeys`、disabled summary、content-only summary/panel slotを提供する。AlertDialogはvisual Alertから分離し、native modal `<dialog role="alertdialog">`、必須description、明示的Cancel/Action、Cancel autofocusに固定した。実装後のSFC配線監査でgenerated name・native toggle順・disabled activation・固定dismiss policyを`/component-controls`へ隠し、schema解釈・公開event・IDREF・DOM/CSSだけをSFCへ残した。正本は`docs/base-ui-alignment-d3-accordion-alert-dialog.md`。
- **2026-07-22** Blueprint内のcomposable option objectを再分類。一対一のprop転送・getter化・core API用のnestingはpolicyではなく固定adapterとして`@nagi-labs/nagi-ui/component-controls`へ隠し、headless root APIと分離した。Avatar / Button / Dialog / Disclosure / Popover / Tooltip / Toggle / ToastとCombobox form channelを短いcomponent adapterへ統一する一方、Menu / Listbox / Combobox / Tabsのschema解釈・items分岐・公開event変換は所有後の編集箇所として可視のまま維持する。判断表は`docs/blueprint-wiring-audit.md`。
- **2026-07-22** 全出荷Blueprintを「ユーザーに修正してほしい場所か」で配線監査。Toast lifecycle/focus repair、Avatar image race、Combobox native form channel、Tabs model bridge、Button disabled activationをpackage composableへ隠し、Dropdown node option変換は編集対象renderer moduleへ移した。Input/Checkbox/Switch/Sliderは`useAttrs()`をtemplateの`$attrs`へ簡約、Comboboxも追加属性をbehavior propsと安全にmergeしてnative inputへ固定した。通常`own`はcomposableをコピーせず、schema/rendererの相対dependency closureだけをunit testで保証する。SFC内`watch`等を禁止ではなくmechanism漏出のreview signalとする基準を§3.5へ追加し、現時点の出荷SFCはwatch/lifecycle/direct DOM global/useAttrs 0件。正本は`docs/blueprint-wiring-audit.md`。
- **2026-07-22** Base UI alignment D2として Avatar / Separator / Toggleを追加し、component作成進捗を採用37 slice中25出荷の67.6%へ更新。Avatarはnative image + deterministic fallback + error/src recovery、Separatorはhorizontal `<hr>` / vertical ARIA / decorative、Toggleはnative `<button aria-pressed>` + controlled modelに限定し、compound/asChild/custom state語彙を導入しなかった。同時に全SFC filenameから`Nagi` prefixを除去し、全Blueprint surfaceをNagi CSSの厳密な`n-` + filename契約へ統一した。
- **2026-07-22** composableをDLするownership layer (`vue` / `all`) は設計だけを保持し、component catalog拡充を優先して実装延期とした。package内部でmechanismをcomposableへ隠す方針とは分離し、composable ownershipの実需要が観測されるまで再開しない。
- **2026-07-21** Card の `title` / `description`、Alert の `title`、Dialog の `title` / `description`、Disclosure の `summary`、Badge の `label` を、plain text props をfallbackとして保つ同名content-only slotへ拡張。propかslotかを排他的に決めず、安定visible partのrich content需要が確立している場合だけ、owned wrapperを維持した最小slotを併設できると§3.5へ明文化した。required text props、ARIA IDREF、native summary behavior、header anatomy、既定typography/toneはSFCが保持し、header全体のslot化・behavior propsの受け渡し・compound partsは引き続き不採用。
- **2026-07-21** cross-library benchmarkの最初のstrengthening sliceを完了。Alertは自由markupの`icon` slot、Buttonは`small | default | large` enum、Cardはneutral wrapperを保つ`footer` slotを追加し、compound parts・icon-name DSL・loading・header action・media APIは増やさなかった。公開`small`はNagi CSSのHTML語彙衝突を避けCSS identity `-compact`へ翻訳し、Card内部もnative landmarkを捏造せずSTN wrapperを維持。component作成進捗は採用37 slice中22出荷の59.5%とし、Native/recipeとDeclineは分母から除外する。
- **2026-07-21** component benchmark を単一の Base UI catalog 比較から、Base UI(behavior / a11y)、shadcn-vue(Vue anatomy / ownership)、PrimeVue(package-first expectations)の三角測量へ改訂。shadcn-vue と PrimeVue に共通する visible anatomy は product evidence とみなす一方、API は §3.5 の優先順へ翻訳し、native-first と衝突する common feature は不採用または独立 slice にできると固定した。全22出荷component + Base UI 37件の台帳は `docs/base-ui-component-comparison.md`。
- **2026-07-21** Theme契約をfallback-freeへ改訂。Blueprintの`var(--nagi-*)`からliteral fallbackを除去し、28 tokenの既定値を`default-theme.css`へ一元化。manifest / default / Blueprint vocabulary parity、`nagi-ui theme check`、opt-in computed-cascade warningにより欠落を可視化し、旧`theme.css`は互換aliasだけ残した。ownership layerは編集済みSFCのimportを書換えないrouting module方式、初期surfaceを`vue` / `all`に限定、version/path/hash sidecarを持つ設計として`docs/package-ownership-model.md`へ固定したが、実装順は後に延期した。
- **2026-07-21** Blueprint の配線露出基準を §3.5 に追加。所有後に変更する policy / markup は SFC に残し、native event 順・Vue model / DOM property 同期など変更しない mechanism は、再利用数に関係なく固定意味の小 helper へ隠す。万能 helper / config DSL は作らず、renderer DOM 変更と同時に修正すべき処理は可視のまま保つ。
- **2026-07-21** Base UI alignment D1 として Tabs を完了。独立した `useTabs` に manual/automatic activation、roving tabindex、horizontal/vertical + RTL、disabled skip、controlled canonicalization、dynamic fallbackとDOM focus修復を実装。package/ownable単一SFCはflat items schema + behaviorを渡さないcontent-only `panel` slotでrich markupを扱い、compound parts・Indicator geometry runtime・lazy automatic panelは不採用。`defineModel` の親prop反映前にfallbackを再読して誤focusする実browser固有bugとcontrolled SSRの全panel hidden不整合をlocal bridgeで修正し、forced-colorsでもselectionとfocusを分離。unit 155/155、browser + axe 69/69、TypeScript 7、SSR、verified-bindings/runtime IDREF verifier、owned/consumer Nagi CSS、実tarball収録を確認。正本は`docs/base-ui-alignment-d-tabs.md`。
- **2026-07-21** Base UI alignment C 完了。Toast を明示的 `createToastManager()` と単一 Blueprint に分離し、structured title/description/tone/action、polite/assertive announcement、explicit-id upsert、limit、update/close-all/promise、timer pause/resume、複数regionを巡回するF6 focus returnを追加。Provider/Portal/singleton/swipe/stack physicsは不採用。native modal外のrendererへF6を出さずlive nodeのinert境界も固定し、unit 137/137、browser + axe 59/59、TypeScript 7、verified-bindings、owned/consumer Nagi CSS、実tarball収録を確認。正本は`docs/base-ui-alignment-c.md`。
- **2026-07-21** Base UI alignment B 完了。Input / Checkbox / Radio / Switch / Select / Fieldset / Progress / Meter / single-thumb Slider をnative-first package/ownership Blueprintとして追加。Comboboxにdisabled/read-only/required、selected-key submission、clear、empty/loading、resetを追加し、popupとlistboxをARIA上分離。native reset後もDOM/Vue model/FormDataを一致させる小さなbridgeのみcoreへ置き、compound Field、`useField()`、custom Select、multi-thumb Sliderは不採用。unit 124/124、browser + axe 51/51、TypeScript 7、verified-bindings、owned/consumer Nagi CSS、実tarball収録を確認。正本は`docs/base-ui-alignment-b.md`。
- **2026-07-21** Phase 4 完了。Web標準への委譲が合わないproduct要件とcomponent単位の混在判断を利用者向けに公開し、package/owned双方で使えるVitest Browser Mode / Playwright recipeをnpm packageへ同梱。`own`完了時にも即commit・test recipe・`diff` gateを案内し、「所有しても取り残されない」をconsumer側の実行可能な契約まで接続。unit 116/116、browser + axe 41/41と実tarball収録を確認した。
- **2026-07-21** framework integration setup を追加。`nagi-ui setup` が Vue / Nuxt、native / Vue Router / Nuxt Link、native image / Nuxt Image を選び local adapter を生成する。Dropdown schema は router DSL や framework component を受けず、実 `<a href>` に optional `navigate` / `prefetch` callback のみを足す。Nuxt Image も `useImage` の安定 URL 生成を標準 `<img>` 属性へ落とし、package / own の単一 SFC を維持する。
- **2026-07-21** Base UI alignment A1。Dropdown schema に標準の `<a href>` を所有する `link` node を追加し、framework 固有の router-link/component escape hatch とは境界を分離。Button focusable-disabled、Disclosure/Tooltip disabled、Popover/Tooltip positioning props、Dialog description/actions、neutral Card anatomy も既存の native-first / small API 規律内で追加し、unit 108/108、browser + axe 40/40、TypeScript 7、verified-bindings、owned/consumer Nagi CSSを確認。
- **2026-07-21** Phase 4 slice 4 完了。styling-only baseline をCHARTER §3.5の具体例どおりButton / Card / Alert / Badgeに固定し、behavior-backed 8 componentと合わせたv0 catalog 12種をpackage/ownership/presetの全経路へ登録。Alert + Badgeで2 component反復したpositive/warning tone 6 tokenを昇格し、Nagi CSSで公開prop `success` とCSS identity `-positive`を分離。unit 103/103、browser + axe 37/37を確認。
- **2026-07-21** Phase 4 slice 4 の behavior catalog を完了。Popover / Dialog / Tooltip / Disclosure / Toast の package/ownable SFCを追加し、公開 behavior core と component catalog の欠落を解消。package component boundary と slot sub-surface を定義する Nagi CSS presetを同梱し、owned-source検査とconsumer検査を分離した。unit 102/102、browser + axe 36/36、TypeScript 7、verified-bindings、theme parity、Nagi CSSを確認。
- **2026-07-18** Phase 4 slice 1–2 完了。package 実体化(raw SFC 配布、`/components` + `theme.css` exports、semantic token 22 個 + parity test)と ownership CLI(`nagi-ui own/diff/list`)を実装し、`@nagi-source <component>/<file>@<version>` を §3 保守契約の確定 metadata 形式とした。
- **2026-07-18** Phase 4 を package-first の宿題に合わせて再定義。スライス順(package 実体化 → own/diff CLI → 早期検証実験 → blueprint 拡充 → 向かないケース文書化)と検証仮説を明記し、slice 1 の設計正本を `docs/phase4-package-design.md` に置いた。
- **2026-07-18** package-first 改訂(§3)の残存整理。§3.5 等の copy-in 前提の文言を own-on-demand 用語へ更新し、items schema が package 利用中は component の最小 props API(component version に紐づく)として公開される帰結と、その下での「DSL を育てない」規律の強化を明文化。混在可能性(§8.2)の根拠を copy-in 配布から「囲いタグ・provider・グローバル状態の不在」へ訂正。package 利用中の consumer styling 境界は `docs/package-ownership-model.md` に追記。
- **2026-07-18** Phase 3.5 完了。最終 DOM の IDREF / active descendant / native popover 関係を検査する `verifyNagiDom()` / `assertNagiDom()` / opt-in `observeNagiDom()` と、開いた全主要 Blueprint 状態の axe-core 検査を追加。axe が発見した Dropdown / Listbox / Combobox の secondary text contrast を rule 除外せず修正し、browser 28/28 を確認した。
- **2026-07-18** Phase 3.5 slice 1 を開始。`mergeNagiProps()` は class/style/event/token-list ARIA の合成、semantic conflict、live getter を検証。`eslint-plugin-nagi-ui/verified-bindings` は behavior props の適用先・native属性・直接上書き・複数binding・keyを全出荷Blueprintに対して検査する。TypeScript ESLintがTS7を読めないため、`skipLibCheck`やTS downgradeではなくvue-eslint-parser公式のtemplate-only modeを採用。
- **2026-07-18** 配布モデルを copy-first から package-first / own-on-demand へ改訂。通常は themeable package component、深い変更時だけ同一 SFC を所有する。package build と copy 元の単一ソース、Theme→小 API→少数 slot→ownership の段階、owned source の version / diff / lint / integration 保守契約を §3 に固定した。成功条件と失敗パターンは `docs/package-ownership-model.md` に記録。
- **2026-07-18** Phase 3 完了。Select は native `<select>` を stable path とし、`appearance: base-select` は progressive enhancement、`<selectedcontent>` は採用保留と決定。customizable Select 全体と `<selectedcontent>` 単体の標準化強度を分離し、Vue compiler 対応・3エンジン stable 実装・相互運用検証を昇格条件に固定した。Combobox 派生の自前 Select fallback は作らない。
- **2026-07-17** Phase 3 の Listbox + Combobox slice 完了。Combobox は input value / committed selection / provisional active option を分離し、filter で確定選択を prune しない。APG に従い popup option の候補フォーカスは `aria-selected` で表すため、§6 の `data-active` 例を Menu / Listbox に訂正した。
- **2026-07-17** §3.5「Blueprint の形態選択」を追加(owned DOM / props / items schema / slot の優先順)。compound 禁止の範囲を「ライブラリ出荷の behavior 分散タグ族」に明文化し、copy-in SFC の slot を宣言済み境界として正当化(§9 も更新)。「User owns the DOM」を「所有するコードで DOM が追える」と解釈固定。menu 系の items schema 化を Phase 2.6 として追加(blueprint-local、core 非昇格、Phase 3 と並行可)。styling-only blueprint は phase 進行と独立に追加可とした。
- **2026-07-17** Phase 2.5 完了。checkbox / radio / mixed state、任意階層の `useSubmenu` menu tree、LTR/RTL keyboard、pointer grace、nested Popover + Anchor Positioning を実装。完全な Dropdown Blueprint と利用側 SFC が Nagi CSS、unit/type/browser tests を通り、明示的 DOM + 属性注入形式を Phase 3 へ継続すると判定した。
- **2026-07-17** Phase 2.5 に Dropdown Menu の完成形検証を追加。action menu の成功だけで結論を出さず、checkbox / radio / submenu と menu tree coordination まで載せた SFC の可読性を検証してから Listbox へ進む。props contract 安定後に `mergeNagiProps`、Nagi UI 専用 lint、dev assertions を実装する Phase 3.5 も追加。
- **2026-07-16** Phase 1 完了。Dialog の non-modal open は標準 command が存在しないため `show()` fallback とし、native `cancel` は prevent 可能なまま保持。Tooltip は trigger hover / tooltip hover / focus の union とした。
- **2026-07-17** Phase 2 完了。`useMenu<Item>()` の `itemProps(item)` と ActionMenu blueprint で Vue template DX を検証。Menu の focus 戦略を `aria-activedescendant` に固定し、roving tabindex との混在を禁止した。根拠・比較・invariant は `docs/phase2-menu.md` に記録。

- **2026-07-15** リポジトリ `CHARTER.md` を正本化。§4.4 の controlled mode 実装方式を「beforetoggle preventDefault」から「双方向ミラー同期(sync flush + 冪等適用)」へ改訂 — Popover API 仕様で hide 方向の beforetoggle が cancel 不能なため。目的(4.4 の3要件)は不変。
- **2026-07-15** §7 Toast 再昇格の機構を訂正: `showModal()` が open popover を全強制クローズする(HTML 仕様)ため、「開いていたら hide→show」は成立しない。再昇格の条件は region の DOM 状態ではなく useToast 自身のモデル(生きている toast の有無)とし、top layer 同居者の open toggle で再 show する方式に改めた。実装バグとして実際に検出・修正済み。
