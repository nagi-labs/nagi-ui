# Nagi UI が向かないケース

Status: Phase 4 consumer guidance (2026-07-21).

Nagi UI は、ブラウザ標準へ振る舞いを委譲することで、少ない独自語彙と
hydration 前から働く HTML を得る。その代わり、ブラウザの状態機械をライブラリ側で
置き換えない。この文書は、その交換条件がプロダクト要件と合わない場面を先に判定する
ためのガイドである。

Nagi UI を採用するかどうかはアプリ全体で一度だけ決める必要はない。Nagi は必須の
provider、portal root、グローバル状態を持たないため、**要件が衝突する component だけを
別ライブラリに任せてよい**。Reka UI / Base UI 型の全 JS 実装や、Vaul / Motion 型の専用
runtime との混在は失敗ではなく、component ごとに適切な状態機械を選んだ結果である。

## 先に見る判断表

| 要求 | 判定 | 推奨する境界 |
|---|---|---|
| theme token、小さな props / schema で足りる | Nagi package を使う | 通常の package update を受け取る |
| DOM 構造、項目レイアウト、framework node を変えたい | ownership 候補 | `nagi-ui own` で SFC を所有し、標準の振る舞いは core に残す |
| dismiss、top layer、focus、gesture を UA と異なる状態機械にしたい | Nagi に向かない | その component だけ別ライブラリへ任せる |
| browser 間で見た目と挙動を完全に同一化したい | Nagi に向かない | platform 委譲ではなく全 JS 実装を選ぶ |
| CSS の entry / discrete transition で十分 | Nagi が適する | native state selector と CSS を使う |
| spring、interruptible exit、swipe / snap が製品要件 | Nagi に向かない | Motion / gesture 専用 runtime を選ぶ |

重要なのは、**source ownership は DOM と integration の変更手段であって、ブラウザの
状態機械を交換する手段ではない**ことだ。次の hard constraint は、SFC を own しても
解消しない。

## 別ライブラリを選ぶべき hard constraint

| 必須要件 | Nagi で満たせない理由 | 選択の目安 |
|---|---|---|
| 「外側 click では閉じるが Escape では閉じない」など、event ごとの dismiss policy | light dismiss は UA が所有し、Nagi が選ぶ粒度は `popover="auto/manual/hint"`。`manual` へ落として dismiss 状態機械を再実装することは設計上禁止 | event cancellation API を持つ Reka UI / Base UI 型の overlay を使う |
| overlay の重なりを任意の `z-index` やアプリ独自 priority で制御 | top layer の順序は open 順であり `z-index` では変更できない。Toast の再昇格は既知の Dialog 共存問題への限定対処で、汎用 stack manager ではない | portal と stack manager を所有するライブラリへ、その overlay 群をまとめて任せる |
| backdrop 内に button、menu、drag handle などの interactive DOM を置く | `::backdrop` は pseudo-element であり、子 DOM を持てない | 実 DOM の overlay layer を描画する実装を使う。単なる click-to-dismiss なら native backdrop のままでよい |
| legacy browser 対応、UA bug のライブラリ patch、全 browser で完全に同じ挙動 | Nagi は Popover / Dialog / Invoker Commands 等の UA 実装を正とする。evergreen browser が前提で、挙動差を独自 runtime で上書きしない | support matrix を固定し、振る舞いを JS で所有するライブラリを選ぶ |
| trigger と popup の id reference を異なる Shadow Root 間に張る | `popovertarget` / `aria-controls` の idref 配線は Shadow Root を越えない。v1 は Reference Target 等の標準化待ち | 同じ root に配置するか、shadow boundary を前提に配線を所有する実装を使う |
| exit 完了まで mount を保持する Motion 級 orchestration、spring、途中で反転できる animation | native popover / dialog の表示切替と `v-if` / AnimatePresence 型の lifecycle は同じ状態所有モデルではない。Nagi の正規経路は CSS transition | exit lifecycle を必須契約にする component は Motion 対応 runtime に任せる |
| swipe-to-dismiss、drag 中断、velocity、snap point を持つ Drawer / bottom sheet | pointer gesture の連続状態に native owner がなく、実装には gesture runtime と独自 dismiss coordination が必要 | Vaul / vaul-vue 型の sheet をその component だけ使う。静的な side panel は Nagi Dialog の styling でよい |
| rich option、複雑な trigger rendering、全 engine で同一外観を保証する Select | Nagi の stable path は native `<select>`。`appearance: base-select` は progressive enhancement であり、`<selectedcontent>` も stable Blueprint の前提にしない | native Select の制約が製品要件に反するなら Reka UI / Base UI 型の Select を使う。free-form 入力なら Select ではなく Combobox / Autocomplete の意味論も再確認する |
| dependency 内の raw Vue SFC を compile できない build / CDN-only 環境 | Nagi package component と own 元は同じ raw `.vue` を配布する。Vue SFC を扱う bundler / plugin が配布契約の一部 | core composable だけを使って caller DOM を書くか、事前 compile 済み component を配る別製品を選ぶ |

これらを Nagi core の option や mode として増やすと、ブラウザ委譲と独自状態機械が同じ
component に共存する。分岐の数だけ keyboard、focus、dismiss、SSR の組み合わせが増え、
Nagi を小さな platform layer に保つ利点が消える。そのため「技術的にコードを書けるか」
ではなく、「Nagi の状態所有モデルのまま満たせるか」で判断する。

## 可能だが高コストな要求

次は絶対に不可能とは限らないが、標準 package API に取り込むと Nagi らしさを失いやすい。
一回きりなら ownership、複数プロダクトで反復する behavior なら専用 component / 別ライブラリ
を検討する。

| 要求 | 先に試すこと | 撤退条件 |
|---|---|---|
| browser 固有差を細部まで吸収する | feature detection と progressive enhancement。非対応時は native rendering へ戻す | fallback ではなく独自 widget の再実装が必要になったら別ライブラリ |
| complex overlay 同士を独自 priority で協調する | native top layer の open 順で要件を満たせるか確認 | global overlay manager / portal root が必要なら Nagi の担当外 |
| 高度な animation を一部だけ足す | `:popover-open`、`[open]`、`@starting-style`、discrete transition で表す | JS が visibility と mount lifecycle の真実になるなら Motion 側へ委譲 |
| native Select の外観を深く変える | native `<select>` と progressive enhancement で許容できる範囲を確認 | rich DOM と cross-engine pixel identity が必須なら custom Select |
| framework 固有 renderer を Blueprint 内へ入れる | `nagi-ui setup` の標準 `<a href>` / `<img>` adapter で足りるか確認 | `<RouterLink>` custom slot、`<NuxtPicture>` art direction 等、実 component が必要なら ownership または caller markup |

高コストな要求を package props、slot、pass-through API で一般化しない。実利用から複数回
観測され、なお platform vocabulary のまま表せる場合だけ公開 API への昇格を検討する。

## Ownership が適するケース

ownership が適するのは、状態機械ではなく**利用者が所有すべき構造と integration**を変える
ときである。

- Dropdown item に avatar、description、permission 表示を加える
- items schema にアプリ固有 node を局所追加する
- `<RouterLink>` / `<NuxtLink>` の custom slot や active-class rendering を使う
- `<NuxtImg>` / `<NuxtPicture>` の placeholder や art direction を使う
- Card / Dialog の anatomy、markup、declared slot をプロダクト固有に変える
- component 固有の CSS を semantic theme token の範囲より深く変える

own 後も `usePopover` / `useMenu` 等へ標準 props を渡し、keyboard・focus・dismiss の責務は
core / UA に残す。`nagi-ui diff`、Nagi UI lint、Nagi CSS lint、real-browser test を継続し、
upstream の a11y / browser 修正を取り込む。3-way merge の base を残すため、`own` 直後の
無変更 source は必ずコミットする。詳細は [ownership CLI](./phase4-ownership-cli.md) と
[package-first / own-on-demand model](./package-ownership-model.md)を参照。

反対に、own 後の変更が Teleport、custom focus trap、独自 light dismiss、native state と
重複する `data-state`、core 内の animation runtime を必要とするなら、ownership の範囲を
越えている。その component は別ライブラリへ任せる。

## 混在時のルール

1. **1つの surface に1つの状態 owner。** 同じ popup へ Nagi と別ライブラリの open / focus /
   dismiss props を同時に結線しない。
2. **component 境界で分ける。** 例: Dropdown は Nagi、gesture Drawer は Vaul 型実装、rich
   Select は Reka UI 型実装、と分離する。
3. **見た目は token で揃える。** 状態機械を統一するために全 component を同じライブラリへ
   寄せる必要はない。別 component の theme を Nagi の semantic token へ対応付ける。
4. **overlay stack は混在テストする。** native top layer と portal overlay を同時に開き、
   visual order、focus return、Escape、screen reader name を real browser で確認する。
5. **ownership と外部 component を二重に使わない。** 外部 runtime を採る surface では、Nagi
   Blueprint を wrapper として残さず、そのライブラリに DOM と behavior を一貫して任せる。

## 最終チェック

次のいずれかが必須なら、その component には Nagi UI を選ばない。

- UA と異なる dismiss / focus / stack の状態機械
- interactive backdrop または portal 前提の DOM layer
- interrupted gesture、spring、exit lifecycle が機能要件
- legacy browser patch または全 engine での挙動・外観の完全同一化
- Shadow Root を越える idref 配線
- native Select では表現できない rich option / trigger を stable path として保証

一方、要求が DOM 構造、項目表示、framework integration、component 固有 CSS に留まるなら、
Nagi を捨てる前に source ownership を選ぶ。境界は「カスタマイズが深いか」ではなく、
**変更したいものが DOM か、状態機械か**で決まる。
