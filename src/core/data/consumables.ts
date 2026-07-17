// M28-C: 消耗品(回復薬)。装備(Item/ItemSlot)とは完全に別系統 — セーブ上は
// GameData.consumables(ConsumableStack[])に積む。装備一覧/鍛冶/打ち直し/形見/家宝/継承の
// どのコードパスにも入らない(devil指摘のセーブ破損地雷を構造的に回避)。
// 効果は戦闘の performAction('item') が適用し、在庫の増減は store が行う(battle.tsは純粋に保つ)。

export type ConsumableEffect =
  | { stat: 'hp'; amount: number; scope: 'one' | 'party' } // 傷を癒す(体力)
  | { stat: 'mp'; amount: number; scope: 'one' | 'party' } // 灯力(ともしび)を注ぐ

export interface ConsumableDef {
  id: string
  name: string
  desc: string
  price: number // 奉燈(hoto)
  effect: ConsumableEffect
  icon: string // 表示用の字(絵文字1字。素材追加まではこれで足りる)
  unlockFame?: number // M33 ⑮: 解禁武功。未設定=0=開始直後から購入可。上位薬は進度(武功)で解禁する。
}

// M33 ⑮: 装備15段・敵tier4+ボス(hp2150)に対し、旧は回復薬4種(hp60/165・mp45・party75)が無段階だった。
// 上位tier(hp360・mp120・party180)を追加し、進度(unlockFame)で解禁して装備の伸びに追随させる。
// party回復は割高(乱用を抑える)。序盤の3種(洗い草/練り膏/灯明油)は解禁武功0=最初から手が届く。
export const CONSUMABLES: ConsumableDef[] = [
  {
    id: 'araigusa',
    name: '洗い草',
    desc: '郷はずれに生える素朴な傷薬。誰か一人の傷を癒す。',
    price: 22,
    effect: { stat: 'hp', amount: 60, scope: 'one' },
    icon: '🌿',
  },
  {
    id: 'neri_kou',
    name: '練り膏',
    desc: '薬狩りが幾種もの草を練り上げた上等の傷薬。深手にも効く。',
    price: 58,
    effect: { stat: 'hp', amount: 165, scope: 'one' },
    icon: '🧴',
  },
  {
    id: 'tomoshi_abura',
    name: '灯明油',
    desc: '尽きかけた灯力(ともしび)を注ぎ足す澄んだ油。',
    price: 30,
    effect: { stat: 'mp', amount: 45, scope: 'one' },
    icon: '🪔',
  },
  {
    id: 'hoshi_shizuku',
    name: '星の雫',
    desc: '星神の慈悲を宿した秘薬。一族みなの傷を癒す。惜しみて使え。',
    price: 145,
    effect: { stat: 'hp', amount: 75, scope: 'party' },
    icon: '💧',
  },
  // ---- M33 ⑮: 進度で解禁される上位薬 ----
  {
    id: 'mantou_yu',
    name: '満灯油',
    desc: '尽きた灯力(ともしび)を大きく満たす上等の油。',
    price: 95,
    effect: { stat: 'mp', amount: 120, scope: 'one' },
    icon: '🕯️',
    unlockFame: 100,
  },
  {
    id: 'bankin_kou',
    name: '万金膏',
    desc: '万金に値する秘伝の傷薬。深い手傷も瞬く間に塞ぐ。',
    price: 130,
    effect: { stat: 'hp', amount: 360, scope: 'one' },
    icon: '🏺',
    unlockFame: 150,
  },
  {
    id: 'ooshizuku',
    name: '大星の雫',
    desc: '星神の大慈悲を宿した秘薬。一族みなの深手を癒す。惜しみて使え。',
    price: 360,
    effect: { stat: 'hp', amount: 180, scope: 'party' },
    icon: '🌟',
    unlockFame: 250,
  },
]

const BY_ID: Record<string, ConsumableDef> = Object.fromEntries(CONSUMABLES.map((c) => [c.id, c]))

export function consumableById(id: string): ConsumableDef | undefined {
  return BY_ID[id]
}
