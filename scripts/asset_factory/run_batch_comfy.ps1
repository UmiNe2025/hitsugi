# 素材工場 — ComfyUI(別PC・ローカル)版ランナー
# codex版 run_batch.ps1 の「生成」部だけを ComfyUI HTTP API 呼び出しに差し替えたもの。
# 圧縮(Compress-One)/進捗(factory_state.json)/自動commit&push/歩行シート分割は codex版と同一で流用。
#
# 使い方(まずは少数テスト):
#   pwsh scripts/asset_factory/run_batch_comfy.ps1 -ComfyUrl http://<レンダPCのIP>:8188 -Ckpt <model>.safetensors -MaxImages 3 -NoCommit
# 本番:
#   pwsh scripts/asset_factory/run_batch_comfy.ps1 -ComfyUrl http://<レンダPCのIP>:8188 -Ckpt <model>.safetensors -MaxImages 40
#
# 仕組み: manifest.json の未生成分を1件ずつ ComfyUI に投げ → /history をポーリング → /view で PNG 取得
#         → public/img/<file> に保存 → Compress-One(jpg化・origへ退避) → factory_state.json 記録 →(任意)commit。
#         codex版とロックを共有し同時実行を防止。何度でも再開可(完了分は自動スキップ)。
param(
  [string]$ComfyUrl = 'http://192.168.1.10:8188',        # レンダPC(ComfyUI, --listen起動)。既定=検証済みIP。bare起動可
  [string]$Ckpt = 'novaAnimeXL_ilV190.safetensors',      # 採用モデル(SDXL/Illustrious系イラスト)。空なら template の %CKPT% を使用
  [int]$MaxImages = 15,
  [string]$Template = (Join-Path $PSScriptRoot 'comfy_workflow.template.json'),
  [int]$Steps = 30,
  [double]$Cfg = 4.5,                                     # nova検証値
  [string]$Sampler = 'dpmpp_2m',                          # nova検証値
  [string]$Scheduler = 'karras',                         # nova検証値
  [string]$Negative = 'photograph, realistic, 3d render, cel shading, thick black outlines, comic book, muscular, teal, cyan, daylight, bright colors, human, person, figure, frame, border, vignette, text, watermark, signature, lowres, bad anatomy',
  [int]$PerImageTimeoutSec = 240,
  [switch]$NoCommit
)

$ErrorActionPreference = 'Stop'
$ComfyUrl = $ComfyUrl.TrimEnd('/')
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$manifestPath = Join-Path $PSScriptRoot 'manifest.json'
$statePath = Join-Path $root 'assets_src\factory_state.json'
$outDir = Join-Path $root 'public\img'
$origDir = Join-Path $root 'assets_src\orig'
New-Item -ItemType Directory -Force $outDir, $origDir | Out-Null

# 画風統一(nova検証済みの調整タグ。manifest 各件の prompt の後ろに付与)
$STYLE = 'traditional japanese watercolor and sumi-e ink-wash painting, kirie papercut art, nihonga, flat muted washes, art-book illustration, deep indigo near-black night sky, warm amber lantern glow, desaturated muted palette, atmospheric, quiet, no cel shading, no hard outlines, no text'

# --- 多重起動ロック(codex版 run_batch.ps1 と共用。同時生成で state が壊れるのを防ぐ) ---
$lockPath = Join-Path $PSScriptRoot '.factory.lock'
if (Test-Path $lockPath) {
  $oldPid = Get-Content $lockPath -ErrorAction SilentlyContinue
  if ($oldPid -and (Get-Process -Id $oldPid -ErrorAction SilentlyContinue)) {
    Write-Output "FACTORY(comfy): already running (pid $oldPid) — exit"; exit 0
  }
}
Set-Content $lockPath $PID

try {
  # --- 接続プリフライト(繋がらなければ早期に分かりやすく落とす) ---
  try { $null = Invoke-RestMethod "$ComfyUrl/system_stats" -TimeoutSec 10 }
  catch {
    Write-Output "FACTORY(comfy): ComfyUI に接続できません ($ComfyUrl)"
    Write-Output "  → レンダPCで ComfyUI が起動し、LAN公開(起動時 --listen 0.0.0.0)されているか / IP・ポート / ファイアウォールを確認"
    exit 1
  }

  # --- 圧縮(codex版 run_batch.ps1 の Compress-One と同一) ---
  Add-Type -AssemblyName System.Drawing
  function Compress-One([string]$png, [string]$name) {
    $maxW = if ($name -like 'bg_*' -or $name -like 'bossbg_*' -or $name -like 'cg_*' -or $name -like 'cg2_*' -or
                $name -like 'fes_*' -or $name -like 'sc_*' -or $name -like 'title_*') { 1600 }
            elseif ($name -like 'cutin_*') { 1280 }
            elseif ($name -like 'boss_*' -or $name -like 'tile_*' -or $name -like 'ev_*' -or $name -like 'life_*') { 1024 }
            elseif ($name -like 'icon_*' -or $name -like 'ic_*' -or $name -like 'node_*' -or $name -like 'slot_*' -or
                    $name -like 'boon_*' -or $name -like 'job_*' -or $name -like 'emb_*' -or $name -like 'nem_*' -or
                    $name -like 'it_*' -or $name -like 'sk_*') { 256 }
            elseif ($name -like 'face_*' -or $name -like 'vil_*') { 384 }
            else { 768 }
    $img = [System.Drawing.Image]::FromFile($png)
    try {
      $w = [Math]::Min($maxW, $img.Width); $h = [int]($img.Height * $w / $img.Width)
      $bmp = [System.Drawing.Bitmap]::new($w, $h)
      $gr = [System.Drawing.Graphics]::FromImage($bmp)
      $gr.InterpolationMode = 'HighQualityBicubic'
      $gr.DrawImage($img, [System.Drawing.Rectangle]::new(0, 0, $w, $h))
      $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
      $p = [System.Drawing.Imaging.EncoderParameters]::new(1)
      $p.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, 82L)
      $bmp.Save(($png -replace '\.png$', '.jpg'), $enc, $p)
      $gr.Dispose(); $bmp.Dispose()
    } finally { $img.Dispose() }
    Move-Item $png (Join-Path $origDir $name) -Force
  }

  # --- ComfyUI で1枚生成し、画像情報(filename/subfolder/type)を返す ---
  $templateJson = Get-Content $Template -Raw
  function Invoke-Comfy([string]$positive, [string]$neg, [int]$w, [int]$h) {
    $g = $templateJson | ConvertFrom-Json -AsHashtable
    $g.Remove('_comment') | Out-Null          # 注釈キーは送信前に必ず除去(グラフ検証で弾かれるため)
    $seed = Get-Random -Minimum 1 -Maximum 2147483646
    foreach ($nid in @($g.Keys)) {
      $node = $g[$nid]
      if ($node -isnot [hashtable]) { continue }
      switch ($node.class_type) {
        'CheckpointLoaderSimple' { if ($Ckpt) { $node.inputs.ckpt_name = $Ckpt } }
        'EmptyLatentImage'   { $node.inputs.width = $w; $node.inputs.height = $h }
        'EmptySD3LatentImage' { $node.inputs.width = $w; $node.inputs.height = $h }
        { $_ -in 'CLIPTextEncode', 'CLIPTextEncodeSDXL' } {
          $t = "$($node.inputs.text)"
          if ($t -match '%POSITIVE%') { $node.inputs.text = $positive }
          elseif ($t -match '%NEGATIVE%') { $node.inputs.text = $neg }
        }
        { $_ -in 'KSampler', 'KSamplerAdvanced' } {
          if ($node.inputs.ContainsKey('seed')) { $node.inputs.seed = $seed }
          if ($node.inputs.ContainsKey('noise_seed')) { $node.inputs.noise_seed = $seed }
          if ($node.inputs.ContainsKey('steps')) { $node.inputs.steps = $Steps }
          if ($node.inputs.ContainsKey('cfg')) { $node.inputs.cfg = $Cfg }
          if ($node.inputs.ContainsKey('sampler_name')) { $node.inputs.sampler_name = $Sampler }
          if ($node.inputs.ContainsKey('scheduler')) { $node.inputs.scheduler = $Scheduler }
        }
      }
    }
    $body = @{ prompt = $g; client_id = 'hitsugi_factory' } | ConvertTo-Json -Depth 40
    $resp = Invoke-RestMethod "$ComfyUrl/prompt" -Method Post -Body $body -ContentType 'application/json; charset=utf-8'
    $promptId = $resp.prompt_id
    if (-not $promptId) { throw 'no prompt_id returned' }
    $deadline = (Get-Date).AddSeconds($PerImageTimeoutSec)
    while ((Get-Date) -lt $deadline) {
      Start-Sleep -Seconds 2
      $hist = (Invoke-WebRequest "$ComfyUrl/history/$promptId" -TimeoutSec 15).Content | ConvertFrom-Json -AsHashtable
      if ($hist.ContainsKey($promptId)) {
        $outputs = $hist[$promptId]['outputs']
        foreach ($onid in @($outputs.Keys)) {
          $imgs = $outputs[$onid]['images']
          if ($imgs) { return $imgs[0] }
        }
        throw 'completed but produced no image (SaveImage ノードがあるか確認)'
      }
    }
    throw "timeout ($PerImageTimeoutSec s) — GPU が遅い/詰まっている可能性"
  }

  # --- hero用 hires-fix 2パス(base ~1MP → 1.5倍latentアップスケール → denoise0.35 refine)。boss/bg等の高精細再生成用 ---
  function Invoke-ComfyHires([string]$positive, [string]$neg, [int]$tw, [int]$th) {
    $area = [double]($tw * $th)
    $scale = [Math]::Sqrt(1000000.0 / $area); if ($scale -gt 1) { $scale = 1.0 }
    $bw = [int]([Math]::Round($tw * $scale / 8.0) * 8); $bh = [int]([Math]::Round($th * $scale / 8.0) * 8)
    $uw = [int]([Math]::Round($bw * 1.5 / 8.0) * 8); $uh = [int]([Math]::Round($bh * 1.5 / 8.0) * 8)
    $seed = Get-Random -Minimum 1 -Maximum 2000000000
    $g = @{
      '4'  = @{ class_type = 'CheckpointLoaderSimple'; inputs = @{ ckpt_name = $Ckpt } }
      '5'  = @{ class_type = 'EmptyLatentImage'; inputs = @{ width = $bw; height = $bh; batch_size = 1 } }
      '6'  = @{ class_type = 'CLIPTextEncode'; inputs = @{ text = $positive; clip = @('4', 1) } }
      '7'  = @{ class_type = 'CLIPTextEncode'; inputs = @{ text = $neg; clip = @('4', 1) } }
      '3'  = @{ class_type = 'KSampler'; inputs = @{ seed = $seed; steps = 28; cfg = 4.5; sampler_name = 'dpmpp_2m'; scheduler = 'karras'; denoise = 1.0; model = @('4', 0); positive = @('6', 0); negative = @('7', 0); latent_image = @('5', 0) } }
      '10' = @{ class_type = 'LatentUpscale'; inputs = @{ samples = @('3', 0); upscale_method = 'bislerp'; width = $uw; height = $uh; crop = 'disabled' } }
      '11' = @{ class_type = 'KSampler'; inputs = @{ seed = $seed; steps = 12; cfg = 4.5; sampler_name = 'dpmpp_2m'; scheduler = 'karras'; denoise = 0.35; model = @('4', 0); positive = @('6', 0); negative = @('7', 0); latent_image = @('10', 0) } }
      '8'  = @{ class_type = 'VAEDecode'; inputs = @{ samples = @('11', 0); vae = @('4', 2) } }
      '9'  = @{ class_type = 'SaveImage'; inputs = @{ filename_prefix = 'hitsugi_hires'; images = @('8', 0) } }
    }
    $resp = Invoke-RestMethod "$ComfyUrl/prompt" -Method Post -Body (@{ prompt = $g; client_id = 'hitsugi_factory' } | ConvertTo-Json -Depth 40) -ContentType 'application/json; charset=utf-8'
    $promptId = $resp.prompt_id
    if (-not $promptId) { throw 'no prompt_id (hires)' }
    $deadline = (Get-Date).AddSeconds($PerImageTimeoutSec)
    while ((Get-Date) -lt $deadline) {
      Start-Sleep -Seconds 3
      $hist = (Invoke-WebRequest "$ComfyUrl/history/$promptId" -TimeoutSec 15).Content | ConvertFrom-Json -AsHashtable
      if ($hist.ContainsKey($promptId)) {
        $outputs = $hist[$promptId]['outputs']
        foreach ($onid in @($outputs.Keys)) { $imgs = $outputs[$onid]['images']; if ($imgs) { return $imgs[0] } }
        throw 'hires: no image'
      }
    }
    throw "hires timeout ($PerImageTimeoutSec s)"
  }

  # --- 進捗コミット(逐次。長時間連続運転でも安全に増分デプロイ。20枚ごと＋最終に呼ぶ) ---
  function Commit-Progress {
    if ($NoCommit) { return }
    Push-Location $root
    try {
      git add public/img assets_src/factory_state.json 2>&1 | Out-Null
      if (git diff --cached --name-only 2>&1) {
        git commit -q -m "chore(assets): ComfyUI(nova)画像バッチ ($($doneSet.Count)/2073)" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" 2>&1 | Out-Null
        git push -q 2>&1 | Out-Null
        Write-Output "FACTORY(comfy): committed & pushed ($($doneSet.Count)/2073)"
      }
    } catch { Write-Output "FACTORY(comfy): git skipped ($($_.Exception.Message))" } finally { Pop-Location }
  }

  # --- カテゴリ別スタイル(hero=hires2パス / アイコン=単体 / 敵=papercut妖怪 / 顔=肖像 / その他=風景) ---
  $HERO_PREFIX = @()  # 一旦無効: manifestのheroプロンプトが日本語主体で英語情報不足→nova再生成が劣化(炎/偽文字)。英語プロンプト整備後に再有効化(Invoke-ComfyHiresは温存)
  $ICON_PREFIX = @('it', 'sk', 'ic', 'icon', 'node', 'slot', 'boon', 'job', 'emb', 'nem')
  $ICON_STYLE = 'japanese ink and watercolor game icon, single object centered, plain flat dark background, soft muted palette, subtle amber highlight, clean, no landscape, no scenery, no people, no frame'
  $ICON_NEG = 'landscape, scenery, background, forest, sky, night scene, multiple objects, two objects, diptych, split image, people, character, hands, text, kanji, letters, label, tag, frame, border, watermark, cel shading, photo, realistic, lowres'
  $ENEMY_STYLE = 'japanese kirie papercut and ink watercolor yokai illustration, single creature centered, dark indigo background, amber rim light, muted palette, no text'
  $FACE_STYLE = 'japanese watercolor character portrait, head and shoulders, plain dark background, soft muted palette, atmospheric, no text'
  $HERO_NEG = 'magenta, purple, pink, violet, lime green, bright green, neon, garbled text, black rectangles, glyphs, kanji blocks, random symbols, letters, text, watermark, frame, border, photo, realistic, 3d, cel shading, human, person'
  function Get-Cat([string]$file) { $p = ($file -split '_')[0]; if ($HERO_PREFIX -contains $p) { 'hero' } elseif ($ICON_PREFIX -contains $p) { 'icon' } elseif ($p -eq 'en') { 'enemy' } elseif ($p -eq 'face') { 'face' } else { 'scene' } }

  # --- メインループ ---
  $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
  $state = if (Test-Path $statePath) { Get-Content $statePath -Raw | ConvertFrom-Json } else { [pscustomobject]@{ done = @() } }
  $doneSet = [System.Collections.Generic.HashSet[string]]::new([string[]]$state.done)
  $todo = @($manifest | Where-Object { -not $doneSet.Contains($_.id) } | Select-Object -First $MaxImages)
  if ($todo.Count -eq 0) { Write-Output 'FACTORY(comfy): all done'; return }
  Write-Output "FACTORY(comfy): $($todo.Count) 枚を $ComfyUrl で生成開始 (ckpt=$(if($Ckpt){$Ckpt}else{'template既定'}))"

  $ok = 0
  foreach ($item in $todo) {
    try {
      $cat = Get-Cat $item.file
      if ($cat -eq 'hero') {
        # boss/bg/bossbg/cg: hires-fix 2パスで高精細再生成(検証済みv2a設定)
        $info = Invoke-ComfyHires "$($item.prompt), $STYLE" $HERO_NEG ([int]$item.w) ([int]$item.h)
      }
      else {
        switch ($cat) {
          'icon'  { $st = $ICON_STYLE;  $ng = $ICON_NEG; $gw = 768; $gh = 768 }
          'enemy' { $st = $ENEMY_STYLE; $ng = $Negative; $gw = [int]$item.w; $gh = [int]$item.h }
          'face'  { $st = $FACE_STYLE;  $ng = $Negative; $gw = [int]$item.w; $gh = [int]$item.h }
          default { $st = $STYLE;       $ng = $Negative; $gw = [int]$item.w; $gh = [int]$item.h }
        }
        $positive = "$($item.prompt), $st"
        $info = Invoke-Comfy $positive $ng $gw $gh
      }
      $fn = [string]$info['filename']; $sf = [string]$info['subfolder']; $ty = [string]$info['type']
      $url = "$ComfyUrl/view?filename=$([uri]::EscapeDataString($fn))&subfolder=$([uri]::EscapeDataString($sf))&type=$([uri]::EscapeDataString($ty))"
      $target = Join-Path $outDir $item.file
      Invoke-WebRequest $url -OutFile $target -TimeoutSec 60
      Compress-One $target $item.file
      [void]$doneSet.Add($item.id)
      $ok++
      Write-Output "FACTORY(comfy): ok $($item.file)  ($ok/$($todo.Count))"
      [pscustomobject]@{ done = @($doneSet) } | ConvertTo-Json | Set-Content $statePath   # 1枚ごとに保存(途中で止めても安全)
      if ($ok % 20 -eq 0) { Commit-Progress }   # 20枚ごとに増分コミット&デプロイ
    } catch {
      Write-Output "FACTORY(comfy): skip $($item.file) — $($_.Exception.Message)"
    }
  }

  # --- 最終コミット(残り<20枚分を確実に反映) ---
  Commit-Progress

  Write-Output "FACTORY(comfy): 完了 $ok 枚 / state 累計 $($doneSet.Count)"
  # 歩行シートが来ていればフレーム自動分割(冪等)
  $slice = Join-Path $root 'scripts\slice-walk-sheets.ps1'
  if (Test-Path $slice) { & $slice | Select-Object -Last 1 }
} finally { Remove-Item $lockPath -Force -ErrorAction SilentlyContinue }
