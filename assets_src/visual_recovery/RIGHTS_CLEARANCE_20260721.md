# Visual Recovery 生成素材の公開・商用利用承認

判定日: 2026-07-21 JST

対象: `asset-manifest.json` に記録された OpenAI built-in `image_gen` 生成素材7点と、その透過処理・リサイズ・WebP変換後の派生物

## 判定

`rightsStatus: cleared`。本ゲーム、公開GitHubリポジトリ、GitHub Pagesおよび将来の商用配布で利用できるものとして、プロジェクト所有者が公開・商用利用を承認した。

## 根拠

- 生成経路は各manifest項目と `AR1_PROMPTS_QC_20260721.md` / `AR1R_PROMPTS_QC_20260721.md` に、OpenAI built-in `image_gen` として記録されている。
- OpenAI Terms of Use / Services Agreementは、OpenAIと利用者の関係において利用者がOutputを所有し、OpenAIが保有し得る権利を利用者へ譲渡すると定める。
- プロジェクト所有者は2026-07-21に次のとおり明示承認した。

> 今回OpenAI image_genで生成した7素材を、このゲームおよび公開GitHubリポジトリで公開・商用利用することを承認します。

参照:

- https://openai.com/policies/terms-of-use/
- https://openai.com/policies/services-agreement/
- https://openai.com/policies/service-terms/

## 対象ID

- `village_facade_great_lantern`
- `village_facade_forge_storehouse`
- `village_facade_star_shrine`
- `village_facade_tofu_shop`
- `village_facade_departure_gate`
- `dungeon_hotarubi_landmark_drowned_shrine_firefly_reed`
- `dungeon_hotarubi_foreground_root_reed`

## 留保

- underlying model identifierはtoolから露出していないため、その事実はmanifestに残す。
- AI出力が一意であることや第三者権利を絶対に侵害しないことを保証する判定ではない。具体的な第三者権利の申立てや類似性の証拠が得られた場合は、該当素材を停止・差替え・再審査する。
- 外部8名評価と物理低性能端末gateは視覚品質・性能の別gateであり、今回の権利承認では代替しない。`regionVisualV2`はそれらが閉じるまで既定OFFを維持する。
