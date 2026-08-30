import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../features/auth/auth-context';
import { apiRequest } from '../../lib/api';
import { GoalCelebrationOverlay } from './goal-celebration-overlay';

export type GoalAlertMetadata = {
  scorerName?: string;
  minute?: number;
  homeScore?: number;
  awayScore?: number;
  homeTeam?: string;
  awayTeam?: string;
  isLiverpoolGoal?: boolean;
  comment?: string;
  updateKind?: 'HALF_TIME' | 'SECOND_HALF' | 'FULL_TIME' | 'COMMENT' | string;
};

export type GoalAlert = {
  id: string;
  title: string;
  message?: string | null;
  type: string;
  actionUrl?: string | null;
  metadata?: GoalAlertMetadata | null;
};

const GOAL_TYPES = new Set(['MATCH_GOAL', 'MATCH_GOAL_OPPONENT', 'MATCH_LIVE', 'MATCH_UPDATE']);

function parseGoalMetadata(message?: string | null): GoalAlertMetadata | null {
  if (!message) {
    return null;
  }

  const match = message.match(/^(.+?)(\s+(\d+)')?\s*—\s*(.+?)\.\s*(.*)$/);
  if (!match) {
    return null;
  }

  const [, scorerPart, , minuteStr, scorePart] = match;
  const scoreMatch = scorePart.match(/^(.+?)\s+(\d+)[–-](\d+)\s+(.+)$/);
  if (!scoreMatch) {
    return { scorerName: scorerPart.trim(), minute: minuteStr ? Number(minuteStr) : undefined };
  }

  return {
    scorerName: scorerPart.trim(),
    minute: minuteStr ? Number(minuteStr) : undefined,
    homeTeam: scoreMatch[1].trim(),
    homeScore: Number(scoreMatch[2]),
    awayScore: Number(scoreMatch[3]),
    awayTeam: scoreMatch[4].trim(),
  };
}

export function useLiveGoalAlerts() {
  const { accessToken, isAuthenticated } = useAuth();
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [activeAlert, setActiveAlert] = useState<GoalAlert | null>(null);
  const bootstrappedRef = useRef(false);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'live-alerts'],
    queryFn: () =>
      apiRequest<
        Array<{
          id: string;
          title: string;
          message?: string | null;
          type: string;
          actionUrl?: string | null;
          metadata?: GoalAlertMetadata | null;
          createdAt: string;
        }>
      >('/notifications', { token: accessToken }),
    enabled: Boolean(accessToken && isAuthenticated),
    refetchInterval: 3_000,
  });

  useEffect(() => {
    const items = notificationsQuery.data;
    if (!items?.length) {
      return;
    }

    if (!bootstrappedRef.current) {
      items.forEach((item) => seenIdsRef.current.add(item.id));
      bootstrappedRef.current = true;
      return;
    }

    const freshGoal = items.find(
      (item) => GOAL_TYPES.has(item.type) && !seenIdsRef.current.has(item.id),
    );

    if (!freshGoal) {
      return;
    }

    seenIdsRef.current.add(freshGoal.id);
    setActiveAlert({
      id: freshGoal.id,
      title: freshGoal.title,
      message: freshGoal.message,
      type: freshGoal.type,
      actionUrl: freshGoal.actionUrl,
      metadata: freshGoal.metadata ?? parseGoalMetadata(freshGoal.message),
    });
  }, [notificationsQuery.data]);

  useEffect(() => {
    if (!activeAlert) {
      return;
    }

    const timeout = window.setTimeout(() => setActiveAlert(null), 12_000);
    return () => window.clearTimeout(timeout);
  }, [activeAlert]);

  return { activeAlert, dismiss: () => setActiveAlert(null) };
}

export function LiveGoalProvider({ children }: { children: React.ReactNode }) {
  const { activeAlert, dismiss } = useLiveGoalAlerts();

  return (
    <>
      {children}
      {activeAlert ? <GoalCelebrationOverlay alert={activeAlert} onDismiss={dismiss} /> : null}
    </>
  );
}
