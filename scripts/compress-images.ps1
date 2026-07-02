# public/img/*.png を web 配信用 jpg に一括変換し、原本を assets_src/orig/ へ退避する
# 使い方: pwsh scripts/compress-images.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$imgDir = Join-Path $root 'public\img'
$origDir = Join-Path $root 'assets_src\orig'
New-Item -ItemType Directory -Force $origDir | Out-Null

function Convert-ToJpeg([string]$src, [string]$dst, [int]$maxW, [int]$quality) {
  $img = [System.Drawing.Image]::FromFile($src)
  try {
    $w = [Math]::Min($maxW, $img.Width)
    $h = [int]($img.Height * $w / $img.Width)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $gr = [System.Drawing.Graphics]::FromImage($bmp)
    $gr.InterpolationMode = 'HighQualityBicubic'
    $gr.DrawImage($img, 0, 0, $w, $h)
    $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
    $p = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
    $bmp.Save($dst, $enc, $p)
    $gr.Dispose(); $bmp.Dispose()
  } finally {
    $img.Dispose()
  }
}

Get-ChildItem $imgDir -Filter *.png | ForEach-Object {
  $name = $_.BaseName
  # 用途別の幅: 背景/タイトル 1600, ボス 1024, 立ち絵 768
  $maxW = if ($name -like 'bg_*' -or $name -like 'title_*') { 1600 }
          elseif ($name -like 'boss_*') { 1024 }
          else { 768 }
  $dst = Join-Path $imgDir ($name + '.jpg')
  Convert-ToJpeg $_.FullName $dst $maxW 82
  Move-Item $_.FullName (Join-Path $origDir $_.Name) -Force
  $kb = [int]((Get-Item $dst).Length / 1KB)
  Write-Output "converted: $name.jpg (${kb}KB, w<=$maxW)"
}
Write-Output 'done'
