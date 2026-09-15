param([string]$Destination = (Join-Path $PSScriptRoot '../output/FOLWARK-PROJEKT.zip'))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$target = [IO.Path]::GetFullPath($Destination)
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)) | Out-Null
$files = @()
foreach ($folder in @('docs','rts/src','rts/public','rts/tests','rts/scripts')) {
    $files += Get-ChildItem -LiteralPath (Join-Path $root $folder) -Recurse -File
}
$files += Get-ChildItem -LiteralPath $root -File -Force | Where-Object { $_.Extension -ne '.zip' }
$files += Get-ChildItem -LiteralPath (Join-Path $root 'rts') -File -Force | Where-Object { $_.Extension -ne '.log' }
$stream = [IO.File]::Open($target,[IO.FileMode]::Create)
$zip = New-Object IO.Compression.ZipArchive($stream,[IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($root.Length + 1).Replace('\','/')
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$file.FullName,$relative,[IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally { $zip.Dispose(); $stream.Dispose() }
Write-Output $target
