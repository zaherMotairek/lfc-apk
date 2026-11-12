import { BadRequestException } from '@nestjs/common';

const LIVE_KICKOFF_WINDOW_MS = 2 * 60 * 60 * 1000;
const STALE_UPCOMING_MS = 4 * 60 * 60 * 1000;
const STALE_LIVE_MS = 3 * 60 * 60 * 1000;

export function assertNotInPast(date: Date, label: string, now = new Date()) {
  if (date.getTime() < now.getTime()) {
    throw new BadRequestException(`${label} cannot be in the past.`);
  }
}

export function validateMatchSchedule(
  matchDate: Date,
  predictionClosesAt: Date,
  predictionOpensAt?: Date,
  now = new Date(),
) {
  assertNotInPast(matchDate, 'Kick-off', now);
  assertNotInPast(predictionClosesAt, 'Predictions close time', now);
  if (predictionOpensAt) {
    assertNotInPast(predictionOpensAt, 'Predictions open time', now);
  }
  if (predictionClosesAt.getTime() > matchDate.getTime()) {
    throw new BadRequestException('Predictions must close at or before kick-off.');
  }
}

export function validateEventStart(startDateTime: Date, now = new Date()) {
  assertNotInPast(startDateTime, 'Event start', now);
}

export function validateEventEnd(startDateTime: Date, endDateTime: Date, now = new Date()) {
  assertNotInPast(endDateTime, 'Event end', now);
  if (endDateTime.getTime() < startDateTime.getTime()) {
    throw new BadRequestException('Event end must be after the start time.');
  }
}

export function liveKickoffWindowStart(now = new Date()) {
  return new Date(now.getTime() - LIVE_KICKOFF_WINDOW_MS);
}

export function staleUpcomingCutoff(now = new Date()) {
  return new Date(now.getTime() - STALE_UPCOMING_MS);
}

export function staleLiveCutoff(now = new Date()) {
  return new Date(now.getTime() - STALE_LIVE_MS);
}

export function assertKickoffEligibleForLive(matchDate: Date, now = new Date()) {
  if (matchDate.getTime() > now.getTime()) {
    throw new BadRequestException('Cannot go live before kick-off time.');
  }
  if (matchDate.getTime() < liveKickoffWindowStart(now).getTime()) {
    throw new BadRequestException(
      'Cannot go live — kick-off was too long ago. Update the fixture date or mark the result instead.',
    );
  }
}
