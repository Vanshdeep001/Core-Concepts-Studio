$files = Get-ChildItem -Path "src" -Recurse -Include *.jsx,*.js
foreach ($f in $files) {
    $lines = [System.IO.File]::ReadAllLines($f.FullName)
    $found = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1FFFF}]') {
            if (-not $found) {
                Write-Output "=== $($f.FullName) ==="
                $found = $true
            }
            Write-Output "  L$($i+1): $($lines[$i].TrimStart())"
        }
    }
}
