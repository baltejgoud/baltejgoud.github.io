# Links all SKILL.md directories from awesome-claude-skills into .cursor/skills/
# so Cursor can discover them. Re-run after: git submodule update --remote

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path $PSScriptRoot -Parent
$SkillsRoot = Join-Path $ProjectRoot ".cursor\skills"
$SourceRoot = Join-Path $SkillsRoot "awesome-claude-skills"

if (-not (Test-Path (Join-Path $SourceRoot "README.md"))) {
    Write-Error "Submodule not found. Run: git submodule update --init --recursive"
}

$skillDirs = Get-ChildItem $SourceRoot -Recurse -Filter "SKILL.md" |
    ForEach-Object { $_.Directory.FullName }

$linked = 0
$skipped = 0

foreach ($dir in $skillDirs) {
    $folderName = Split-Path $dir -Leaf
    $target = Join-Path $SkillsRoot $folderName

    if ($target -eq $dir) { continue }

    if (Test-Path $target) {
        $skipped++
        continue
    }

    New-Item -ItemType Junction -Path $target -Target $dir | Out-Null
    $linked++
}

Write-Host "Linked $linked skills ($skipped already existed)."
Write-Host "Source: $SourceRoot"
