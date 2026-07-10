# UI_SHELL_API — M18共通殻の契約(委譲時必読・正典)

実装: `src/ui/layout/shell.tsx` / CSS: `src/index.css` 末尾「M18 共通殻」節。
本書はP3/P5委譲エージェントへの**横断契約**である。逸脱(独自クラス発明・個別SFX配線・独自モーダル実装)は受入で弾く。

## 1. SFX(クリック音)契約 — 最重要
音は `main.tsx attachUiClickSfx()`+`App.tsx` の委譲リスナーが**クラス名で**付与する。個別配線は禁止。
- 音が鳴るクラス: `.btn`(汎用)/`.cmd-btn`(戦闘)/`.node-btn`/`.god-card`/`.region-card`/`.char-card.clickable`
- **新しい操作要素は必ず `.btn`(+修飾)を持たせる**。新クラスを発明して無音にしない。
- タブは `.btn .btn-ghost .filter-tab`(+`.active`)を使う — WorkspaceTabsが既に守っている。

## 2. BGM track map 契約
新しい Screen id を追加したら **App.tsx の track switch に必ず追加**する(漏れると default='none'=無音事故)。
作業画面(forge/facilities/familytree等)は `'home'` トラックに載せる。

## 3. 戻る導線契約
goBackスタックは存在しない。独立画面は `ScreenShell onBack={() => setScreen({ id: 'home' })}` を明示配線し、
実測(クリック→homeに戻る)まで受入に含める。

## 4. コンポーネントAPI(props正確に)
```tsx
import { ScreenShell, ActionDock, Sheet, WorkspaceTabs, StatusCallout, LiveBadge, EmptyGuide, CompareRow, LifeThread } from './layout/shell'

<ScreenShell title="鍛冶と蔵" onBack={...} resources={<>奉燈 <b>{hoto}</b></>}
  tabs={<WorkspaceTabs tabs={[{key:'buy',label:'購う',badge:2}]} active={tab} onChange={setTab} />}
  dock={<ActionDock note="奉燈があと12足りない"><button className="btn btn-main">装備する</button></ActionDock>}
>{本文}</ScreenShell>

<Sheet title="静養する" onClose={...} closeLabel="やめる">…</Sheet>
// Sheet内蔵: ESC閉/背景クリック閉/フォーカス復帰/Tabトラップ/body scroll lock。入れ子禁止。

<StatusCallout kind="crisis" title="血脈危機 — 後継なし" action={<button className="btn">星契りへ</button>}>
  当主の灯はあと3月。次代を残せ。
</StatusCallout>  // kind: crisis(朱・危)/boon(命火・好)/info(金・報)

<LiveBadge count={n} />          // n が 0/undefined なら何も描画しない
<EmptyGuide text="まだ何もない" actionLabel="出立へ" onAction={...} />
<CompareRow label="攻" before={12} after={20} />   // 差分は +8 を命火/−を朱で自動表示
<LifeThread nodes={[{lit:true},{lit:true},{lit:false}]} orientation="horizontal" />
```

## 5. 文言契約(2.4/6.1)
- 独立画面の戻る=「郷へ戻る」/ モーダル閉=「閉じる」/ 選択取消=「やめる」/ 実行取消=「実行しない」
- 同じ操作は入口/CTA/完了トーストで同じ語。トーストは `emitToast(msg, kind)`(src/ui/toast.ts、kind: info/error/codex/region)。

## 6. 視覚トークン(3.1-3.3 抜粋)
- 金`--gold`=見出し/当主/確定のみ。命火`--sel`=選択/推奨/命脈。朱`--ember-text`=危機/失敗(文字は--emberでなく--ember-text)。
- 文字: 画面題`--fs-title`/節`--fs-sub`/本文`--fs-body`。**重要文字12.5px未満禁止**(無効理由・費用・残寿命・HP/MP)。
- 余白は 4/8/12/16/24/32 のみ。タッチ44px。
- 選択状態=色+2px枠+◆印(index.css既存 `.selected` 規範)。色だけで伝えない。

## 7. 大量一覧契約(5.5/5.10)
810件級を一度にDOMへ描画しない。カテゴリ/フィルタ+「さらに表示」(50件刻み)を既定とする。仮想化ライブラリは導入しない(KISS)。

## 8. 受入の自己検証(委譲エージェント必須)
`npx tsc -b` 緑 + `npx oxlint src` 0 を自分で実行してから返す。
禁止: ゲームロジック(store/core)の変更(表示用の純関数追加は可)・新規画像参照・index.cssの既存行編集(追記のみ)。
