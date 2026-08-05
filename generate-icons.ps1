param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "public\icons")
)

Add-Type -AssemblyName System.Drawing

function New-SheepIcon {
  param(
    [int]$Size,
    [string]$Path,
    [double]$Scale = 1.0
  )

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml("#f4b85e"))

  $highlight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(46, 255, 255, 255))
  $shadow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(30, 92, 48, 18))
  $cream = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#fffdf8"))
  $face = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#d89b68"))
  $ear = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#805238"))
  $ink = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#3f2b21"))

  $graphics.FillEllipse($highlight, [int]($Size * 0.59), [int](-$Size * 0.13), [int]($Size * 0.58), [int]($Size * 0.58))
  $graphics.FillEllipse($shadow, [int]($Size * 0.19), [int]($Size * 0.69), [int]($Size * 0.62), [int]($Size * 0.13))

  $unit = $Size * $Scale
  $left = ($Size - $unit) / 2
  $top = ($Size - $unit) / 2

  $graphics.FillEllipse($ear, [int]($left + $unit * 0.18), [int]($top + $unit * 0.43), [int]($unit * 0.22), [int]($unit * 0.14))
  $graphics.FillEllipse($ear, [int]($left + $unit * 0.60), [int]($top + $unit * 0.43), [int]($unit * 0.22), [int]($unit * 0.14))
  $graphics.FillEllipse($face, [int]($left + $unit * 0.34), [int]($top + $unit * 0.39), [int]($unit * 0.32), [int]($unit * 0.35))

  $wool = @(
    @(0.25, 0.25, 0.27),
    @(0.38, 0.18, 0.28),
    @(0.53, 0.20, 0.27),
    @(0.60, 0.31, 0.25),
    @(0.22, 0.38, 0.25)
  )
  foreach ($circle in $wool) {
    $graphics.FillEllipse(
      $cream,
      [int]($left + $unit * $circle[0]),
      [int]($top + $unit * $circle[1]),
      [int]($unit * $circle[2]),
      [int]($unit * $circle[2])
    )
  }

  $eyeSize = [Math]::Max(3, [int]($unit * 0.027))
  $graphics.FillEllipse($ink, [int]($left + $unit * 0.415), [int]($top + $unit * 0.51), $eyeSize, $eyeSize)
  $graphics.FillEllipse($ink, [int]($left + $unit * 0.558), [int]($top + $unit * 0.51), $eyeSize, $eyeSize)
  $graphics.FillEllipse($ink, [int]($left + $unit * 0.488), [int]($top + $unit * 0.60), [Math]::Max(3, [int]($unit * 0.025)), [Math]::Max(2, [int]($unit * 0.018)))

  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

  $highlight.Dispose()
  $shadow.Dispose()
  $cream.Dispose()
  $face.Dispose()
  $ear.Dispose()
  $ink.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
New-SheepIcon -Size 192 -Path (Join-Path $OutputDirectory "icon-192.png") -Scale 0.90
New-SheepIcon -Size 512 -Path (Join-Path $OutputDirectory "icon-512.png") -Scale 0.90
New-SheepIcon -Size 512 -Path (Join-Path $OutputDirectory "icon-maskable-512.png") -Scale 0.70
New-SheepIcon -Size 180 -Path (Join-Path $OutputDirectory "apple-touch-icon.png") -Scale 0.90

Write-Output "Generated PWA icons in $OutputDirectory"
