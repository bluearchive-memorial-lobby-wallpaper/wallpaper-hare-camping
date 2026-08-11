$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$distRoot = Join-Path $projectRoot "dist"
$releaseRoot = Join-Path $projectRoot "release"
$packageJson = Get-Content (Join-Path $projectRoot "package.json") -Raw -Encoding UTF8 | ConvertFrom-Json
$archiveName = "hare-camping-we-offline-v$($packageJson.version).zip"
$archivePath = Join-Path $releaseRoot $archiveName
$archiveChecksumPath = "$archivePath.sha256"
$manifestPath = Join-Path $distRoot "MANIFEST.sha256"
$fixedTimestamp = [DateTimeOffset]::new(2026, 8, 11, 0, 0, 0, [TimeSpan]::Zero)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Get-RelativePackagePath([string]$filePath) {
  $resolved = [IO.Path]::GetFullPath($filePath)
  $prefix = $distRoot.TrimEnd("\", "/") + [IO.Path]::DirectorySeparatorChar
  if (-not $resolved.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Package file is outside dist: $resolved"
  }
  return $resolved.Substring($prefix.Length).Replace("\", "/")
}

if (-not (Test-Path -LiteralPath (Join-Path $distRoot "index.html"))) {
  throw "dist/index.html is missing. Run the build before packaging."
}

$manifestFiles = Get-ChildItem -LiteralPath $distRoot -Recurse -File |
  Where-Object { $_.FullName -ne $manifestPath } |
  Sort-Object { Get-RelativePackagePath $_.FullName }
$manifestLines = foreach ($file in $manifestFiles) {
  $relative = Get-RelativePackagePath $file.FullName
  $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  "$hash  $relative"
}
[IO.File]::WriteAllText($manifestPath, (($manifestLines -join "`n") + "`n"), $utf8NoBom)

New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
if (Test-Path -LiteralPath $archivePath) { Remove-Item -LiteralPath $archivePath -Force }
if (Test-Path -LiteralPath $archiveChecksumPath) {
  Remove-Item -LiteralPath $archiveChecksumPath -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archiveStream = [IO.File]::Open($archivePath, [IO.FileMode]::CreateNew)
$archive = New-Object IO.Compression.ZipArchive(
  $archiveStream,
  [IO.Compression.ZipArchiveMode]::Create,
  $false
)
try {
  $packageFiles = Get-ChildItem -LiteralPath $distRoot -Recurse -File |
    Sort-Object { Get-RelativePackagePath $_.FullName }
  foreach ($file in $packageFiles) {
    $relative = Get-RelativePackagePath $file.FullName
    $entry = $archive.CreateEntry($relative, [IO.Compression.CompressionLevel]::Optimal)
    $entry.LastWriteTime = $fixedTimestamp
    $sourceStream = [IO.File]::OpenRead($file.FullName)
    $entryStream = $entry.Open()
    try { $sourceStream.CopyTo($entryStream) }
    finally {
      $entryStream.Dispose()
      $sourceStream.Dispose()
    }
  }
} finally {
  $archive.Dispose()
  $archiveStream.Dispose()
}

$expectedFiles = Get-ChildItem -LiteralPath $distRoot -Recurse -File |
  ForEach-Object { Get-RelativePackagePath $_.FullName } |
  Sort-Object
$verifyStream = [IO.File]::OpenRead($archivePath)
$verifyArchive = New-Object IO.Compression.ZipArchive(
  $verifyStream,
  [IO.Compression.ZipArchiveMode]::Read,
  $false
)
try {
  $actualFiles = $verifyArchive.Entries |
    Where-Object { $_.Name.Length -gt 0 } |
    ForEach-Object { $_.FullName } |
    Sort-Object
  if (($expectedFiles -join "`n") -ne ($actualFiles -join "`n")) {
    throw "Archive file list does not match dist."
  }
  foreach ($entry in $verifyArchive.Entries | Where-Object { $_.Name.Length -gt 0 }) {
    $sourcePath = Join-Path $distRoot $entry.FullName.Replace("/", [IO.Path]::DirectorySeparatorChar)
    $expectedHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash
    $sha = [Security.Cryptography.SHA256]::Create()
    $entryStream = $entry.Open()
    try {
      $actualHash = [BitConverter]::ToString($sha.ComputeHash($entryStream)).Replace("-", "")
    } finally {
      $entryStream.Dispose()
      $sha.Dispose()
    }
    if ($expectedHash -ne $actualHash) {
      throw "Archive checksum mismatch: $($entry.FullName)"
    }
  }
} finally {
  $verifyArchive.Dispose()
  $verifyStream.Dispose()
}

$archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText(
  $archiveChecksumPath,
  "$archiveHash  $archiveName`n",
  $utf8NoBom
)

$archiveInfo = Get-Item -LiteralPath $archivePath
Write-Output "Created and verified $archiveName ($($archiveInfo.Length) bytes)."
Write-Output "SHA-256: $archiveHash"
