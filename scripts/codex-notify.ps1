[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('completed', 'waiting', 'failed', 'approval-required')]
    [string]$Status,

    [Parameter(Mandatory = $true)]
    [ValidateLength(1, 120)]
    [string]$Title,

    [Parameter(Mandatory = $true)]
    [ValidateLength(1, 500)]
    [string]$Message,

    [string]$EnvFile = '.env.local',

    [switch]$DryRun
)

# COPY CONFIG: change only this value when copying the script to another project.
$ProjectName = 'PieShop'

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Read-DotEnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Name
    )

    $processValue = [Environment]::GetEnvironmentVariable($Name, 'Process')
    if (-not [string]::IsNullOrWhiteSpace($processValue)) {
        return $processValue
    }

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return $null
    }

    foreach ($line in Get-Content -LiteralPath $Path) {
        $trimmed = $line.Trim()
        if ($trimmed.Length -eq 0 -or $trimmed.StartsWith('#')) {
            continue
        }

        $separator = $trimmed.IndexOf('=')
        if ($separator -lt 1) {
            continue
        }

        if ($trimmed.Substring(0, $separator).Trim() -ne $Name) {
            continue
        }

        $value = $trimmed.Substring($separator + 1).Trim()
        if ($value.Length -ge 2) {
            $first = $value[0]
            $last = $value[$value.Length - 1]
            if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
                $value = $value.Substring(1, $value.Length - 2)
            }
        }

        return $value
    }

    return $null
}

function ConvertTo-SafeLine {
    param([Parameter(Mandatory = $true)][string]$Value)

    return (($Value -replace '[\r\n\t]+', ' ') -replace '\s{2,}', ' ').Trim()
}

function Assert-NotificationIsSafe {
    param([Parameter(Mandatory = $true)][string]$Value)

    $blockedPatterns = @(
        '(?i)\b(?:password|passwd|secret|api[_ -]?key|service[_ -]?role|authorization|bearer)\s*[:=]',
        '(?i)\bsb_secret_[A-Za-z0-9_-]+',
        '\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}',
        '\b\d{6,}:[A-Za-z0-9_-]{20,}\b',
        '(?i)https?://\S+[?&](?:token|key|code|secret)=',
        '\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b',
        '(?<!\d)(?:\+?\d[\s().-]*){9,}(?!\d)'
    )

    foreach ($pattern in $blockedPatterns) {
        if ($Value -match $pattern) {
            throw 'Notification blocked because it may contain a credential or personal identifier.'
        }
    }
}

$safeTitle = ConvertTo-SafeLine -Value $Title
$safeMessage = ConvertTo-SafeLine -Value $Message
Assert-NotificationIsSafe -Value "$safeTitle $safeMessage"

$timestamp = [DateTimeOffset]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
$notification = @(
    "[$ProjectName] Codex: $Status"
    $safeTitle
    $safeMessage
    "UTC: $timestamp"
) -join "`n"

if ($notification.Length -gt 900) {
    throw 'Notification exceeds the safe maximum length.'
}

if ($DryRun) {
    Write-Output $notification
    exit 0
}

$enabled = Read-DotEnvValue -Path $EnvFile -Name 'CODEX_TELEGRAM_NOTIFICATIONS'
if ($enabled -ne 'true') {
    throw 'Codex Telegram notifications are disabled. Set CODEX_TELEGRAM_NOTIFICATIONS=true in the ignored local environment file.'
}

$botToken = Read-DotEnvValue -Path $EnvFile -Name 'CODEX_TELEGRAM_BOT_TOKEN'
$chatId = Read-DotEnvValue -Path $EnvFile -Name 'CODEX_TELEGRAM_CHAT_ID'

if ([string]::IsNullOrWhiteSpace($botToken) -or [string]::IsNullOrWhiteSpace($chatId)) {
    throw 'Codex Telegram notification configuration is incomplete.'
}

if ($botToken -notmatch '^\d{6,}:[A-Za-z0-9_-]{20,}$') {
    throw 'Codex Telegram bot token format is invalid.'
}

if ($chatId -notmatch '^-?\d+$') {
    throw 'Codex Telegram chat ID format is invalid.'
}

try {
    $requestBody = @{ chat_id = $chatId; text = $notification } | ConvertTo-Json -Compress
    $requestUri = "https://api.telegram.org/bot$botToken/sendMessage"
    $result = Invoke-RestMethod -Method Post -Uri $requestUri -ContentType 'application/json' -Body $requestBody -TimeoutSec 10
    if ($result.ok -ne $true) {
        throw 'Provider rejected the notification.'
    }

    Write-Output "Codex notification sent for $ProjectName."
}
catch {
    throw 'Codex notification could not be sent. No provider response or credential was logged.'
}
