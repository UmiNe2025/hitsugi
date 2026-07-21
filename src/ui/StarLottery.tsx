import { useMemo, useRef, useState } from 'react'
import { GODS, godById } from '../core/data/gods'
import { useGame } from '../core/store'
import { GOD_RANK_LABELS } from '../core/types'
import type { GodRank } from '../core/types'
import {
  earnedStarLotteryDraws, isStarLotteryUnlocked, migrateStarLottery, remainingStarLotteryDraws,
  STAR_LOTTERY_RATES,
} from '../core/star_lottery'
import { gameImg } from './img'
import './star_lottery.css'

const RANKS: GodRank[] = [1, 2, 3, 4]

export function StarLotteryScreen() {
  const data = useGame((state) => state.data)!
  const setScreen = useGame((state) => state.setScreen)
  const draw = useGame((state) => state.drawStarLottery)
  const [confirming, setConfirming] = useState(false)
  const [requestId, setRequestId] = useState('')
  const [message, setMessage] = useState('')
  const drawing = useRef(false)
  const lottery = migrateStarLottery(data)
  const unlocked = isStarLotteryUnlocked(data)
  const remaining = remainingStarLotteryDraws(data)
  const latest = lottery.history[0]
  const owned = useMemo(() => new Set(lottery.cards), [lottery.cards])

  const prepare = () => {
    if (!unlocked || remaining <= 0) return
    setRequestId(`star:${data.seasonIndex}:${lottery.drawsUsed + 1}:${Date.now().toString(36)}`)
    setConfirming(true)
    setMessage('')
  }
  const confirm = () => {
    if (drawing.current || !requestId) return
    drawing.current = true
    const result = draw(requestId)
    drawing.current = false
    setConfirming(false)
    setRequestId('')
    setMessage(result ? (result.newGodIds.length ? '新しい星札が家譜へ加わった。' : `重なった縁が+${result.affinityGained}深まった。`) : '今は籤を引けない。')
  }

  return (
    <main className="screen star-lottery-screen">
      <header className="star-lottery-hero">
        <div>
          <p className="star-lottery-kicker">武功が招く、課金なき星の縁</p>
          <h1>星籤</h1>
          <p>初帰還で一籤、以後は累計武功50ごとに一籤。武功は消費しない。</p>
        </div>
        <button className="btn btn-ghost" onClick={() => setScreen({ id: 'home' })}>郷へ戻る</button>
      </header>

      <section className="star-lottery-status" aria-label="星籤の状況">
        <div><span>星札</span><strong>{lottery.cards.length}<small> / {GODS.length}</small></strong></div>
        <div><span>残り籤</span><strong>{remaining}<small> / 累計{earnedStarLotteryDraws(data)}</small></strong></div>
        <div><span>未所持保証</span><strong>あと{10 - lottery.drawsUsed % 10}回</strong></div>
        <div><span>極ツ星天井</span><strong>あと{50 - lottery.drawsUsed % 50}回</strong></div>
      </section>

      {!unlocked ? (
        <section className="star-lottery-locked">
          <h2>星籤は、最初の帰還を待っている</h2>
          <p>一度、夜藪から郷へ帰ると星々があなたの武功を見つける。</p>
        </section>
      ) : (
        <section className="star-lottery-draw" aria-labelledby="star-draw-title">
          <div>
            <p className="star-lottery-kicker">次は第{lottery.drawsUsed + 1}籤</p>
            <h2 id="star-draw-title">星の文を、一枚ひらく</h2>
            <p>10回ごとに未所持保証。20回ごとに上つ星以上、50回ごとに極ツ星。</p>
          </div>
          {!confirming ? (
            <button className="btn btn-main" disabled={remaining <= 0} onClick={prepare}>
              {remaining > 0 ? '籤を手に取る' : '次の武功50を待つ'}
            </button>
          ) : (
            <div className="star-lottery-confirm" role="group" aria-label="抽選の確認">
              <p>籤を一回使います。よろしいですか。</p>
              <button className="btn btn-main" onClick={confirm}>この籤をひらく</button>
              <button className="btn btn-ghost" onClick={() => { setConfirming(false); setRequestId('') }}>戻す</button>
            </div>
          )}
        </section>
      )}

      {message && <p className="star-lottery-message" role="status">{message}</p>}

      {latest && (
        <section className="star-lottery-result" aria-label="直近の結果">
          <p className="star-lottery-kicker">第{latest.drawNumber}籤</p>
          <div className="star-lottery-result-cards">
            {latest.godIds.map((id) => {
              const god = godById(id)
              const isNew = latest.newGodIds.includes(id)
              return (
                <article key={id} data-rank={god.rank}>
                  <img src={gameImg(god.portrait)} alt="" />
                  <div><span>{GOD_RANK_LABELS[god.rank]}</span><h3>{god.name}</h3><p>{isNew ? '新たな星札' : `重なり — 縁+1`}</p></div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      <section className="star-lottery-rates" aria-labelledby="star-rate-title">
        <h2 id="star-rate-title">星の現れやすさ</h2>
        <div>{RANKS.map((rank) => <p key={rank}><span>{GOD_RANK_LABELS[rank]}</span><strong>{STAR_LOTTERY_RATES[rank]}%</strong></p>)}</div>
        <small>各位階の中では同率。限定札・期間限定・日次更新・有償籤はありません。</small>
      </section>

      <section className="star-lottery-collection" aria-labelledby="star-owned-title">
        <h2 id="star-owned-title">星札帖</h2>
        <div className="star-lottery-grid">
          {GODS.map((god) => (
            <div key={god.id} className={owned.has(god.id) ? 'owned' : 'unknown'} title={owned.has(god.id) ? god.name : 'まだ見ぬ星'}>
              {owned.has(god.id) ? <img src={gameImg(god.portrait)} alt={god.name} /> : <span aria-label="未所持">?</span>}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
