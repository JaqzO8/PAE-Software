param(
    [switch]$SkipSystemTests
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$ReportDir = Join-Path $Root 'coverage\sonar'

if (-not $env:SONAR_TOKEN) {
    throw 'SONAR_TOKEN debe estar definido en el entorno; no se almacena en el repositorio.'
}

function Import-DotEnv([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return }
    foreach ($line in Get-Content -LiteralPath $Path) {
        if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
        $name, $value = $line -split '=', 2
        $name = $name.Trim()
        if (-not $name -or (Test-Path "Env:$name")) { continue }
        Set-Item "Env:$name" $value.Trim().Trim('"').Trim("'")
    }
}

New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
Import-DotEnv (Join-Path $Root '.env')

Write-Host '1/5 Ejecutando pruebas Jest de Content Service con cobertura...'
Push-Location (Join-Path $Root 'backend\services\content-service')
try {
    npx jest --coverage --runInBand --ci --json --outputFile "$ReportDir\content-jest.json"
    if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas Jest de Content Service.' }
} finally {
    Pop-Location
}

Write-Host '2/5 Ejecutando cobertura de reglas de respuesta en vivo...'
Push-Location $Root
try {
    npx jest backend/services/exam-service/src/tests/liveAnswerRules.conditionCoverage.test.js `
        --runInBand --ci --coverage `
        --collectCoverageFrom=backend/services/exam-service/src/services/liveAnswerRules.js `
        --coverageDirectory=coverage/exam `
        --coverageReporters=lcov --coverageReporters=text `
        --json --outputFile "$ReportDir\exam-jest.json"
    if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas Jest de Exam Service.' }
} finally {
    Pop-Location
}

$reports = @('coverage/sonar/content-jest.json', 'coverage/sonar/exam-jest.json')

Write-Host '3/5 Ejecutando pruebas de Quality Service con cobertura...'
Push-Location (Join-Path $Root 'backend\services\quality-service')
try {
    npx jest --coverage --runInBand --ci --json --outputFile "$ReportDir\quality-jest.json"
    if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas Jest de Quality Service.' }
} finally {
    Pop-Location
}
$reports += 'coverage/sonar/quality-jest.json'

if (-not $SkipSystemTests) {
    Write-Host '4/5 Ejecutando pruebas generales del sistema contra el gateway...'
    if (-not $env:PAE_LEARNING_EVIDENCE_OUTPUT) { $env:PAE_LEARNING_EVIDENCE_OUTPUT = "$ReportDir\learning-evidence.json" }
    if (-not $env:PAE_EVIDENCE_OUTPUT) { $env:PAE_EVIDENCE_OUTPUT = "$ReportDir\system-evidence.json" }
    Push-Location $Root
    try {
        npx jest tests/dynamic --runInBand --ci --json --outputFile "$ReportDir\system-jest.json"
        if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas generales del sistema.' }
    } finally {
        Pop-Location
    }
    $reports += 'coverage/sonar/system-jest.json'
} else {
    Write-Host '4/5 Pruebas generales omitidas mediante -SkipSystemTests.'
}

Push-Location $Root
try {
    node scripts/sonar/generate-test-execution-report.js @reports
    Write-Host '5/5 Enviando análisis y reportes a SonarQube...'
    sonar-scanner "-Dsonar.host.url=http://localhost:9010" "-Dsonar.token=$env:SONAR_TOKEN"
    if ($LASTEXITCODE -ne 0) { throw 'SonarScanner finalizó con error.' }
} finally {
    Pop-Location
}
