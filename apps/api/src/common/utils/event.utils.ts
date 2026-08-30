type EventTiming = {
  startDateTime: Date;
  endDateTime?: Date | null;
};

export function getEventEndTime(event: EventTiming): Date {
  return event.endDateTime ?? event.startDateTime;
}

export function isEventPast(event: EventTiming, now = new Date()): boolean {
  return getEventEndTime(event) < now;
}

export function isRegistrationOpen(
  event: EventTiming & { registrationOpen: boolean },
  now = new Date(),
): boolean {
  if (isEventPast(event, now)) {
    return false;
  }
  return event.registrationOpen;
}

export function upcomingEventsWhere(now = new Date()) {
  return {
    OR: [
      { endDateTime: { gte: now } },
      { endDateTime: null, startDateTime: { gte: now } },
    ],
  };
}
