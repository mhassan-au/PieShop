[CmdletBinding()]
param(
    [string]$EnvFile = '.env.local',
    [switch]$DryRun
)

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
        if ($separator -lt 1 -or $trimmed.Substring(0, $separator).Trim() -ne $Name) {
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

$botToken = Read-DotEnvValue -Path $EnvFile -Name 'CODEX_TELEGRAM_BOT_TOKEN'
if ([string]::IsNullOrWhiteSpace($botToken)) {
    throw 'CODEX_TELEGRAM_BOT_TOKEN is missing from the ignored local environment file.'
}

if ($botToken -notmatch '^\d{6,}:[A-Za-z0-9_-]{20,}$') {
    throw 'Codex Telegram bot token format is invalid.'
}

if ($DryRun) {
    Write-Output 'Telegram chat-ID lookup configuration is valid. No network request was made.'
    exit 0
}

try {
    $requestUri = "https://api.telegram.org/bot$botToken/getUpdates"
    $result = Invoke-RestMethod -Method Get -Uri $requestUri -TimeoutSec 10
    if ($result.ok -ne $true) {
        throw 'Provider rejected the lookup.'
    }

    $privateChats = @(
        $result.result |
            ForEach-Object { $_.message.chat } |
            Where-Object { $null -ne $_ -and $_.type -eq 'private' -and $null -ne $_.id }
    )

    if ($privateChats.Count -eq 0) {
        throw 'No private chat was found. Open the bot in Telegram, send /start, and run this command again.'
    }

    $chatId = [string]$privateChats[-1].id
    if ($chatId -notmatch '^-?\d+$') {
        throw 'The returned chat ID was invalid.'
    }

    Write-Output $chatId
}
catch {
    if ($_.Exception.Message -like 'No private chat was found.*') {
        throw $_.Exception.Message
    }

    throw 'Telegram chat-ID lookup failed. No provider response or credential was logged.'
}
finally {
    Remove-Variable botToken -ErrorAction SilentlyContinue
}
