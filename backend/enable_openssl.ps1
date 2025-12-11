# PowerShell script to enable OpenSSL extension in PHP
# Run as Administrator if needed

$phpIniPath = "C:\php83\php.ini"

if (-not (Test-Path $phpIniPath)) {
    Write-Host "Error: php.ini not found at $phpIniPath" -ForegroundColor Red
    Write-Host "Please update the path in this script to match your PHP installation." -ForegroundColor Yellow
    exit 1
}

Write-Host "Reading php.ini file..." -ForegroundColor Cyan
$phpIniContent = Get-Content $phpIniPath -Raw

# Check if OpenSSL is already enabled
if ($phpIniContent -match '^\s*extension\s*=\s*openssl\s*$' -or $phpIniContent -match '^\s*extension\s*=\s*php_openssl\.dll\s*$') {
    Write-Host "OpenSSL extension is already enabled!" -ForegroundColor Green
    exit 0
}

# Try to uncomment extension=openssl
if ($phpIniContent -match '(?m)^\s*;extension\s*=\s*openssl\s*$') {
    Write-Host "Found commented OpenSSL extension, enabling it..." -ForegroundColor Yellow
    $phpIniContent = $phpIniContent -replace '(?m)^(\s*);extension\s*=\s*openssl\s*$', '$1extension=openssl'
    Set-Content -Path $phpIniPath -Value $phpIniContent -NoNewline
    Write-Host "✅ OpenSSL extension enabled!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Please verify by running: php -m | Select-String -Pattern 'openssl'" -ForegroundColor Cyan
    exit 0
}

# Try to uncomment extension=php_openssl.dll
if ($phpIniContent -match '(?m)^\s*;extension\s*=\s*php_openssl\.dll\s*$') {
    Write-Host "Found commented OpenSSL DLL extension, enabling it..." -ForegroundColor Yellow
    $phpIniContent = $phpIniContent -replace '(?m)^(\s*);extension\s*=\s*php_openssl\.dll\s*$', '$1extension=php_openssl.dll'
    Set-Content -Path $phpIniPath -Value $phpIniContent -NoNewline
    Write-Host "✅ OpenSSL extension enabled!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Please verify by running: php -m | Select-String -Pattern 'openssl'" -ForegroundColor Cyan
    exit 0
}

# If not found, add it to the extensions section
Write-Host "OpenSSL extension not found. Adding it..." -ForegroundColor Yellow

# Try to find the extensions section and add after it
if ($phpIniContent -match '(?m)^\s*;.*Windows Extensions') {
    # Add after Windows Extensions comment
    $phpIniContent = $phpIniContent -replace '(?m)^(\s*;.*Windows Extensions.*\r?\n)', "`$1`r`nextension=openssl`r`n"
    Set-Content -Path $phpIniPath -Value $phpIniContent -NoNewline
    Write-Host "✅ OpenSSL extension added!" -ForegroundColor Green
} else {
    # Just append at the end of extension section
    $phpIniContent += "`r`nextension=openssl`r`n"
    Set-Content -Path $phpIniPath -Value $phpIniContent -NoNewline
    Write-Host "✅ OpenSSL extension added to end of file!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Please verify by running: php -m | Select-String -Pattern 'openssl'" -ForegroundColor Cyan
Write-Host "If it works, you can now run: composer install" -ForegroundColor Cyan

