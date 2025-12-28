export type SeasonalEvent =
  | 'black_history_month'
  | 'hispanic_heritage'
  | 'winter_holidays'
  | 'independence_day'
  | 'spring_festival'
  | 'pride_month'
  | 'presidents_day'
  | 'thanksgiving'
  | 'valentines_day'
  | 'st_patricks_day'
  | 'memorial_day'
  | 'labor_day'
  | 'veterans_day'
  | 'christmas'
  | 'new_year'
  | 'easter'
  | 'halloween'
  | 'summer_solstice'
  | 'winter_solstice'
  | 'earth_day';

export const eventRanges: Record<SeasonalEvent, { start: string; end: string }> = {
  black_history_month: {
    start: '02-01',
    end: '02-28',
  },
  hispanic_heritage: {
    start: '09-15',
    end: '10-15',
  },
  winter_holidays: {
    start: '12-20',
    end: '01-05',
  },
  independence_day: {
    start: '07-01',
    end: '07-05',
  },
  spring_festival: {
    start: '04-01',
    end: '04-14',
  },
  pride_month: {
    start: '06-01',
    end: '06-30',
  },
  presidents_day: {
    start: '02-15',
    end: '02-22',
  },
  thanksgiving: {
    start: '11-20',
    end: '11-30',
  },
  valentines_day: {
    start: '02-10',
    end: '02-16',
  },
  st_patricks_day: {
    start: '03-15',
    end: '03-18',
  },
  memorial_day: {
    start: '05-25',
    end: '05-31',
  },
  labor_day: {
    start: '09-01',
    end: '09-07',
  },
  veterans_day: {
    start: '11-10',
    end: '11-12',
  },
  christmas: {
    start: '12-20',
    end: '12-26',
  },
  new_year: {
    start: '12-30',
    end: '01-03',
  },
  easter: {
    start: '04-01',
    end: '04-15',
  },
  halloween: {
    start: '10-25',
    end: '11-02',
  },
  summer_solstice: {
    start: '06-20',
    end: '06-22',
  },
  winter_solstice: {
    start: '12-21',
    end: '12-23',
  },
  earth_day: {
    start: '04-20',
    end: '04-24',
  },
};

export const eventNames: Record<SeasonalEvent, string> = {
  black_history_month: 'Black History Month',
  hispanic_heritage: 'Hispanic Heritage Month',
  winter_holidays: 'Winter Holidays',
  independence_day: 'Independence Day',
  spring_festival: 'Spring Festival',
  pride_month: 'Pride Month',
  presidents_day: 'Presidents Day',
  thanksgiving: 'Thanksgiving',
  valentines_day: "Valentine's Day",
  st_patricks_day: "St. Patrick's Day",
  memorial_day: 'Memorial Day',
  labor_day: 'Labor Day',
  veterans_day: 'Veterans Day',
  christmas: 'Christmas',
  new_year: 'New Year',
  easter: 'Easter',
  halloween: 'Halloween',
  summer_solstice: 'Summer Solstice',
  winter_solstice: 'Winter Solstice',
  earth_day: 'Earth Day',
};

export const eventDescriptions: Record<SeasonalEvent, string> = {
  black_history_month: 'Celebrate Black History and Culture',
  hispanic_heritage: 'Honor Hispanic Heritage and Culture',
  winter_holidays: 'Celebrate Winter Holidays',
  independence_day: 'Celebrate American Independence',
  spring_festival: 'Welcome Spring with Festivals',
  pride_month: 'Celebrate LGBTQ+ Pride',
  presidents_day: 'Honor U.S. Presidents',
  thanksgiving: 'Give Thanks and Celebrate',
  valentines_day: 'Celebrate Love and Romance',
  st_patricks_day: 'Celebrate Irish Heritage',
  memorial_day: 'Honor Fallen Heroes',
  labor_day: "Celebrate Workers' Rights",
  veterans_day: 'Honor Military Veterans',
  christmas: 'Celebrate Christmas',
  new_year: 'Ring in the New Year',
  easter: 'Celebrate Easter',
  halloween: 'Celebrate Halloween',
  summer_solstice: 'Longest Day of the Year',
  winter_solstice: 'Shortest Day of the Year',
  earth_day: 'Protect Our Planet',
};

export const eventStates: Record<SeasonalEvent, string[]> = {
  black_history_month: ['georgia', 'alabama', 'mississippi', 'louisiana', 'south_carolina'],
  hispanic_heritage: ['california', 'texas', 'new_mexico', 'arizona', 'florida', 'colorado'],
  winter_holidays: ['alaska', 'vermont', 'new_hampshire', 'maine', 'minnesota'],
  independence_day: ['pennsylvania', 'massachusetts', 'virginia', 'delaware', 'maryland'],
  spring_festival: ['washington', 'oregon', 'california', 'colorado', 'utah'],
  pride_month: ['california', 'new_york', 'illinois', 'massachusetts', 'washington'],
  presidents_day: ['illinois', 'virginia', 'ohio', 'massachusetts', 'kentucky'],
  thanksgiving: ['massachusetts', 'pennsylvania', 'virginia', 'connecticut', 'rhode_island'],
  valentines_day: ['california', 'new_york', 'texas', 'florida', 'illinois'],
  st_patricks_day: ['massachusetts', 'new_york', 'illinois', 'california', 'texas'],
  memorial_day: ['virginia', 'pennsylvania', 'ohio', 'kentucky', 'tennessee'],
  labor_day: ['new_york', 'illinois', 'california', 'pennsylvania', 'ohio'],
  veterans_day: ['virginia', 'texas', 'california', 'florida', 'new_york'],
  christmas: ['alaska', 'vermont', 'new_hampshire', 'maine', 'minnesota'],
  new_year: ['new_york', 'california', 'nevada', 'florida', 'illinois'],
  easter: ['massachusetts', 'pennsylvania', 'virginia', 'connecticut', 'rhode_island'],
  halloween: ['massachusetts', 'pennsylvania', 'virginia', 'connecticut', 'rhode_island'],
  summer_solstice: ['alaska', 'california', 'washington', 'oregon', 'montana'],
  winter_solstice: ['alaska', 'vermont', 'new_hampshire', 'maine', 'minnesota'],
  earth_day: ['california', 'oregon', 'washington', 'colorado', 'vermont'],
};

function mmdd(date: Date): string {
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  return `${mm}-${dd}`;
}

export function isWithinEventPeriod(event: SeasonalEvent, currentDate = new Date()): boolean {
  const today = mmdd(currentDate);
  const { start, end } = eventRanges[event];

  // Handle wrapped ranges like Dec-Jan
  if (start > end) {
    return today >= start || today <= end;
  }

  return today >= start && today <= end;
}

export function getCurrentSeasonalEvents(currentDate = new Date()): SeasonalEvent[] {
  return Object.keys(eventRanges).filter((event) =>
    isWithinEventPeriod(event as SeasonalEvent, currentDate)
  ) as SeasonalEvent[];
}

export function getUpcomingSeasonalEvents(
  currentDate = new Date(),
  daysAhead = 30
): SeasonalEvent[] {
  const upcoming: SeasonalEvent[] = [];

  for (let i = 0; i < daysAhead; i++) {
    const futureDate = new Date(currentDate);
    futureDate.setDate(currentDate.getDate() + i);

    const events = getCurrentSeasonalEvents(futureDate);
    events.forEach((event) => {
      if (!upcoming.includes(event)) {
        upcoming.push(event);
      }
    });
  }

  return upcoming;
}

export function getEventStartDate(event: SeasonalEvent, year: number): Date {
  const [month, day] = eventRanges[event].start.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getEventEndDate(event: SeasonalEvent, year: number): Date {
  const [month, day] = eventRanges[event].end.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getDaysUntilEvent(event: SeasonalEvent, currentDate = new Date()): number {
  const currentYear = currentDate.getFullYear();
  const eventStart = getEventStartDate(event, currentYear);

  // If event has passed this year, check next year
  if (eventStart < currentDate) {
    const nextYearEventStart = getEventStartDate(event, currentYear + 1);
    const timeDiff = nextYearEventStart.getTime() - currentDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  const timeDiff = eventStart.getTime() - currentDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

export function getEventProgress(event: SeasonalEvent, currentDate = new Date()): number {
  if (!isWithinEventPeriod(event, currentDate)) {
    return 0;
  }

  const currentYear = currentDate.getFullYear();
  const eventStart = getEventStartDate(event, currentYear);
  const eventEnd = getEventEndDate(event, currentYear);

  const totalDuration = eventEnd.getTime() - eventStart.getTime();
  const elapsed = currentDate.getTime() - eventStart.getTime();

  return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
}
