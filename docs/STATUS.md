# 開発ステータス(2026-07-02 更新)

## 🎉 リリース済み

- **公開URL**: https://umine2025.github.io/hitsugi/ (GitHub Pages、push で自動デプロイ)
- **リポジトリ**: https://github.com/UmiNe2025/hitsugi (public)
- **リリース**: v0.1.0 https://github.com/UmiNe2025/hitsugi/releases/tag/v0.1.0

## 完了

- ゲーム本体: 世代交代・星契り(遺伝予測表示)・夜藪探索(灯システム)・継足バトル・家譜・辞世自動生成・形見継承・全滅時一人生還・選択式事件8種・ボス4体(最終戦は玄冬→汐里の二段構え)・NG+(継承新周回)
- 音楽: Web Audio和風プロシージャルBGM6曲+SE9種(汐里の子守唄モチーフ)
- バランス: ブラウザ内自動プレイテスト(最適botで7〜8世代/5〜9年クリア、ボス敗北0〜3回)で調整済み
- UX: 手引き・操作音・モバイル対応・オートセーブ・家譜画像共有・OGP画像
- マーケ: `docs/MARKETING.md`(ポジショニング、X/itch.io/ポータル施策、告知文面コピペ可、KPI)

## 進行中/保留

- **codex画像生成(M3)**: ✅ 解決済み! 原因は stdin 待ち(`codex exec ... </dev/null` で即応答)。
  - タイトルキービジュアル生成・組込済み(和風水彩+切り絵、期待以上の品質)
  - 星神12柱・ボス・背景の全19枚バッチを実行中(`assets_src/codex_image_batch.md`)
  - UI側の受け皿は実装済み(画像が無ければ従来表示に自動フォールバック)
  - 生成後は `pwsh scripts/compress-images.ps1` でweb最適化(png→jpg、原本はgit外へ)

## ユーザーの認証が必要な残作業(帰還後にどうぞ)

1. **X告知**: `docs/MARKETING.md` の文面をコピペ投稿
2. **itch.io登録**: 英語ストア文面も同ファイルに用意済み
3. **フリーゲームポータル登録**(ふりーむ!等)
4. **codex画像バッチ**: Codexアプリ側から `assets_src/codex_image_batch.md` の指示を実行(CLIが重い場合)
5. アクセス解析の導入判断(GoatCounter等)

## 開発メモ

- dev起動: `npm run dev`(previewサーバ設定は `.claude/launch.json`)
- 自動プレイテスト: dev時 `window.__game` にストア公開。preview_eval でシミュレーション可能
- デプロイ: main へ push するだけ(GitHub Actions)
