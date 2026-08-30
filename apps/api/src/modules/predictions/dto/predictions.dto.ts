import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { WinnerPrediction } from '@prisma/client';

export class CreateMatchDto {
  @IsString()
  @MinLength(1)
  opponent!: string;

  @IsString()
  @MinLength(1)
  competition!: string;

  @IsOptional()
  @IsString()
  stadium?: string;

  @Type(() => Date)
  @IsDate()
  matchDate!: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  predictionOpensAt?: Date;

  @Type(() => Date)
  @IsDate()
  predictionClosesAt!: Date;

  @IsOptional()
  @IsString()
  homeTeamName?: string;

  @IsString()
  @MinLength(1)
  awayTeamName!: string;
}

export class UpdateMatchResultDto {
  @IsInt()
  @Min(0)
  finalHomeScore!: number;

  @IsInt()
  @Min(0)
  finalAwayScore!: number;

  @IsEnum(WinnerPrediction)
  winningOutcome!: WinnerPrediction;

  @IsOptional()
  @IsString()
  firstLiverpoolScorer?: string;

  @IsOptional()
  @IsString()
  manOfTheMatch?: string;

  @IsOptional()
  @IsBoolean()
  cleanSheetResult?: boolean;

  @IsOptional()
  @IsBoolean()
  bothTeamsToScoreResult?: boolean;
}

export class SubmitPredictionDto {
  @IsString()
  matchId!: string;

  @IsInt()
  @Min(0)
  predictedHomeScore!: number;

  @IsInt()
  @Min(0)
  predictedAwayScore!: number;

  @IsEnum(WinnerPrediction)
  winnerPrediction!: WinnerPrediction;

  @IsOptional()
  @IsString()
  firstLiverpoolGoalscorer?: string;

  @IsOptional()
  @IsString()
  manOfTheMatchPrediction?: string;

  @IsOptional()
  @IsBoolean()
  cleanSheetPrediction?: boolean;

  @IsOptional()
  @IsBoolean()
  bothTeamsToScorePrediction?: boolean;
}

export class UpdateScoringRuleDto {
  @IsOptional()
  @IsInt()
  correctWinnerPoints?: number;

  @IsOptional()
  @IsInt()
  correctFinalScorePoints?: number;

  @IsOptional()
  @IsInt()
  correctFirstScorerPoints?: number;

  @IsOptional()
  @IsInt()
  correctManOfTheMatchPoints?: number;

  @IsOptional()
  @IsInt()
  correctCleanSheetPoints?: number;

  @IsOptional()
  @IsInt()
  correctBothTeamsToScorePoints?: number;

  @IsOptional()
  @IsBoolean()
  streakBonusEnabled?: boolean;

  @IsOptional()
  @IsInt()
  streakBonusPoints?: number;
}

export class CalculateScoreDto {
  @IsString()
  matchId!: string;
}

export class RecordGoalDto {
  @IsInt()
  @Min(0)
  homeScore!: number;

  @IsInt()
  @Min(0)
  awayScore!: number;

  @IsOptional()
  @IsString()
  scorerName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minute?: number;

  @IsBoolean()
  isLiverpoolGoal!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  comment?: string;
}

export class LiveMatchUpdateDto {
  @IsIn(['HALF_TIME', 'SECOND_HALF', 'FULL_TIME', 'COMMENT'])
  kind!: 'HALF_TIME' | 'SECOND_HALF' | 'FULL_TIME' | 'COMMENT';

  @IsOptional()
  @IsInt()
  @Min(0)
  minute?: number;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  comment?: string;
}
