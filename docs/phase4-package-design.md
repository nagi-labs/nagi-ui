# Phase 4 slice 1 — Package 実体化の設計

Status: Implemented (2026-07-18). D1〜D5 はレビュー確定済み・実装済み。実装結果は末尾。

## 目的

CHARTER §0 / §3 の package-first を実装が追い越す。完了時に次が実働する。

```ts
import { DropdownMenu, Listbox, Combobox } from "@nagi-labs/nagi-ui/components"
import "@nagi-labs/nagi-ui/default-theme.css"
```

blueprints は単一ソースのまま(package build と own コピー元の分岐を作らない)。

## D1. 配布形態: raw SFC 配布(compile しない)

core は既に raw TS 配布である(`exports: "./src/index.ts"`、build なし)。component も
同じ方針で raw `.vue` を配布する。

- **単一ソースが構造的に成立する**: package が含むファイルが own コマンドのコピー元
  そのものになる。「package build と copy 元の差分」という危険信号(ownership model
  doc)は、build 産物が存在しないことで原理的に消える
- node_modules を開けば blueprint がそのまま読める(AI agent・人間の両方に効く)
- Vite / Nuxt は依存内 `.vue` を plugin-vue でそのまま compile できる
- 代償: bundler + Vue plugin の無い環境(CDN 直読みなど)を捨てる。SFC 利用者には
  既に前提なので受け入れ、「向かないケース」に記載する

## D2. パッケージ内配置: blueprints をパッケージ内へ移動

npm はパッケージルート外のファイルを含められないため、リポジトリルートの
`blueprints/` を `packages/core/blueprints/` へ移動する(git mv、履歴保持)。

```text
packages/core/
  src/            ← composable 層。CSS を一切含まない(§3 の不変条件は layer 単位)
  blueprints/     ← component 層。SFC(scoped CSS 込み)
  components.ts   ← "/components" entry(SFC の named re-export のみ)
  theme/default-theme.css ← 完全な既定 token 定義
```

exports map:

```jsonc
{
  ".": "./src/index.ts",              // composables のみ(現状維持)
  "./components": "./components.ts",  // blueprint SFC の named re-export
  "./default-theme.css": "./theme/default-theme.css",
  "./theme.css": "./theme/default-theme.css", // compatibility alias
  "./blueprints/*": "./blueprints/*"  // own コマンドと direct import 用
}
```

- **`.` に component を混ぜない(推奨案)**。理由: ①unit テストは
  `node --test` + type stripping で `.` を import しており、`.vue` を `.` の module
  graph に入れると Node 実行が壊れる。②「core 層は CSS を含まない」不変条件が
  exports 境界として見える。③tree-shaking への依存が消える。
  `docs/package-ownership-model.md` の import 例(`from "@nagi-labs/nagi-ui"`)は
  `/components` 付きへ 1 行修正する
- 対案(採らない): `.` を composable + component の facade にする。DX は 1 文字分
  良いが、Node からの core 利用と SSR ユニットテストが `.vue` loader を要求する
  ようになる
- `sideEffects` は `["**/*.vue", "*.css"]` を宣言し、使用 component の style chunk が
  aggressive shaking で落ちないようにする

## D3. Theme token 層

### 契約上の位置づけ

Nagi CSS CONTRACT は library component 内部への styling を
「props → Pass Through → **CSS custom properties** → `::part()`」の non-owned ladder に
限定しており(boundary class から `>` で内部へ降りることは禁止)、design token は
custom properties が正規経路と明記済み。theme 層は新機構ではなく **CONTRACT の既定
経路に token 語彙を与えるもの**である。

### 採用形態: 小さな semantic セット(shadcn 型 B)

比較した形態は 4 つ: ①3 層 token(Material / PrimeVue v4。primitive→semantic→
component)、②小 semantic セットのみ(shadcn)、③primitive スケールのみ
(Radix Colors / Open Props)、④component 単位 token の公開(Vuetify / AntD)。

**②を採用する。** 根拠は §3 のカスタマイズ階段(theme token → 小 props → 少数 slot
→ ownership)が②と同型であること。①④の component token 層は「ownership」の段と
役割が重複し、Nagi ではその仕事を ownership が担う。③はスケール段の直書きが
component 側に残り、色相以外のリブランドが component 編集になる。

### 運用原理(7 か条)

1. **token は「値」ではなく「役割」である。** 値の一致ではなく役割の一致で統合する
   (同じ #fff でも surface と on-accent text は別役割)。役割が **2 blueprint 以上で
   反復**して初めて token になる。1 blueprint 固有の値はその SFC の意匠として literal
   のまま置く — それを変えたい要求は ownership の領分。
2. **語彙文法を固定する。** `--nagi-<tier>-<role>[-<state>]`。tier は
   `color / font / radius / shadow / size / space` の 6 つで閉じる(space は
   2026-07-18 に density 需要の言明を受けて追加 — tier 集合の変更はこのように
   意図的な改訂としてのみ行う)。role は閉じた小集合、state 接尾辞は
   `active / disabled / muted` 程度。tier 内アルファベット順。
3. **背景役割の token は文字色との対で考える。** 背景に使う token
   (`surface` / `surface-active` 等)を差し替えるとき、その上に乗る文字 token との
   コントラストが利用者の責任になる。妥当性の機械検証は Phase 3.5 の axe suite が
   担う(themed playground を axe に通す)。命名でも対を意識し、対にならない
   飾り色を背景役割として token 化しない。
4. **fallback 禁止 + coverage test。** blueprint 側は常に
   `var(--nagi-color-text)` の形で参照する。既定値は `default-theme.css` だけに置き、
   theme 未導入や不完全な replacement theme を見た目の fallback で隠さない。manifest・
   default theme・Blueprint参照語彙の一致を unit test で検査し、replacement theme は
   `nagi-ui theme check`、実 cascade は明示的な dev warning で不足を検出する。
5. **token は ownership を生き延びる。** own した SFC も `var()` 参照を保持したまま
   コピーされるため、**ブランド変更は ownership 後も default theme + override 一式で全 component に
   届く**。owned component が theme から切り離されるのは利用者が var() を消した時
   だけで、それは意図的な離脱である。
6. **token は package の public API である。** package-first の帰結として、token 名は
   component version に紐づく互換性対象になる(schema union と同じ立場)。追加は
   §3.5 と同じ規律(実要求の頻度で昇格、投機的追加の禁止)、改名・削除は breaking
   change として扱う。
7. **命名は mode 非依存。** `white` / `light-gray` のような値ベースの名前を禁止し、
   役割名のみとする。将来の dark / multi-theme は同じ token 名への別値供給
   (`[data-nagi-theme="dark"]` 等)で受け、語彙の変更を伴わない(将来スライス)。

### 導出手順(実装時にこの順で棚卸しする)

1. 全 blueprint の `<style>` から literal 値を列挙する
2. 各出現に**役割**を割り当てる(値ではなく用途で分類)
3. 2 blueprint 以上で反復する役割だけを残し、同役割の値ゆらぎを統合する
   (例: muted 系灰色が現在 #667d84 / #5d7279 / #50676f / #526970 の 4 種混在 →
   1〜2 役割へ正規化。これは事実上の色の棚卸しでもある)
4. 文法(原理 2)で命名し、背景役割は文字対(原理 3)を確認する
5. blueprint を fallback なしの `var()` へ置換、`default-theme.css` に既定値を定義し、
   manifest / default / 参照語彙の coverage test を追加する

目安は 16〜25 個。現行の反復値からは
color(text / text-muted / text-disabled / accent / surface / surface-active /
border / focus-ring / danger)、radius(control / overlay)、shadow(overlay)、
size(control)、font(detail)程度に収まる見込み。

### nagi-css との関係

§3 の表は theme の配布を「Nagi CSS package」と置いているが、nagi-css 側に token 仕様が
存在するまでは **token 語彙の定義と default theme.css を nagi-ui package に置く**。
nagi-css が contract preset として token 検査(未定義 token 参照の lint 等)を持った
時点で語彙の正本を移管する。cross-repo 調整をこのスライスの blocking にしない。

## D4. own metadata(このスライスでは実装しない)

raw SFC 配布により own は「node_modules の同一ファイルをアプリへコピーし、
`@nagi-source <component>@<version>` を刻印して import を切り替える」操作に還元される。
metadata 形式と CLI は slice 2 で実装検証とともに固定する(ownership model doc の
「実装検証を経ずに固定しない」に従う)。

## D5. 実装時の変更点と検証

変更:

- `git mv blueprints packages/core/blueprints` + 参照更新(playground labs、tests、
  `.sandbox/nagi.config.mjs`、`eslint.nagi.config.mjs`、docs のパス)
- `src/components.ts` 新設、`package.json` exports / files / sideEffects 更新
- blueprint CSS の token 置換 + `theme/default-theme.css` 新設
- playground labs の import を相対パスから `@nagi-labs/nagi-ui/components` へ切替
  (**playground が package 消費経路の実証になる**)

検証(すべて既存インフラで機械検証可能):

1. unit / typecheck / `test:integration` / `nagi-css check` が green のまま
2. browser suite 28/28 が green のまま(labs は package 経由 import に切替済みの状態で)
3. theme 実証: playground に token を数個上書きする「themed」セクションを追加し、
   **ownership なしでブランド変更が完了する**ことを axe 込みで確認(Button 実験の前哨)
4. default theme 未 import / 不完全 replacement theme の token 不足を CLI と明示的な
   dev diagnostic が列挙すること

## 決定事項(2026-07-18 レビュー確定)

1. exports は `/components` 分離(D2 推奨案)を採用
2. theme token は小 semantic セット(形態②)+ 上記 7 か条の運用原理で設計する
3. `blueprints/` はリポジトリルートから `packages/core/blueprints/` へ移動(D2 の dir 設計どおり)

## 実装結果(2026-07-18)

- 出荷 component は `Button` / `DropdownMenu` / `Listbox` / `Combobox` の 4 つ
  (+ schema 型)。`ActionMenu` と phase 0 の popover Dropdown は phase 検証用の
  歴史的 blueprint として残置し、`/components` から export せず token 化もしない
- **命名規則(2026-07-22改訂)**: SFC filename と公開exportは `Button.vue` / `Button`
  のように製品名をそのまま使い、library namespaceをfilenameへ混ぜない。surface
  rootは Nagi CSS の厳密な `surfaceRootPrefixes: ["n-"]` 契約により
  `n-` + filename kebab (`Button.vue` → `.n-button`)へ一意に導出する。bare
  `.button` とfilename不一致の`.n-control`はどちらもlint errorとなる
- token は導出手順の結果 **22 個**(color 10 / font 2 / radius 3 / shadow 2 /
  size 1 / space 4)。`--nagi-color-danger` は予告どおり Button(第 2 使用者)の
  登場で昇格した。棚卸しで muted 系文字色 3 値(#50676f / #526970 / #61777e)を
  `--nagi-color-text-muted` に、hover/active 背景 2 値(#e5f1f4 / #edf5f7)を
  `--nagi-color-surface-active` に統合した
- **space tier(density)**: `surface-inset` / `item` / `item-gap` / `control` の
  4 role。control 余白 2 値(trigger 0.5/0.8rem、input 0.55/0.7rem)と combobox
  item 余白(0.4/0.6rem)を正規化した。**density は乗数 token ではなく、
  space/size token 群を一括上書きする theme preset として表現する** —
  `calc()` の全面導入は可読 CSS の契約に反し、単一乗数では余白と tap target を
  独立に調整できないため。menu 専用の余白(category label、separator)は
  原理 1 どおり literal のまま
- **原理 1 をそのまま適用した結果、`danger`(menu のみ)と `separator`(menu のみ)は
  token 化していない。** どちらも第 2 の使用 component(Button 実験、将来の
  ContextMenu 等)が現れた時点での昇格第一候補
- manifest ↔ default theme ↔ Blueprint参照語彙の parity と、Blueprint fallback 不在は
  `tests/theme-parity.test.ts` が機械検証する
- playground は package 消費経路の実証に切替済み(labs は
  `@nagi-labs/nagi-ui/components` を import、全 component lab は `default-theme.css` を読み、
  「Themed」セクションが token 上書きだけのブランド変更を実演。popover は
  Teleport されないため custom property が開いた menu tree へそのまま継承される)
- 検証: unit 89/89(parity 3 件含む)、typecheck、`test:integration`、
  `nagi-css check` clean、labs 3 種の SSR 実行 OK。browser suite は themed
  axe 検査を含め 29/29 green(2026-07-21 実行)

### Slice 4 token promotion (2026-07-21)

初期22 tokenに対し、AlertとBadgeで2 component反復が成立したpositive / warning
foregroundとaccent / positive / warning / danger surfaceの6 roleを追加し、現在は
28 token。値が一致する`surface-accent`と`surface-active`も役割が異なるため統合せず、
theme public API上で別名を維持する。詳細は`docs/phase4-blueprint-catalog.md`。

### Theme contract revision (2026-07-21)

初期実装の「各 `var()` に literal fallback を持たせて theme import を optional にする」
方針は廃止した。fallback は欠落 token を視覚上だけ埋め、custom theme の不完全さを出荷前に
発見しにくくするためである。現在は `default-theme.css` を明示 import する。完全置換を選ぶ
場合は `nagi-ui theme check` を CI gate にし、必要なら
`warnMissingNagiThemeTokens()` で実 cascade を開発時に検査する。旧 `/theme.css` export は
互換 alias として同じ既定ファイルを指すが、正規名ではない。

## Release invariant

`packages/core/package.json` の version を変更した直後、tag / publish より前に
`vp run test` を必ず実行する。CLI marker が installed version を読むため、version
bump 下でのみ露見する fixture の直書きや ownership status の退行をここで捕捉する。
