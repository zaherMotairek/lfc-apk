$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000/api'
$results = @()

function Test-Step {
  param(
    [string]$Name,
    [scriptblock]$Action
  )
  try {
    $out = & $Action
    $script:results += [pscustomobject]@{ Step = $Name; Status = 'OK' }
    Write-Host "[OK] $Name" -ForegroundColor Green
    return $out
  } catch {
    $script:results += [pscustomobject]@{ Step = $Name; Status = 'FAIL'; Detail = $_.Exception.Message }
    Write-Host "[FAIL] $Name : $($_.Exception.Message)" -ForegroundColor Red
    throw
  }
}

function Invoke-Api($Method, $Path, $Body = $null, $Token = $null) {
  $headers = @{ 'Content-Type' = 'application/json' }
  if ($Token) { $headers['Authorization'] = "Bearer $Token" }
  $params = @{
    Uri = "$base$Path"
    Method = $Method
    Headers = $headers
  }
  if ($null -ne $Body) { $params.Body = ($Body | ConvertTo-Json -Depth 10) }
  return Invoke-RestMethod @params
}

Write-Host '=== RedLeb Hub E2E Verification ===' -ForegroundColor Cyan

$adminLogin = Test-Step 'Admin login' {
  Invoke-Api POST '/auth/login' @{
    email = 'admin@olsclebanon.com'
    password = 'ChangeMeNow123!'
  }
}
$adminToken = $adminLogin.accessToken

$memberCreate = Test-Step 'Create member' {
  Invoke-Api POST '/admin/members' @{
    firstName = 'Test'
    lastName = 'Member'
    email = 'test.member2@olsclebanon.com'
    officialMemberId = 'OLSC-2026-002'
    seasonLabel = '2025/26'
    sendInvitation = $true
  } $adminToken
}
$inviteToken = $memberCreate.invitationToken

Test-Step 'Accept invitation' {
  Invoke-Api POST '/auth/accept-invitation' @{
    token = $inviteToken
    password = 'MemberPass123!'
  }
}

$memberLogin = Test-Step 'Member login' {
  Invoke-Api POST '/auth/login' @{
    email = 'test.member2@olsclebanon.com'
    password = 'MemberPass123!'
  }
}
$memberToken = $memberLogin.accessToken

Test-Step 'Membership card' {
  Invoke-Api GET '/memberships/me/card' $null $memberToken
}

Test-Step 'Update profile' {
  Invoke-Api PUT '/users/me' @{
    firstName = 'Test'
    lastName = 'Kop'
    favoritePlayer = 'Gakpo'
    avatarUrl = 'https://example.com/avatar.png'
  } $memberToken
}

$news = Test-Step 'Publish news' {
  Invoke-Api POST '/admin/news' @{
    title = 'OLSC Test News'
    slug = 'olsc-test-news-2'
    excerpt = 'Test excerpt'
    content = 'Full test content for OLSC platform.'
    status = 'PUBLISHED'
    publishedAt = (Get-Date).ToUniversalTime().ToString('o')
  } $adminToken
}

$event = Test-Step 'Create event' {
  Invoke-Api POST '/admin/events' @{
    title = 'Watch Party Test 2'
    description = 'Community watch party event.'
    location = 'Beirut'
    startDateTime = (Get-Date).AddDays(7).ToUniversalTime().ToString('o')
    capacity = 50
  } $adminToken
}
$eventId = $event.eventId

# registrationOpen defaults to true in schema; update only if needed
if ($eventId) {
  Test-Step 'Ensure event registration open' {
    Invoke-Api PUT "/admin/events/$eventId" @{
      registrationOpen = $true
    } $adminToken
  }
}

$match = Test-Step 'Create Liverpool match' {
  $opens = (Get-Date).AddHours(-1).ToUniversalTime().ToString('o')
  $closes = (Get-Date).AddDays(1).ToUniversalTime().ToString('o')
  $kickoff = (Get-Date).AddDays(2).ToUniversalTime().ToString('o')
  Invoke-Api POST '/matches' @{
    opponent = 'Manchester United'
    competition = 'Premier League'
    stadium = 'Anfield'
    matchDate = $kickoff
    predictionOpensAt = $opens
    predictionClosesAt = $closes
    homeTeamName = 'Liverpool'
    awayTeamName = 'Manchester United'
  } $adminToken
}
$matchId = $match.matchId

Test-Step 'Submit prediction' {
  Invoke-Api POST '/predictions' @{
    matchId = $matchId
    predictedHomeScore = 2
    predictedAwayScore = 1
    winnerPrediction = 'HOME_WIN'
    firstLiverpoolGoalscorer = 'Gakpo'
  } $memberToken
}

Test-Step 'Enter match result' {
  Invoke-Api PUT "/matches/$matchId/result" @{
    finalHomeScore = 2
    finalAwayScore = 1
    winningOutcome = 'HOME_WIN'
    firstLiverpoolScorer = 'Gakpo'
  } $adminToken
}

Test-Step 'Calculate scores' {
  Invoke-Api POST '/predictions/calculate-score' @{ matchId = $matchId } $adminToken
}

Test-Step 'Leaderboard' {
  Invoke-Api GET '/leaderboards/overall' $null $memberToken
}

Test-Step 'Member profile gamification' {
  Invoke-Api GET '/users/me' $null $memberToken
}

Test-Step 'Admin dashboard' {
  Invoke-Api GET '/admin/dashboard' $null $adminToken
}

Test-Step 'Community feed' {
  Invoke-Api GET '/community/feed' $null $memberToken
}

Test-Step 'Event registration' {
  Invoke-Api POST "/events/$eventId/register" @{} $memberToken
}

Test-Step 'Notifications' {
  Invoke-Api GET '/notifications' $null $memberToken
}

$newsId = $news.articleId
Test-Step 'News comment' {
  Invoke-Api POST "/news/$newsId/comments" @{ content = 'Great news from OLSC!' } $memberToken
}

Test-Step 'News reaction' {
  Invoke-Api POST "/news/$newsId/reactions" @{ reactionType = 'LIKE' } $memberToken
}

Test-Step 'Hall of fame' {
  Invoke-Api GET '/hall-of-fame'
}

Test-Step 'Admin event registrations' {
  Invoke-Api GET "/admin/events/$eventId/registrations" $null $adminToken
}

Write-Host ''
Write-Host '=== Summary ===' -ForegroundColor Cyan
$results | Format-Table -AutoSize
