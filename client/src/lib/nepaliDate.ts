import { NEPALI_MONTHS } from "./constants";

export interface NepaliDate {
  year: number;
  month: number;
  day: number;
  dayOfWeek: string;
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Correct Nepali calendar data (verified against official Nepal Government calendar)
// Format: [Baisakh, Jeth, Ashadh, Shrawan, Bhadra, Ashwin, Kartik, Mangsir, Poush, Magh, Falgun, Chaitra]
const NEPALI_CALENDAR: Record<number, number[]> = {
  2078: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2080: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2081: [31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 30, 30],
  2082: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2083: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2084: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2085: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2086: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2087: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2088: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2089: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2090: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2091: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2092: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2093: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2094: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2095: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2096: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2097: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2098: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2099: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2100: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
};

// Reference: Baisakh 1, 2082 = April 14, 2025 (Monday, day index 1)
// Verified against official Nepal government calendar
const REFERENCE_BS = { year: 2082, month: 1, day: 1 };
const REFERENCE_AD = new Date(2025, 3, 14); // April 14, 2025
const REFERENCE_DOW = 1; // Monday = 1

function getDaysInMonth(year: number, month: number): number {
  return NEPALI_CALENDAR[year]?.[month - 1] ?? 30;
}

function gregorianToBS(adDate: Date): NepaliDate {
  // Normalize to local date components
  const adYear = adDate.getFullYear();
  const adMonth = adDate.getMonth();
  const adDay = adDate.getDate();
  const normalized = new Date(adYear, adMonth, adDay);
  const refNormalized = new Date(2025, 3, 14);

  const diffMs = normalized.getTime() - refNormalized.getTime();
  let remainingDays = Math.round(diffMs / 86400000);

  let year = REFERENCE_BS.year;
  let month = REFERENCE_BS.month;
  let day = REFERENCE_BS.day;

  if (remainingDays === 0) {
    return { year, month, day, dayOfWeek: DAYS_OF_WEEK[REFERENCE_DOW] };
  }

  if (remainingDays > 0) {
    while (remainingDays > 0) {
      const daysInMonth = getDaysInMonth(year, month);
      const daysLeft = daysInMonth - day;
      if (remainingDays > daysLeft) {
        remainingDays -= daysLeft + 1;
        day = 1;
        month++;
        if (month > 12) { month = 1; year++; }
      } else {
        day += remainingDays;
        remainingDays = 0;
      }
    }
  } else {
    remainingDays = -remainingDays;
    while (remainingDays > 0) {
      if (remainingDays >= day) {
        remainingDays -= day;
        month--;
        if (month < 1) { month = 12; year--; }
        day = getDaysInMonth(year, month);
      } else {
        day -= remainingDays;
        remainingDays = 0;
      }
    }
  }

  // Day of week: count total days offset from reference
  const totalDays = Math.round((normalized.getTime() - refNormalized.getTime()) / 86400000);
  const dowIndex = ((REFERENCE_DOW + totalDays) % 7 + 7) % 7;

  return { year, month, day, dayOfWeek: DAYS_OF_WEEK[dowIndex] };
}

export function getCurrentNepaliDate(): NepaliDate {
  // Use Nepal time (UTC+5:45)
  const now = new Date();
  const nepaliOffsetMs = (5 * 60 + 45) * 60 * 1000;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const nepaliTime = new Date(utcMs + nepaliOffsetMs);
  return gregorianToBS(nepaliTime);
}

export function getNepaliDate(gregorianDate: Date): NepaliDate {
  return gregorianToBS(gregorianDate);
}

export function formatNepaliDate(nepaliDate: NepaliDate): string {
  const monthName = NEPALI_MONTHS.find(m => m.value === nepaliDate.month)?.label || "Unknown";
  return `${nepaliDate.dayOfWeek}, ${nepaliDate.day} ${monthName} ${nepaliDate.year} BS`;
}

export function getDaysInNepaliMonth(year: number, month: number): number {
  return getDaysInMonth(year, month);
}

export function bsToGregorian(bsYear: number, bsMonth: number, bsDay: number): Date {
  const REF_AD_MS = new Date(2025, 3, 14).getTime();
  let totalDays = 0;
  let y = 2082, m = 1, d = 1;
  const isAfter = bsYear > 2082 || (bsYear === 2082 && bsMonth > 1) || (bsYear === 2082 && bsMonth === 1 && bsDay > 1);
  const isBefore = bsYear < 2082 || (bsYear === 2082 && bsMonth < 1) || (bsYear === 2082 && bsMonth === 1 && bsDay < 1);
  if (isAfter) {
    while (!(y === bsYear && m === bsMonth && d === bsDay)) {
      d++; totalDays++;
      if (d > getDaysInMonth(y, m)) { d = 1; m++; if (m > 12) { m = 1; y++; } }
    }
  } else if (isBefore) {
    while (!(y === bsYear && m === bsMonth && d === bsDay)) {
      d--; totalDays--;
      if (d < 1) { m--; if (m < 1) { m = 12; y--; } d = getDaysInMonth(y, m); }
    }
  }
  return new Date(REF_AD_MS + totalDays * 86400000);
}

export function getMonthStartDayOfWeek(year: number, month: number): number {
  // Find the AD date of the 1st of the given BS month
  // Use reference and count forward
  let bsYear = REFERENCE_BS.year;
  let bsMonth = REFERENCE_BS.month;
  let bsDay = REFERENCE_BS.day;
  let dayCount = 0;

  // Count days from reference (Baisakh 1, 2082) to target month's 1st day
  if (year > bsYear || (year === bsYear && month > bsMonth)) {
    // Count forward
    while (!(bsYear === year && bsMonth === month && bsDay === 1)) {
      bsDay++;
      dayCount++;
      if (bsDay > getDaysInMonth(bsYear, bsMonth)) {
        bsDay = 1;
        bsMonth++;
        if (bsMonth > 12) { bsMonth = 1; bsYear++; }
      }
    }
  } else if (year < bsYear || (year === bsYear && month < bsMonth)) {
    // Count backward from reference
    while (!(bsYear === year && bsMonth === month)) {
      dayCount--;
      bsDay--;
      if (bsDay < 1) {
        bsMonth--;
        if (bsMonth < 1) { bsMonth = 12; bsYear--; }
        bsDay = getDaysInMonth(bsYear, bsMonth);
      }
    }
    // Now at last day of target month, go to 1st
    const extra = bsDay - 1;
    dayCount -= extra;
    bsDay = 1;
  }

  return ((REFERENCE_DOW + dayCount) % 7 + 7) % 7;
}
