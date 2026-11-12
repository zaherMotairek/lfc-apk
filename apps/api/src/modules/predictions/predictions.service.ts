import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  AchievementType,
  MatchStatus,
  MembershipStatus,
  PlatformAccountStatus,
  Prisma,
  WinnerPrediction,
} from '@prisma/client';
import { LIVERPOOL_SQUAD_2025_26, PREDICTION_SCORING } from '@kop/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import {
  calculatePredictionPoints,
  isLiverpoolMatch,
} from '../../common/utils/match-scoring.utils';
import {
  assertKickoffEligibleForLive,
  liveKickoffWindowStart,
  staleLiveCutoff,
  staleUpcomingCutoff,
  validateMatchSchedule,
} from '../../common/utils/schedule-dates';
import {
  CalculateScoreDto,
  CreateMatchDto,
  LiveMatchUpdateDto,
  RecordGoalDto,
  SubmitPredictionDto,
  UpdateMatchResultDto,
  UpdateScoringRuleDto,
} from './dto/predictions.dto';

@Injectable()
export class PredictionsService implements OnModuleInit, OnModuleDestroy {
  private autoStartTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  onModuleInit() {
    void this.autoResolveStaleMatches().then(() => this.autoStartDueMatches());
    this.autoStartTimer = setInterval(() => {
      void this.autoResolveStaleMatches().then(() => this.autoStartDueMatches());
    }, 60_000);
  }

  onModuleDestroy() {
    if (this.autoStartTimer) {
      clearInterval(this.autoStartTimer);
    }
  }

  async listMatches() {
    await this.autoResolveStaleMatches();
    await this.autoStartDueMatches();

    const matches = await this.prisma.match.findMany({
      orderBy: { matchDate: 'asc' },
      include: {
        _count: {
          select: { predictions: true },
        },
      },
    });

    const now = Date.now();
    return matches.map((match) => {
      const opensAt = match.predictionOpensAt?.getTime() ?? 0;
      const closesAt = match.predictionClosesAt.getTime();
      const predictionsOpen =
        match.status === MatchStatus.UPCOMING &&
        now >= opensAt &&
        now < closesAt;

      return {
        ...match,
        predictionsOpen,
        isLiverpoolMatch: isLiverpoolMatch(match),
      };
    });
  }

  async getMatchHub(matchId: string, userId?: string) {
    await this.autoResolveStaleMatches();
    await this.autoStartDueMatches();

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        _count: {
          select: { predictions: true },
        },
        predictions: true,
        goals: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const total = match.predictions.length;
    const homeWins = match.predictions.filter(
      (item) => item.winnerPrediction === WinnerPrediction.HOME_WIN,
    ).length;
    const draws = match.predictions.filter(
      (item) => item.winnerPrediction === WinnerPrediction.DRAW,
    ).length;
    const awayWins = match.predictions.filter(
      (item) => item.winnerPrediction === WinnerPrediction.AWAY_WIN,
    ).length;

    const myPrediction = userId
      ? match.predictions.find((item) => item.userId === userId) ?? null
      : null;

    const now = Date.now();
    const closesAt = match.predictionClosesAt.getTime();
    const opensAt = match.predictionOpensAt?.getTime() ?? 0;
    const predictionsOpen =
      match.status === MatchStatus.UPCOMING &&
      now >= opensAt &&
      now < closesAt;

    return {
      id: match.id,
      opponent: match.opponent,
      competition: match.competition,
      stadium: match.stadium,
      matchDate: match.matchDate,
      status: match.status,
      homeTeamName: match.homeTeamName,
      awayTeamName: match.awayTeamName,
      isLiverpoolMatch: isLiverpoolMatch(match),
      liverpoolPlayers: isLiverpoolMatch(match) ? LIVERPOOL_SQUAD_2025_26.map((p) => ({ ...p })) : [],
      scoring: {
        exactScorePoints: PREDICTION_SCORING.exactScorePoints,
        winnerPoints: PREDICTION_SCORING.winnerPoints,
        liverpoolMultiplier: PREDICTION_SCORING.liverpoolMultiplier,
        firstGoalscorerPoints: PREDICTION_SCORING.firstGoalscorerPoints,
        cleanSheetPoints: PREDICTION_SCORING.cleanSheetPoints,
      },
      predictionOpensAt: match.predictionOpensAt,
      predictionClosesAt: match.predictionClosesAt,
      predictionsOpen,
      countdownSeconds: Math.max(0, Math.floor((match.matchDate.getTime() - now) / 1000)),
      liveHomeScore: match.liveHomeScore,
      liveAwayScore: match.liveAwayScore,
      liveGoals: match.goals.map((goal) => ({
        id: goal.id,
        minute: goal.minute,
        scorerName: goal.scorerName,
        homeScoreAfter: goal.homeScoreAfter,
        awayScoreAfter: goal.awayScoreAfter,
        isLiverpoolGoal: goal.isLiverpoolGoal,
        createdAt: goal.createdAt,
      })),
      finalHomeScore: match.finalHomeScore,
      finalAwayScore: match.finalAwayScore,
      communityStats: {
        predictionCount: total,
        homeWinPercentage: total ? Math.round((homeWins / total) * 100) : 0,
        drawPercentage: total ? Math.round((draws / total) * 100) : 0,
        awayWinPercentage: total ? Math.round((awayWins / total) * 100) : 0,
        mostPickedWinner:
          homeWins >= draws && homeWins >= awayWins
            ? WinnerPrediction.HOME_WIN
            : draws >= awayWins
              ? WinnerPrediction.DRAW
              : WinnerPrediction.AWAY_WIN,
      },
      myPrediction: myPrediction
        ? {
            id: myPrediction.id,
            predictedHomeScore: myPrediction.predictedHomeScore,
            predictedAwayScore: myPrediction.predictedAwayScore,
            winnerPrediction: myPrediction.winnerPrediction,
            firstLiverpoolGoalscorer: myPrediction.firstLiverpoolGoalscorer,
            manOfTheMatchPrediction: myPrediction.manOfTheMatchPrediction,
            cleanSheetPrediction: myPrediction.cleanSheetPrediction,
            bothTeamsToScorePrediction: myPrediction.bothTeamsToScorePrediction,
            totalPoints: myPrediction.totalPoints,
            calculatedAt: myPrediction.calculatedAt,
          }
        : null,
      result:
        match.status === MatchStatus.FINISHED
          ? {
              finalHomeScore: match.finalHomeScore,
              finalAwayScore: match.finalAwayScore,
              winningOutcome: match.winningOutcome,
              firstLiverpoolScorer: match.firstLiverpoolScorer,
              manOfTheMatch: match.manOfTheMatch,
              cleanSheetResult: match.cleanSheetResult,
              bothTeamsToScoreResult: match.bothTeamsToScoreResult,
            }
          : null,
    };
  }

  async createMatch(dto: CreateMatchDto, actorUserId: string) {
    validateMatchSchedule(dto.matchDate, dto.predictionClosesAt, dto.predictionOpensAt);

    const match = await this.prisma.match.create({
      data: {
        opponent: dto.opponent,
        competition: dto.competition,
        stadium: dto.stadium,
        matchDate: dto.matchDate,
        predictionOpensAt: dto.predictionOpensAt ?? new Date(),
        predictionClosesAt: dto.predictionClosesAt,
        homeTeamName: dto.homeTeamName ?? 'Liverpool',
        awayTeamName: dto.awayTeamName,
        createdById: actorUserId,
        status: MatchStatus.UPCOMING,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'CREATE_MATCH',
      entityType: 'MATCH',
      entityId: match.id,
    });

    return {
      message: 'Match created successfully.',
      matchId: match.id,
    };
  }

  async updateMatchResult(matchId: string, dto: UpdateMatchResultDto, actorUserId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        finalHomeScore: dto.finalHomeScore,
        finalAwayScore: dto.finalAwayScore,
        winningOutcome: dto.winningOutcome,
        firstLiverpoolScorer: dto.firstLiverpoolScorer,
        manOfTheMatch: dto.manOfTheMatch,
        cleanSheetResult: dto.cleanSheetResult,
        bothTeamsToScoreResult: dto.bothTeamsToScoreResult,
        status: MatchStatus.FINISHED,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'UPDATE_MATCH_RESULT',
      entityType: 'MATCH',
      entityId: matchId,
    });

    return {
      message: 'Match result updated successfully.',
      match: updated,
    };
  }

  async setMatchLive(matchId: string, actorUserId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    if (!isLiverpoolMatch(match)) {
      throw new BadRequestException('Live mode is only available for Liverpool matches');
    }
    if (match.status === MatchStatus.FINISHED) {
      throw new BadRequestException('Match is already finished');
    }

    assertKickoffEligibleForLive(match.matchDate);

    const updated = await this.startMatchLiveInternal(match, {
      actorUserId,
      auditAction: 'SET_MATCH_LIVE',
    });

    return {
      message: 'Match is now LIVE. Members will receive kick-off alerts.',
      match: updated,
    };
  }

  async recordGoal(matchId: string, dto: RecordGoalDto, actorUserId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    if (!isLiverpoolMatch(match)) {
      throw new BadRequestException('Live updates are only available for Liverpool matches');
    }
    if (match.status === MatchStatus.FINISHED) {
      throw new BadRequestException('Cannot record goals on a finished match');
    }

    const prevHome = match.liveHomeScore ?? match.finalHomeScore ?? 0;
    const prevAway = match.liveAwayScore ?? match.finalAwayScore ?? 0;
    if (dto.homeScore < prevHome || dto.awayScore < prevAway) {
      throw new BadRequestException('Live score cannot go backwards');
    }
    if (dto.homeScore === prevHome && dto.awayScore === prevAway) {
      throw new BadRequestException('Score must change when recording a goal');
    }

    const goal = await this.prisma.$transaction(async (tx) => {
      const createdGoal = await tx.matchGoal.create({
        data: {
          matchId,
          minute: dto.minute,
          scorerName: dto.scorerName?.trim() || null,
          homeScoreAfter: dto.homeScore,
          awayScoreAfter: dto.awayScore,
          isLiverpoolGoal: dto.isLiverpoolGoal,
        },
      });

      await tx.match.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.LIVE,
          liveHomeScore: dto.homeScore,
          liveAwayScore: dto.awayScore,
        },
      });

      return createdGoal;
    });

    const scoreLine = `${match.homeTeamName} ${dto.homeScore}–${dto.awayScore} ${match.awayTeamName}`;
    const minuteLabel = dto.minute != null ? ` ${dto.minute}'` : '';
    const scorerLabel = dto.scorerName?.trim() ? dto.scorerName.trim() : match.homeTeamName;
    const comment = dto.comment?.trim();
    const commentSuffix = comment ? ` — ${comment}` : '';

    if (dto.isLiverpoolGoal) {
      await this.broadcastMatchNotification({
        type: 'MATCH_GOAL',
        title: 'GOOOOAAAAAL! 🔴⚽',
        message: `${scorerLabel}${minuteLabel} — ${scoreLine}.${commentSuffix} YNWA!`.replace('. —', ' —'),
        actionUrl: `/app/matches/${match.id}`,
        metadata: {
          scorerName: dto.scorerName?.trim() || match.homeTeamName,
          minute: dto.minute ?? undefined,
          homeScore: dto.homeScore,
          awayScore: dto.awayScore,
          homeTeam: match.homeTeamName,
          awayTeam: match.awayTeamName,
          isLiverpoolGoal: true,
          comment: comment || undefined,
        },
      });
    } else {
      await this.broadcastMatchNotification({
        type: 'MATCH_GOAL_OPPONENT',
        title: 'Opponent scores 😬',
        message: `${match.awayTeamName}${minuteLabel} — ${scoreLine}${commentSuffix}`,
        actionUrl: `/app/matches/${match.id}`,
        metadata: {
          scorerName: dto.scorerName?.trim() || match.awayTeamName,
          minute: dto.minute ?? undefined,
          homeScore: dto.homeScore,
          awayScore: dto.awayScore,
          homeTeam: match.homeTeamName,
          awayTeam: match.awayTeamName,
          isLiverpoolGoal: false,
          comment: comment || undefined,
        },
      });
    }

    await this.auditService.log({
      actorUserId,
      action: 'RECORD_MATCH_GOAL',
      entityType: 'MATCH',
      entityId: matchId,
      metadata: { goalId: goal.id, isLiverpoolGoal: dto.isLiverpoolGoal },
    });

    return {
      message: dto.isLiverpoolGoal
        ? 'GOAL recorded! Kop members have been notified.'
        : 'Goal recorded and members notified.',
      goal,
      liveHomeScore: dto.homeScore,
      liveAwayScore: dto.awayScore,
    };
  }

  async deleteMatch(matchId: string, actorUserId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    await this.prisma.match.delete({ where: { id: matchId } });

    await this.auditService.log({
      actorUserId,
      action: 'DELETE_MATCH',
      entityType: 'MATCH',
      entityId: matchId,
    });

    return { message: 'Match deleted successfully.' };
  }

  async sendLiveUpdate(matchId: string, dto: LiveMatchUpdateDto, actorUserId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    if (!isLiverpoolMatch(match)) {
      throw new BadRequestException('Live updates are only available for Liverpool matches');
    }
    if (match.status === MatchStatus.FINISHED) {
      throw new BadRequestException('Match is already finished');
    }

    const homeScore = match.liveHomeScore ?? 0;
    const awayScore = match.liveAwayScore ?? 0;
    const scoreLine = `${match.homeTeamName} ${homeScore}–${awayScore} ${match.awayTeamName}`;
    const minuteLabel = dto.minute != null ? ` (${dto.minute}')` : '';
    const comment = dto.comment?.trim();

    const presets: Record<
      LiveMatchUpdateDto['kind'],
      { title: string; message: string }
    > = {
      HALF_TIME: {
        title: 'Half-time',
        message: comment
          ? `HT${minuteLabel} ${scoreLine} — ${comment}`
          : `Half-time${minuteLabel}: ${scoreLine}`,
      },
      SECOND_HALF: {
        title: 'Second half',
        message: comment
          ? `Second half underway${minuteLabel} — ${comment}`
          : `Second half underway${minuteLabel}. ${scoreLine}`,
      },
      FULL_TIME: {
        title: 'Full-time',
        message: comment
          ? `FT ${scoreLine} — ${comment}`
          : `Full-time: ${scoreLine}`,
      },
      COMMENT: {
        title: 'Live update',
        message: comment
          ? `${comment}${minuteLabel ? ` ${minuteLabel}` : ''} — ${scoreLine}`
          : `Live update${minuteLabel}: ${scoreLine}`,
      },
    };

    if (dto.kind === 'COMMENT' && !comment) {
      throw new BadRequestException('Write a comment before sending an update.');
    }

    const preset = presets[dto.kind];

    await this.broadcastMatchNotification({
      type: 'MATCH_UPDATE',
      title: preset.title,
      message: preset.message,
      actionUrl: `/app/matches/${match.id}`,
      metadata: {
        updateKind: dto.kind,
        minute: dto.minute ?? undefined,
        comment: comment || undefined,
        homeScore,
        awayScore,
        homeTeam: match.homeTeamName,
        awayTeam: match.awayTeamName,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'SEND_MATCH_UPDATE',
      entityType: 'MATCH',
      entityId: matchId,
      metadata: { kind: dto.kind },
    });

    return {
      message: 'Update sent to members.',
    };
  }

  private async autoResolveStaleMatches() {
    const now = new Date();

    await this.prisma.match.updateMany({
      where: {
        status: MatchStatus.LIVE,
        matchDate: { lt: staleLiveCutoff(now) },
      },
      data: { status: MatchStatus.FINISHED },
    });

    await this.prisma.match.updateMany({
      where: {
        status: MatchStatus.UPCOMING,
        matchDate: { lt: staleUpcomingCutoff(now) },
      },
      data: { status: MatchStatus.CANCELED },
    });
  }

  private async autoStartDueMatches() {
    const now = new Date();
    const windowStart = liveKickoffWindowStart(now);
    const dueMatches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.UPCOMING,
        matchDate: { lte: now, gte: windowStart },
      },
    });

    for (const match of dueMatches) {
      if (!isLiverpoolMatch(match)) {
        continue;
      }

      await this.startMatchLiveInternal(match, {
        auditAction: 'AUTO_START_MATCH_LIVE',
      });
    }
  }

  private async startMatchLiveInternal(
    match: {
      id: string;
      homeTeamName: string;
      awayTeamName: string;
      liveHomeScore: number | null;
      liveAwayScore: number | null;
    },
    options?: {
      actorUserId?: string;
      auditAction?: string;
    },
  ) {
    const homeScore = match.liveHomeScore ?? 0;
    const awayScore = match.liveAwayScore ?? 0;

    const updated = await this.prisma.match.updateMany({
      where: {
        id: match.id,
        status: MatchStatus.UPCOMING,
      },
      data: {
        status: MatchStatus.LIVE,
        liveHomeScore: homeScore,
        liveAwayScore: awayScore,
      },
    });

    if (updated.count === 0) {
      return null;
    }

    const liveMatch = await this.prisma.match.findUnique({ where: { id: match.id } });
    if (!liveMatch) {
      return null;
    }

    await this.broadcastMatchNotification({
      type: 'MATCH_LIVE',
      title: 'KICK OFF! 🔴',
      message: `${match.homeTeamName} vs ${match.awayTeamName} is LIVE — follow every moment in Match Hub!`,
      actionUrl: `/app/matches/${match.id}`,
      metadata: {
        homeTeam: match.homeTeamName,
        awayTeam: match.awayTeamName,
        homeScore,
        awayScore,
      },
    });

    if (options?.auditAction) {
      await this.auditService.log({
        actorUserId: options.actorUserId ?? null,
        action: options.auditAction,
        entityType: 'MATCH',
        entityId: match.id,
      });
    }

    return liveMatch;
  }

  private async broadcastMatchNotification(input: {
    type: string;
    title: string;
    message: string;
    actionUrl: string;
    metadata?: Record<string, unknown>;
  }) {
    const activeUsers = await this.prisma.user.findMany({
      where: { platformAccountStatus: PlatformAccountStatus.ACTIVE },
      select: { id: true },
    });

    if (!activeUsers.length) {
      return;
    }

    await this.prisma.notification.createMany({
      data: activeUsers.map((user) => ({
        userId: user.id,
        type: input.type,
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl,
        metadata: (input.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      })),
    });
  }

  async submitPrediction(userId: string, dto: SubmitPredictionDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { status: MembershipStatus.ACTIVE },
          take: 1,
        },
      },
    });

    if (!user || user.platformAccountStatus !== PlatformAccountStatus.ACTIVE) {
      throw new BadRequestException('Active platform account required');
    }

    if (!user.memberships.length) {
      throw new BadRequestException('Active official membership required');
    }

    const match = await this.prisma.match.findUnique({ where: { id: dto.matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const now = Date.now();
    const opensAt = match.predictionOpensAt?.getTime() ?? 0;
    if (now < opensAt) {
      throw new BadRequestException('Predictions are not open yet');
    }
    if (now >= match.predictionClosesAt.getTime() || match.status !== MatchStatus.UPCOMING) {
      throw new BadRequestException('Predictions are closed for this match');
    }

    if (isLiverpoolMatch(match) && typeof dto.cleanSheetPrediction !== 'boolean') {
      throw new BadRequestException('Choose Yes or No for Liverpool clean sheet');
    }

    const prediction = await this.prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId,
          matchId: dto.matchId,
        },
      },
      update: {
        predictedHomeScore: dto.predictedHomeScore,
        predictedAwayScore: dto.predictedAwayScore,
        winnerPrediction: dto.winnerPrediction,
        firstLiverpoolGoalscorer: dto.firstLiverpoolGoalscorer,
        manOfTheMatchPrediction: dto.manOfTheMatchPrediction,
        cleanSheetPrediction: dto.cleanSheetPrediction,
        bothTeamsToScorePrediction: dto.bothTeamsToScorePrediction,
      },
      create: {
        userId,
        matchId: dto.matchId,
        predictedHomeScore: dto.predictedHomeScore,
        predictedAwayScore: dto.predictedAwayScore,
        winnerPrediction: dto.winnerPrediction,
        firstLiverpoolGoalscorer: dto.firstLiverpoolGoalscorer,
        manOfTheMatchPrediction: dto.manOfTheMatchPrediction,
        cleanSheetPrediction: dto.cleanSheetPrediction,
        bothTeamsToScorePrediction: dto.bothTeamsToScorePrediction,
      },
    });

    return {
      message: 'Prediction submitted successfully.',
      predictionId: prediction.id,
    };
  }

  async getMyPredictions(userId: string) {
    return this.prisma.prediction.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      include: {
        match: true,
      },
    });
  }

  async getActiveScoringRule() {
    const rule = await this.prisma.scoringRule.findFirst({
      where: { isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!rule) {
      throw new NotFoundException('No active scoring rule found. Run seed first.');
    }

    return rule;
  }

  async updateScoringRule(dto: UpdateScoringRuleDto, actorUserId: string) {
    await this.prisma.scoringRule.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const rule = await this.prisma.scoringRule.create({
      data: {
        correctWinnerPoints: dto.correctWinnerPoints ?? PREDICTION_SCORING.winnerPoints,
        correctFinalScorePoints: dto.correctFinalScorePoints ?? PREDICTION_SCORING.exactScorePoints,
        correctFirstScorerPoints: dto.correctFirstScorerPoints ?? PREDICTION_SCORING.firstGoalscorerPoints,
        correctManOfTheMatchPoints: dto.correctManOfTheMatchPoints ?? 0,
        correctCleanSheetPoints: dto.correctCleanSheetPoints ?? PREDICTION_SCORING.cleanSheetPoints,
        correctBothTeamsToScorePoints: dto.correctBothTeamsToScorePoints ?? 0,
        streakBonusEnabled: dto.streakBonusEnabled ?? false,
        streakBonusPoints: dto.streakBonusPoints ?? 0,
        isActive: true,
        createdById: actorUserId,
      },
    });

    await this.auditService.log({
      actorUserId,
      action: 'UPDATE_SCORING_RULE',
      entityType: 'SCORING_RULE',
      entityId: rule.id,
    });

    return {
      message: 'Scoring rule updated successfully.',
      rule,
    };
  }

  async calculateScores(dto: CalculateScoreDto, actorUserId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: dto.matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    if (match.status !== MatchStatus.FINISHED) {
      throw new BadRequestException('Match result must be set before scoring');
    }

    const rule = await this.getActiveScoringRule();
    const predictions = await this.prisma.prediction.findMany({
      where: { matchId: dto.matchId },
    });

    let processed = 0;
    let exactScoreHits = 0;
    let winnerHits = 0;

    for (const prediction of predictions) {
      const points = calculatePredictionPoints(match, prediction, rule);

      if (points.winnerPoints > 0) winnerHits += 1;
      if (points.scorePoints > 0) exactScoreHits += 1;

      await this.prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          winnerPoints: points.winnerPoints,
          scorePoints: points.scorePoints,
          scorerPoints: points.scorerPoints,
          manOfTheMatchPoints: 0,
          bonusPoints: points.bonusPoints,
          streakBonusPoints: 0,
          totalPoints: points.totalPoints,
          calculatedAt: new Date(),
        },
      });

      if (!prediction.calculatedAt) {
        await this.applyGamificationForPrediction({
          prediction,
          totalPoints: points.totalPoints,
          winnerCorrect: points.winnerPoints > 0,
          exactScoreCorrect: points.scorePoints > 0,
        });
      }

      processed += 1;
    }

    await this.refreshLeaderboardSnapshots();
    await this.assignKingOfTheKop();
    await this.assignPredictionMaster();

    await this.auditService.log({
      actorUserId,
      action: 'CALCULATE_PREDICTION_SCORES',
      entityType: 'MATCH',
      entityId: dto.matchId,
      metadata: { processed, exactScoreHits, winnerHits },
    });

    return {
      message: 'Prediction scores calculated successfully.',
      processedPredictions: processed,
    };
  }

  async getLeaderboard(type: 'overall' | 'weekly' | 'monthly' | 'season') {
    const snapshots = await this.prisma.leaderboardSnapshot.findMany({
      where: { type },
      orderBy: [{ createdAt: 'desc' }, { rank: 'asc' }],
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (snapshots.length) {
      const latestCreatedAt = snapshots[0].createdAt.getTime();
      return {
        type,
        items: snapshots
          .filter((item) => item.createdAt.getTime() === latestCreatedAt)
          .map((item) => ({
            rank: item.rank,
            userId: item.userId,
            fullName: `${item.user.firstName} ${item.user.lastName}`,
            avatarUrl: item.user.avatarUrl,
            totalPoints: item.totalPoints,
            predictionCount: item.predictionCount,
            exactScoreCount: item.exactScoreCount,
            accuracyRate: item.accuracyRate,
          })),
      };
    }

    // Fallback live calculation if no snapshot yet.
    const live = await this.buildLiveLeaderboard();
    return { type, items: live };
  }

  async getAdminDashboard() {
    const [users, activeMembers, pendingInvites, predictions, upcomingMatches, events] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.membership.count({ where: { status: MembershipStatus.ACTIVE } }),
        this.prisma.user.count({ where: { platformAccountStatus: PlatformAccountStatus.INVITED } }),
        this.prisma.prediction.count(),
        this.prisma.match.count({ where: { status: MatchStatus.UPCOMING } }),
        this.prisma.event.count(),
      ]);

    return {
      members: {
        total: users,
        activeMemberships: activeMembers,
        pendingInvites,
      },
      predictions: {
        total: predictions,
      },
      matches: {
        upcoming: upcomingMatches,
      },
      events: {
        total: events,
      },
    };
  }

  private async refreshLeaderboardSnapshots() {
    const live = await this.buildLiveLeaderboard();
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), 0, 1);
    const periodEnd = now;

    await this.prisma.leaderboardSnapshot.createMany({
      data: live.map((item) => ({
        type: 'overall',
        label: `${now.getFullYear()} Overall`,
        periodStart,
        periodEnd,
        userId: item.userId,
        rank: item.rank,
        totalPoints: item.totalPoints,
        predictionCount: item.predictionCount,
        exactScoreCount: item.exactScoreCount,
        accuracyRate: item.accuracyRate,
      })),
    });

    await this.prisma.leaderboardSnapshot.createMany({
      data: live.map((item) => ({
        type: 'season',
        label: `${now.getFullYear()}/${String(now.getFullYear() + 1).slice(-2)} Season`,
        periodStart,
        periodEnd,
        userId: item.userId,
        rank: item.rank,
        totalPoints: item.totalPoints,
        predictionCount: item.predictionCount,
        exactScoreCount: item.exactScoreCount,
        accuracyRate: item.accuracyRate,
      })),
    });
  }

  private async buildLiveLeaderboard() {
    const grouped = await this.prisma.prediction.groupBy({
      by: ['userId'],
      _sum: { totalPoints: true },
      _count: { _all: true },
    });

    const exactScores = await this.prisma.prediction.groupBy({
      by: ['userId'],
      where: { scorePoints: { gt: 0 } },
      _count: { _all: true },
    });

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: grouped.map((item) => item.userId) },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));
    const exactMap = new Map(exactScores.map((item) => [item.userId, item._count._all]));

    return grouped
      .map((item) => {
        const user = userMap.get(item.userId);
        const predictionCount = item._count._all;
        const exactScoreCount = exactMap.get(item.userId) ?? 0;
        const totalPoints = item._sum.totalPoints ?? 0;
        return {
          rank: 0,
          userId: item.userId,
          fullName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          avatarUrl: user?.avatarUrl ?? null,
          totalPoints,
          predictionCount,
          exactScoreCount,
          accuracyRate: predictionCount
            ? Number(((totalPoints / (predictionCount * 10)) * 100).toFixed(1))
            : 0,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }

  private static readonly AWARD_XP_AND_COINS = false;

  private async applyGamificationForPrediction(params: {
    prediction: {
      id: string;
      userId: string;
    };
    totalPoints: number;
    winnerCorrect: boolean;
    exactScoreCorrect: boolean;
  }) {
    if (!PredictionsService.AWARD_XP_AND_COINS) {
      return;
    }

    const baseXp = 10;
    const bonusXp = Math.max(0, Math.floor(params.totalPoints / 2));
    const exactScoreXp = params.exactScoreCorrect ? 10 : 0;
    const winnerStreakXp = params.winnerCorrect ? 5 : 0;
    const xpEarned = baseXp + bonusXp + exactScoreXp + winnerStreakXp;

    const baseCoins = 5;
    const bonusCoins = Math.max(0, Math.floor(params.totalPoints / 3));
    const exactScoreCoins = params.exactScoreCorrect ? 3 : 0;
    const coinsEarned = baseCoins + bonusCoins + exactScoreCoins;

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: params.prediction.userId } });
      if (!user) {
        return;
      }

      const nextCurrentStreak = params.winnerCorrect ? user.currentWinningStreak + 1 : 0;
      const nextLongestStreak = Math.max(user.longestWinningStreak, nextCurrentStreak);

      const updatedXp = user.xp + xpEarned;
      const updatedCoins = user.coins + coinsEarned;

      const levelDefinition = await tx.levelDefinition.findFirst({
        where: { minXp: { lte: updatedXp } },
        orderBy: { level: 'desc' },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          xp: updatedXp,
          coins: updatedCoins,
          level: levelDefinition?.level ?? user.level,
          currentWinningStreak: nextCurrentStreak,
          longestWinningStreak: nextLongestStreak,
        },
      });

      await tx.xpTransaction.create({
        data: {
          userId: user.id,
          amount: xpEarned,
          reason: 'PREDICTION_SCORED',
          referenceId: params.prediction.id,
        },
      });

      await tx.coinTransaction.create({
        data: {
          userId: user.id,
          amount: coinsEarned,
          reason: 'PREDICTION_SCORED',
          referenceId: params.prediction.id,
        },
      });
    });
  }

  private async assignKingOfTheKop() {
    const latestOverall = await this.prisma.leaderboardSnapshot.findFirst({
      where: { type: 'overall' },
      orderBy: [{ createdAt: 'desc' }, { rank: 'asc' }],
    });

    if (!latestOverall) {
      return;
    }

    const def = await this.prisma.achievementDefinition.findUnique({
      where: { code: AchievementType.KING_OF_THE_KOP },
    });

    if (!def) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userAchievement.deleteMany({
        where: { achievementId: def.id },
      });

      await tx.userAchievement.create({
        data: {
          userId: latestOverall.userId,
          achievementId: def.id,
        },
      });
    });
  }

  private async assignPredictionMaster() {
    const def = await this.prisma.achievementDefinition.findUnique({
      where: { code: AchievementType.PREDICTION_MASTER },
    });

    if (!def) {
      return;
    }

    const grouped = await this.prisma.prediction.groupBy({
      by: ['userId'],
      _count: { _all: true },
    });

    for (const row of grouped) {
      if (row._count._all < 10) {
        continue;
      }
      await this.prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId: row.userId,
            achievementId: def.id,
          },
        },
        update: {},
        create: {
          userId: row.userId,
          achievementId: def.id,
        },
      });
    }
  }
}
