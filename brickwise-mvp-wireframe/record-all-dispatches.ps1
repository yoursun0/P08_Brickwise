$base = 'C:\Users\User\AppData\Roaming\TRAE SOLO\ModularData\ai-agent\work-mode-projects\6a71a9cc6fe125141f33a04d\brickwise-mvp-wireframe'
$script = 'C:\Users\User\.trae\builtin\design\default\skills\solo-design\shared-runtime\deterministic-tooling\record-dispatch-completion.mjs'
$nodes = @(
  'page-flow-overview:pages/flow-overview.html',
  'page-landing:pages/landing.html',
  'page-login:pages/login.html',
  'page-dashboard:pages/dashboard.html',
  'page-upload-empty:pages/upload-empty.html',
  'page-upload-ready:pages/upload-ready.html',
  'page-upload-processing:pages/upload-processing.html',
  'page-upload-insufficient-credits:pages/upload-insufficient-credits.html',
  'page-extraction-review:pages/extraction-review.html',
  'page-results-default:pages/results-default.html',
  'page-results-price-basis:pages/results-price-basis.html',
  'page-results-tag-explanation:pages/results-tag-explanation.html',
  'page-results-empty:pages/results-empty.html',
  'page-shortlist:pages/shortlist.html',
  'page-pricing-buy-credits:pages/pricing-buy-credits.html',
  'page-payment-success:pages/payment-success.html',
  'page-payment-cancel:pages/payment-cancel.html'
)
foreach ($n in $nodes) {
  $parts = $n -split ':'
  $nodeId = $parts[0]
  $htmlSrc = $parts[1]
  $cmd = "node `"$script`" `"$base`" --node-id=`"$nodeId`" --html-src=`"$htmlSrc`" --status=completed --changed-files=`"$htmlSrc`" --trace-digest=`"main-agent-manual-completion`" --tool-ledger-json=`"{}`""
  Write-Host "Running: $nodeId"
  Invoke-Expression $cmd
}
Write-Host "All done."