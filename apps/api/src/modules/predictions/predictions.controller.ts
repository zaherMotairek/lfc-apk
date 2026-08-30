import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PermissionCode } from '@kop/shared';
import { PredictionsService } from './predictions.service';
import {
  CalculateScoreDto,
  CreateMatchDto,
  LiveMatchUpdateDto,
  RecordGoalDto,
  SubmitPredictionDto,
  UpdateMatchResultDto,
  UpdateScoringRuleDto,
} from './dto/predictions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller()
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get('matches')
  listMatches() {
    return this.predictionsService.listMatches();
  }

  @UseGuards(JwtAuthGuard)
  @Get('matches/:id')
  getMatchHub(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.predictionsService.getMatchHub(id, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_MATCHES)
  @Post('matches')
  createMatch(
    @Body() dto: CreateMatchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.predictionsService.createMatch(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_MATCHES)
  @Put('matches/:id/result')
  updateMatchResult(
    @Param('id') id: string,
    @Body() dto: UpdateMatchResultDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.predictionsService.updateMatchResult(id, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_MATCHES)
  @Put('matches/:id/live')
  setMatchLive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.predictionsService.setMatchLive(id, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_MATCHES)
  @Post('matches/:id/goals')
  recordGoal(
    @Param('id') id: string,
    @Body() dto: RecordGoalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.predictionsService.recordGoal(id, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_MATCHES)
  @Delete('matches/:id')
  deleteMatch(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.predictionsService.deleteMatch(id, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_MATCHES)
  @Post('matches/:id/updates')
  sendLiveUpdate(
    @Param('id') id: string,
    @Body() dto: LiveMatchUpdateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.predictionsService.sendLiveUpdate(id, dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('predictions')
  submitPrediction(
    @Body() dto: SubmitPredictionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.predictionsService.submitPrediction(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('predictions/my')
  getMyPredictions(@CurrentUser() user: AuthenticatedUser) {
    return this.predictionsService.getMyPredictions(user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_SCORING)
  @Post('predictions/calculate-score')
  calculateScore(
    @Body() dto: CalculateScoreDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.predictionsService.calculateScores(dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('leaderboards/overall')
  overallLeaderboard() {
    return this.predictionsService.getLeaderboard('overall');
  }

  @UseGuards(JwtAuthGuard)
  @Get('leaderboards/weekly')
  weeklyLeaderboard() {
    return this.predictionsService.getLeaderboard('weekly');
  }

  @UseGuards(JwtAuthGuard)
  @Get('leaderboards/monthly')
  monthlyLeaderboard() {
    return this.predictionsService.getLeaderboard('monthly');
  }

  @UseGuards(JwtAuthGuard)
  @Get('leaderboards/season')
  seasonLeaderboard() {
    return this.predictionsService.getLeaderboard('season');
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_SCORING)
  @Get('admin/scoring-rules/active')
  getActiveScoringRule() {
    return this.predictionsService.getActiveScoringRule();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.MANAGE_SCORING)
  @Put('admin/scoring-rules')
  updateScoringRule(
    @Body() dto: UpdateScoringRuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.predictionsService.updateScoringRule(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.VIEW_ANALYTICS)
  @Get('admin/dashboard')
  getDashboard() {
    return this.predictionsService.getAdminDashboard();
  }
}
