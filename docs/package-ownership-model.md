# Package-first / own-on-demand 配布モデル

Status: Architecture decision (2026-07-18).

## 一言定義

Nagi UI の完成形は「PrimeVue の導入体験 + shadcn の所有権」である。

普段は themeable な npm component として使い、theme token と小さな API
で足りなくなった component だけ source ownership へ移る。

```ts
import { DropdownMenu, Listbox } from "@nagi-labs/nagi-ui/components"
import "@nagi-labs/nagi-ui/default-theme.css"
```

```sh
vp exec nagi-ui own dropdown-menu
```

後者は概念上、次のような source 一式を利用者のリポジトリへコピーする。

```text
src/components/nagi/dropdown-menu/
  DropdownMenu.vue
  DropdownMenuItem.vue
  DropdownSubmenu.vue
  dropdown-schema.ts
```

以後は local import に切り替え、利用者と coding agent が SFC を直接変更する。

## なぜhybridなのか

copy-first は所有権が明快だが、変更しない大多数の利用者にも source 管理を要求し、
導入と更新のコストを上げる。package-only は更新が容易だが、深いカスタマイズ要求を
props、slots、render props、pass-through API として永久に公開し続ける必要がある。

Nagiは両者の境界を次の順序に固定する。

1. **Theme token** — 色、spacing、radius、typography、shadow、control size、state appearance
2. **小さなprops / items schema** — 文字列、真偽、列挙、同型項目
3. **宣言済みの少数slot** — 本当に自由なmarkupだけ
4. **Source ownership** — DOM構造、特殊要素、behavior連携を変える要求

avatar、router-link、特殊レイアウト等を安定DSLへ足し続けず、「そこから先はsourceを
所有する」と言えるため、package版のAPIを小さく保てる。

## 単一ソース原則

package版とownership版を別々に実装してはならない。

```text
packages/core/blueprints/dropdown/DropdownMenu.vue
                 ├─ package component build
                 └─ own command copy source
```

behavior、a11y、browser workaround、markup、default stylingの修正は常に同じSFCへ入る。
二重管理を許すと「package版は直ったがcopy元は壊れた」という最悪の分岐が生まれる。

## Nagiが提供する保証の境界

package利用中のstylingはtheme tokenとcomponentのpublic API(props / 宣言済みslot)まで
とする。package componentのrootはNagi CSS契約上のUI library boundary classであり、
内部DOMへのconsumer CSSはboundary越えのdescendant step + 宣言を要する構造で、
契約が「そこはあなたの所有物ではない」と示している。内部のmarkupやselectorを
直接styleしたくなった時点が、theme token追加要求かsource ownershipへの移行点である。

package利用中は通常のversion updateで修正を受け取れる。ownership後はlocal sourceが
優先されるため、自動更新されない。この逆転は、複雑で修正が重要なcomponentほど
ownershipされやすい点で危険になる。

したがってownership機能は、最低でも次を一組として設計する。

- source fileにコピー元componentとversionを記録するmetadata
- installed/upstream sourceとの差分を確認する`diff` workflow
- breaking releaseごとに、そのversionで必要な手順を案内するmigration note
- Nagi CSS lintとNagi UI behavior lint
- keyboard/focus/form/a11y integration test recipe

一般的なmigration engineを先に作るのではなく、breaking changeを出すreleaseが必要な
migration noteを同梱する。v0には移行対象となる過去のbreaking releaseはない。日常の
upstream追従は`diff`とconsumer testで検出し、version固有の手順が発生した時点でrelease
noteを保守契約へ追加する。

metadata形式は Phase 4 slice 2 の実装検証を経て次の形へ**固定済み**
(詳細は `docs/phase4-ownership-cli.md`):

```html
<!-- @nagi-source dropdown-menu/DropdownMenu.vue@0.4.0 -->
```

`nagi-ui own` がコピー時に刻印し、`nagi-ui diff` が clean / modified / drifted /
unknown-source を判定して CI gate に使える exit code を返す。

## Deferred design: `vue` / `all` ownership layers

Status: **設計固定、実装延期** (2026-07-22)。component catalog拡充を優先し、
composable ownershipの具体的需要が観測されるまで次スライスとして着手しない。

behavior を小さな composable に隠しても、所有者が必要な層だけを選べるようにする。ただし
初期 surface は利用頻度が高い次の2段に絞り、`composable-only` は実需要が観測されるまで
出荷しない。

- `own <component> --layer vue`: SFC と component-local な schema / style をコピーする。
  behavior は package 版を使い続ける
- `own <component> --layer all`: 上記に加え、その component の behavior dependency closure
  をコピーする

owned SFC の import を昇格時に機械書換えしてはならない。`vue` ownership の時点で、SFC は
生成された component-local routing module（例: `behavior.ts`）だけを import する。
`behavior.ts` は最初は package composable を1行 re-exportし、`vue` → `all` の昇格時は
owned composable を re-exportする内容へ置き換える。したがって利用者が編集済みの `.vue`
には触れず、変更は生成ファイルだけに閉じる。

canonical SFC / composable と routing module は同じ provenance 単位として扱わない。前者は
upstream diff の対象、後者は layer から決定的に再生成できる adapter である。sidecar の
`nagi.lock.json` に少なくとも component、layer、package version、source path、各 source の
SHA-256を記録する。hash は「何をコピーしたか」の照合には使えるが、3-way merge の base
本文を復元できない。exact package source の取得または base snapshot を別途設計するまで、
既存の「`own` 直後に即コミットして git 履歴を base にする」手順は必須のままとする。

この構造は `composable-only` の将来追加を妨げない。自分でDOMを書くが標準 behavior で
よい利用者は package composable を直接 import できるため、先に3層目を出して CLI・dependency
closure・test matrix を増やさない。

### Owned sourceのsurface namespace

canonical SFCは `Button.vue` のようにfilenameへlibrary名を混ぜず、root classを
`.n-button` とする。Nagi CSSはprefixを単なる`startsWith` escape hatchにせず、
`surfaceRootPrefixes` + filename kebabの完全一致として検査する。したがって
`Button.vue`でbare `.button`や`.n-control`は不正である。

package componentとして使うだけならconsumer presetのboundary classで完結する。
`own`したSFCをNagi CSSで検査するconsumerは、自身のsurface prefixと合わせて
`nagiUiSurfaceRootPrefixes`を外部configへ追加する。

```js
import nagiUi, {
  nagiUiSurfaceRootPrefixes,
} from "@nagi-labs/nagi-ui/nagi-css-preset"

export default {
  semantic: {
    ...nagiUi,
    surfaceRootPrefixes: ["app-", ...nagiUiSurfaceRootPrefixes],
  },
}
```

複数prefixは異なるowned namespaceを同じrepoで検査するための候補であり、任意の
suffixを許可しない。各候補ともfilenameとの完全一致が必要である。

## 狙いが外れるパターン

### 1. package利用者にもcopy利用者にも選ばれない

packageとしてはPrimeVueよりcomponent・slot・デザイン完成度が不足し、ownership用途では
shadcn-vue / Reka UIより事例と既知語彙が少ない、という中間状態になり得る。

対策は「なぜ既存ライブラリではなくNagiか」を一文で説明できること。候補は、
「通常は隠れているが、必要になった瞬間にWeb標準語彙のSFCを完全所有できる」である。

### 2. ownした瞬間に保証が消える

最も本質的なリスク。難しいDropdown / Combobox / Dialogほどownership後のa11y・browser
修正が必要になる。diff、migration、lint、integration testが実用水準でなければ、
ownershipは保守不能なforkである。

### 3. Themeとownershipの間が崖になる

avatar、trigger差し替え、router-link、option description程度でSFC一式のownershipが
必要なら重すぎる。逆に全部を公開APIへ入れるとPrimeVue型の巨大surfaceになる。

要求頻度を観測し、少数の高頻度要求だけをprops / schema / slotへ昇格させる。将来あるかも
しれない要求のためにescape hatchを増やさない。

### 4. owned Blueprintが実際には読みにくい

recursive renderer、schema変換、composable、submenu coordination、CSS contract、lint規則を
追うために多数のファイルを横断するなら、「ブラウザ表示とSFCが近い」という価値は弱まる。

所有単位ごとに、変更対象までに読むファイル数と変更diffを計測する。内部ファイル分割は
runtime都合ではなく、利用者とagentの局所変更可能性を基準に評価する。

### 5. Web標準への委譲が製品要求に負ける

細かなdismiss policy、任意のtop-layer順、desktop/mobile完全統一などが主要要求なら、
利用者はNagiの委譲を思想ではなく機能不足と評価する。その市場にはReka / Base UI型の
全JS実装を案内し、Nagi内部で再実装しない。

### 6. 「AIに扱いやすい」が差別化にならない

AIはRadix / React Aria / shadcnを大量に学習している。Nagiのschema、CSS contract、own
workflow、専用lintも新規語彙である。単純そうという印象ではなく比較実験で検証する。

## 早期検証

代表3componentでモデル全体を検証する。

| Component | 検証する境界 |
|---|---|
| Button | theme tokenだけで通常のブランド変更が完了するか |
| Dropdown | avatar / router-link追加でownershipが局所的か |
| Combobox | behavior変更後もupstream保証へ追従できるか |

人間と知識を与えていないcoding agentの双方について、次を計測する。

- task完了率とbehavior regression数
- 読んだファイル数、変更ファイル数、diff行数
- Nagi lint / browser testsが変更ミスを検出した割合
- package API追加なしで要求を満たせた割合
- upstream更新をowned sourceへ取り込む時間

## 危険信号

- 最初の実用的な変更でほぼ全利用者がownする
- owned sourceがcore / browser修正へ追従できない
- package版へのprops / slot / pass-through追加要求が増え続ける
- BlueprintよりReka UIのコードをagentが正確に変更する
- theme tokenが増え続けて独自CSS言語になる
- package buildとcopy元に差分が生じる

Nagiの成功条件は「copyできる」ことではない。

> 普段は所有しなくてよく、所有しても壊れたまま取り残されない。
