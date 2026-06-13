# Script to add DownloadNotes to all simulator files
# This adds the import and component to each file

$files = @(
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\networks\RoutingAlgoSim.jsx"; key = "networks/routing" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\networks\HttpDnsSim.jsx"; key = "networks/http-dns" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\os\DiskSchedulingSim.jsx"; key = "os/disk" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\os\BankersAlgorithmSim.jsx"; key = "os/bankers" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\os\ProcessSyncSim.jsx"; key = "os/sync" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\os\PageReplacementSim.jsx"; key = "os/page-replacement" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\dbms\NormalizationSim.jsx"; key = "dbms/normalization" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\dbms\SqlJoinsSim.jsx"; key = "dbms/joins" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\dbms\TransactionsSim.jsx"; key = "dbms/transactions" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\dbms\BPlusTreeSim.jsx"; key = "dbms/bplustree" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\dbms\ErDesignSim.jsx"; key = "dbms/er-design" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\dbms\SqlQueryVisualizerSim.jsx"; key = "dbms/sql-visualizer" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\oops\FourPillarsSim.jsx"; key = "oops/pillars" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\oops\InheritanceDeepDiveSim.jsx"; key = "oops/inheritance" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\oops\AbstractInterfaceSim.jsx"; key = "oops/abstract-interface" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\oops\DesignPatternsSim.jsx"; key = "oops/patterns" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\oops\SolidPrinciplesSim.jsx"; key = "oops/solid" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\oops\UmlDiagramsSim.jsx"; key = "oops/uml" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\git\GitSim.jsx"; key = "git/sim" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\systemdesign\LoadBalancerSim.jsx"; key = "systemdesign/load-balancer" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\systemdesign\CacheRedisSim.jsx"; key = "systemdesign/cache-redis" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\systemdesign\DbScalingSim.jsx"; key = "systemdesign/db-scaling" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\systemdesign\MessageQueueSim.jsx"; key = "systemdesign/message-queue" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\systemdesign\ApiLifecycleSim.jsx"; key = "systemdesign/api-lifecycle" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\systemdesign\MicroservicesSim.jsx"; key = "systemdesign/microservices" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\modules\interview\InterviewSim.jsx"; key = "interview" },
    @{ path = "d:\OSlizer\cpu-scheduler\src\pages\SimulationPage.jsx"; key = "os/scheduling" }
)

$importLine = "import DownloadNotes from '../../components/DownloadNotes';"
$importLinePages = "import DownloadNotes from '../components/DownloadNotes';"

foreach ($file in $files) {
    $content = Get-Content $file.path -Raw
    
    # Skip if already has DownloadNotes
    if ($content -match "DownloadNotes") {
        Write-Host "SKIP (already has): $($file.path)"
        continue
    }
    
    # Determine import path based on file location
    $import = if ($file.path -match "\\pages\\") { $importLinePages } else { $importLine }
    
    # Add import after the last import statement
    # Find the last import line
    $lines = $content -split "`n"
    $lastImportIdx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^import ") {
            $lastImportIdx = $i
        }
    }
    
    if ($lastImportIdx -ge 0) {
        $newLines = @()
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $newLines += $lines[$i]
            if ($i -eq $lastImportIdx) {
                $newLines += $import
            }
        }
        $content = $newLines -join "`n"
    }
    
    # Now find the LEFT content closing pattern
    # We look for "const LEFT = (" and find the matching closing ");"
    # Then insert <DownloadNotes> before the last </div> inside it
    
    # Strategy: find where "leftContent=" is used and the LEFT/leftContent variable
    # Add <DownloadNotes> component at the end of the left panel
    
    # For files using const LEFT = (...), add before the closing </div>\n    );
    # For files using leftContent={...}, we need a different approach
    
    $componentTag = "            <DownloadNotes topicKey=`"$($file.key)`" />"
    
    # Pattern 1: const LEFT = ( ... </div>\n    );
    # We look for pattern: two spaces + </div> + newline + four spaces + );
    # that appears after "const LEFT" definition
    
    # Find "const LEFT = (" position
    $leftStart = $content.IndexOf("const LEFT = (")
    
    if ($leftStart -ge 0) {
        # Find the matching closing ");" by counting parens
        $idx = $leftStart + "const LEFT = (".Length
        $depth = 1
        while ($idx -lt $content.Length -and $depth -gt 0) {
            if ($content[$idx] -eq '(') { $depth++ }
            if ($content[$idx] -eq ')') { $depth-- }
            $idx++
        }
        # $idx now points just after the closing ")"
        # Find the last </div> before this closing
        $leftEnd = $idx
        $searchRegion = $content.Substring($leftStart, $leftEnd - $leftStart)
        
        # Find the last occurrence of "</div>" in the LEFT block 
        # We want to insert before the very last </div> line before ");""
        $lastDivClose = $searchRegion.LastIndexOf("</div>")
        if ($lastDivClose -ge 0) {
            $insertPos = $leftStart + $lastDivClose
            $content = $content.Substring(0, $insertPos) + "`n" + $componentTag + "`n        " + $content.Substring($insertPos)
        }
    } else {
        # Pattern 2: leftContent={leftContent} or leftContent={<...>}
        # Need special handling - look for "const leftContent" or "renderLeftContent"
        
        $leftContentStart = $content.IndexOf("const leftContent")
        if ($leftContentStart -ge 0) {
            # Similar approach
            $idx = $content.IndexOf("(", $leftContentStart) + 1
            $depth = 1
            while ($idx -lt $content.Length -and $depth -gt 0) {
                if ($content[$idx] -eq '(') { $depth++ }
                if ($content[$idx] -eq ')') { $depth-- }
                $idx++
            }
            $leftEnd = $idx
            $searchRegion = $content.Substring($leftContentStart, $leftEnd - $leftContentStart)
            $lastDivClose = $searchRegion.LastIndexOf("</div>")
            if ($lastDivClose -ge 0) {
                $insertPos = $leftContentStart + $lastDivClose
                $content = $content.Substring(0, $insertPos) + "`n" + $componentTag + "`n        " + $content.Substring($insertPos)
            }
        } else {
            Write-Host "MANUAL NEEDED: $($file.path)"
            continue
        }
    }
    
    Set-Content $file.path -Value $content -NoNewline
    Write-Host "DONE: $($file.path)"
}

Write-Host "`nAll files processed!"
