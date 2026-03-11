import { NEPALI_MONTHS } from "./constants";

// Gregorian to Nepali date conversion
// Based on Nepali calendar rules (2082 B.S. reference)
const GREGORIAN_TO_NEPALI_OFFSET = {
  start_gregorian: new Date(2025, 3, 13), // April 13, 2025 = 1 Baisakh 2082
  nepali_date: { year: 2082, month: 1, day: 1 }
};

export interface NepaliDate {
  year: number;
  month: number;
  day: number;
  dayOfWeek: string;
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Simplified Nepali calendar for 2080-2182
const NEPALI_CALENDAR_DATA: Record<number, Record<number, { startDay: number; days: number }>> = {
  2082: {
    1: { startDay: 4, days: 31 },
    2: { startDay: 1, days: 31 },
    3: { startDay: 3, days: 31 },
    4: { startDay: 6, days: 31 },
    5: { startDay: 2, days: 31 },
    6: { startDay: 5, days: 30 },
    7: { startDay: 0, days: 29 },
    8: { startDay: 2, days: 30 },
    9: { startDay: 4, days: 29 },
    10: { startDay: 6, days: 30 },
    11: { startDay: 2, days: 31 },
    12: { startDay: 4, days: 32 },
  }
};

// For other years, use approximate calculation
function getMonthStartDay(year: number, month: number): number {
  if (NEPALI_CALENDAR_DATA[year]?.[month]) {
    return NEPALI_CALENDAR_DATA[year][month].startDay;
  }
  // Fallback approximation
  return (month * 2) % 7;
}

function getMonthDays(year: number, month: number): number {
  if (NEPALI_CALENDAR_DATA[year]?.[month]) {
    return NEPALI_CALENDAR_DATA[year][month].days;
  }
  // Standard approximation
  if (month === 6 || month === 8 || month === 10) return 30;
  if (month === 9) return 29;
  if (month === 12) return 32;
  return 31;
}

export function getCurrentNepaliDate(): NepaliDate {
  const now = new Date();
  
  // Approximate conversion from Gregorian to Nepali
  // 2082 B.S. starts on April 13, 2025
  const referenceGregorian = new Date(2025, 3, 13);
  const referenceDays = Math.floor((now.getTime() - referenceGregorian.getTime()) / (1000 * 60 * 60 * 24));
  
  let year = 2082;
  let daysRemaining = referenceDays;
  
  // Fast forward through years
  while (daysRemaining >= 365) {
    daysRemaining -= 365; // Approximate year length
    year++;
  }
  
  let month = 1;
  let day = 1;
  
  // Find month and day
  while (month <= 12 && daysRemaining > 0) {
    const monthDays = getMonthDays(year, month);
    if (daysRemaining >= monthDays) {
      daysRemaining -= monthDays;
      month++;
    } else {
      day += daysRemaining;
      daysRemaining = 0;
    }
  }
  
  const dayOfWeek = calculateDayOfWeek(year, month, day);
  
  return { year, month, day, dayOfWeek };
}

export function calculateDayOfWeek(year: number, month: number, day: number): string {
  if (NEPALI_CALENDAR_DATA[year]?.[month]) {
    const monthData = NEPALI_CALENDAR_DATA[year][month];
    const dayIndex = (monthData.startDay + day - 1) % 7;
    return DAYS_OF_WEEK[dayIndex];
  }
  // Fallback
  return DAYS_OF_WEEK[(day % 7)];
}

export function formatNepaliDate(nepaliDate: NepaliDate): string {
  const monthName = NEPALI_MONTHS.find(m => m.value === nepaliDate.month)?.label || "Unknown";
  return `${nepaliDate.dayOfWeek}, ${nepaliDate.day} ${monthName} ${nepaliDate.year} BS`;
}
