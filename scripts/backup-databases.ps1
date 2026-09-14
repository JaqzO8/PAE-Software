param(
    [string]$OutputDir = "backups",
    [int]$RetentionDays = 14
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path (Resolve-Path ".") $OutputDir
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

$databases = @(
    @{ Container = "pae-auth-db"; User = "auth_user"; Database = "auth_db" },
    @{ Container = "pae-content-db"; User = "content_user"; Database = "content_db" },
    @{ Container = "pae-community-db"; User = "community_user"; Database = "community_db" },
    @{ Container = "pae-exam-db"; User = "exam_user"; Database = "exam_db" }
)

foreach ($item in $databases) {
    $fileName = "$($item.Database)-$timestamp.sql"
    $target = Join-Path $backupRoot $fileName
    Write-Host "Creating backup $fileName"
    docker exec $item.Container pg_dump -U $item.User -d $item.Database --clean --if-exists | Out-File -FilePath $target -Encoding utf8
}

$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem $backupRoot -Filter "*.sql" |
    Where-Object { $_.LastWriteTime -lt $cutoff } |
    Remove-Item -Force

Write-Host "Backups saved in $backupRoot"
