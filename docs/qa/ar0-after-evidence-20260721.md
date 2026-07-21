# AR0 After evidence（2026-07-21）

## 固定条件

- Git base: `7966fa25daf5b34e5cbb829c9510d3b1f3895b77`（`main` / `origin/main`一致）
- commit: AR0はユーザー承認前の既存dirtyと共存するため未commit。base HEAD + M35 patch/hash + 本書のscreen/source hashで固定する。
- save fixture: `src/dev/testhooks.ts`の`reset()`から作る決定論的test状態。SHA-256 `89BB600086A610B9B1DBB3E3CE783F2CDAEE895B724106FD1671CDAC601AB513`。
- viewport: 1440 / 1280 / 768 / 390 / 360px。証跡画像は比較の主幅である1280pxと390pxを保存する。
- M35境界: `docs/qa/worktree-m35-handoff-20260721.md`と`docs/qa/patches/m35-before-ar0.patch`を参照。AR0だけを戻してもM35の画像/crop/奉納札を失わない。

## 画像証跡

| 画面 | viewport | bytes | SHA-256 |
|---|---:|---:|---|
| Home | 1280 | 1,339,846 | `EC2C43217936E95C2BD229D2B6C8F6475F8364F472CCBA7CCEFC5CCC238974CF` |
| Home | 390 | 633,356 | `B0C20D88E59BAB4902234ECE29D966B05C96290477C74B7CE07A8572F608E008` |
| Pact | 1280 | 640,716 | `03A33419AACBC0C9F6573D97AD0966D03FD3BDDC0D0713BC3FA89FFE0C0FD77F` |
| Pact | 390 | 270,159 | `DBA8AB05C86DF2DD4EB1C084B0B684E88924F5BB745686E0DDB8CE063F7AD165` |
| Village | 1280 | 165,183 | `C18E01E146628559BE734F449894749B7A259B842C9F3A27BDB2D292EF71A060` |
| Village | 390 | 87,331 | `EA1DE107CD894BDD92662DC10FFF06A030FF70DEB2C568B0664BC554060933DB` |
| Dungeon | 1280 | 270,261 | `89656686FAE8A26ED0BC2BF47AB8B3CFC2483AD35F5FB422139CEB2E285EE307` |
| Dungeon | 390 | 151,041 | `FDA8E7CE1F4A9662AAEA0FD4C73917128ED007C5C49B27177FF8A1243CE7BFF4` |
| Battle 1v2 | 1280 | 514,567 | `6B27BBF25F245706CB1DE732D8687A266BE7F52A5D9EB0996252E5C3E1D672BC` |
| Battle 1v2 | 390 | 210,035 | `CE05FF3405460E0862A24594C67DCE0476A1323E780CE6AB1D0DF9E6F7DA6E21` |

保存先は`docs/qa/baselines/20260721-*-after-ar0.png`。生成testは`tests/visual/ar0_after_evidence.spec.ts`。

## AR0で閉じた操作欠陥

| 契約 | 結果 | 直接証拠 |
|---|---|---|
| Home横overflow / 選択操作 | PASS | 5幅。家族cardはnative button、`aria-pressed`、選択後も同一DOM/focusを保持 |
| Pact閲覧と契約可否 | PASS | 5幅。既知で奉納不足の神も閲覧可、契約CTAだけ理由付きで無効。M35 5幅10/10回帰PASS |
| Battle上端 / 攻撃経路 | PASS | 5幅10/10。敵tap/数字/Enter/Spaceは選択のみ、結果予告後に実行。Escapeは二段階復帰 |
| Village操作帯 | PASS | 5幅。近接行動は大きな1button、会話中はD-padを隠し方向入力を解放 |
| Dungeon地図 / 帰還 / DOM案内 | PASS | 5幅。地図controlは可視1個、帰り火dock常設、目的・発見POI・帰還規則をCanvas外にも表示 |
| unit / lint / build | PASS | Vitest 24 files / 621 tests、oxlint、TypeScript + Vite build |

追加独立監査で不足を指摘された後、`ar0_after_evidence.spec.ts`を証跡2幅だけの実行から、全5画面×全5幅の横overflow直接assertへ拡張した。Home/PactはTab到達、Space実行、computed outline、選択後の同一node focus保持、Pact確認SheetをEscapeで閉じた後のtrigger focus復元を全5幅で固定した。両specのクリーン再走は30/30 PASS。

AR0 runtime/test/manifestの単独rollbackは`docs/qa/patches/ar0-runtime-only.patch`（104,709 bytes、SHA-256 `0AE892E27B8D80B0B697B05FCCF031E314F5B046893631AE888AE2A9D463F1CF`）。M35 patchだけを適用した一時worktreeで、前方適用後の正規化内容25/25一致、reverse check/apply、M35保護4ファイルのhash不変を確認した。

## 目視判定

AR0は操作安全のgateであり、魅力改善の完了ではない。1280px / 390pxのafterを直接確認した結果、横overflow、操作帯競合、Battle上端競合は解消した。一方で次はAR1以降のblocking候補として残る。

- Home: 同型の暗藍panelが縦に続き、画面固有の「月初の一灯」がまだ弱い。
- Pact: 初期未選択時に御影側が大きな空白となり、祭儀としての誘導が弱い。
- Village: checkerboard地面とprimitive施設が世界の主役を占め、「帰ってきた家」に見えない。
- Dungeon: tile反復とprimitive地形が強く、螢火の窪地の材質・輪郭・landmarkが不足する。
- Battle: PC中央に意味の薄い暗部が大きく、Dungeonの場所性が継承されていない。

したがってAR1は`Home → 郷の鍛冶 → 螢火の窪地 → 1戦 → 帰還差分`だけを対象にし、全40地域や全神の量産へ進まない。

## 主要source hash

AR0の代表hashを固定する。全差分はbase HEADとの差分で再現する。

| ファイル | SHA-256 |
|---|---|
| `src/ui/Home.tsx` | `8321278FA31DA6C9B5E5610DA08BC271C952FD74B341E7BFE8D070A8EB0D1A62` |
| `src/ui/Pact.tsx` | `CCD3FF44CA4F03AAF154B65B1F39F1CFC549F5CC9432DB0D8D0FD5A661E12452` |
| `src/ui/Battle.tsx` | `C5E4A9C21C0B52FC98EBB68F2D45A016C44CB3BC71F8CEE422ACC3E79F403A63` |
| `src/ui/Dungeon.tsx` | `E295DBFF029238C35048B350E8E4BC6287358E463E34F1C0107D57191915D8E2` |
| `src/ui/Village.tsx` | `87965ECC6912494E4C91C53FF7147A9078DA3362FE72740A03C4705CD0E64D82` |
| `src/dungeon/engine.ts` | `B9E3F9650A944D49F7EA06068DD85B304E565DD147905C4038C73150526FF0AA` |
| `tests/visual/ar0_home_pact.spec.ts` | `5440CCD05AF17C28A11F8762A1D8756BB040B35FB80134142566232D821BF383` |
| `tests/visual/battle_target_confirm.spec.ts` | `D632A0182B6CC71A26B6A8A869EA33F3C45FE96CD840128F1BDE0ADDA674EA54` |
