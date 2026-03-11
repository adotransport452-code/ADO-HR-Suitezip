export const NEPALI_MONTHS = [
  { value: 1, label: "Baisakh" },
  { value: 2, label: "Jestha" },
  { value: 3, label: "Asadh" },
  { value: 4, label: "Shrawan" },
  { value: 5, label: "Bhadra" },
  { value: 6, label: "Ashwin" },
  { value: 7, label: "Kartik" },
  { value: 8, label: "Mangsir" },
  { value: 9, label: "Poush" },
  { value: 10, label: "Magh" },
  { value: 11, label: "Falgun" },
  { value: 12, label: "Chaitra" },
];

export const NEPALI_YEARS = Array.from({ length: 103 }, (_, i) => 2080 + i);

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const NEPALI_CALENDAR_2082 = {
  1: { startDay: 4, days: 31 }, // Baisakh starts on Thursday
  2: { startDay: 1, days: 31 }, // Jestha starts on Monday
  3: { startDay: 3, days: 31 }, // Asadh starts on Wednesday
  4: { startDay: 6, days: 31 }, // Shrawan starts on Saturday
  5: { startDay: 2, days: 31 }, // Bhadra starts on Tuesday
  6: { startDay: 5, days: 30 }, // Ashwin starts on Friday
  7: { startDay: 0, days: 29 }, // Kartik starts on Sunday
  8: { startDay: 2, days: 30 }, // Mangsir starts on Tuesday
  9: { startDay: 4, days: 29 }, // Poush starts on Thursday
  10: { startDay: 6, days: 30 }, // Magh starts on Saturday
  11: { startDay: 2, days: 31 }, // Falgun starts on Tuesday
  12: { startDay: 4, days: 32 }, // Chaitra starts on Thursday
};

export function getDayOfWeek(month: number, day: number): string {
  const monthData = NEPALI_CALENDAR_2082[month as keyof typeof NEPALI_CALENDAR_2082];
  if (!monthData) return "Unknown";
  const dayIndex = (monthData.startDay + day - 1) % 7;
  return DAYS_OF_WEEK[dayIndex];
}
