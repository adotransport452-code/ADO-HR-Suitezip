import type { NepaliDate } from "./nepaliDate";

const STORAGE_KEY = "nepali_active_date";
const DATE_CHANGE_EVENT = "nepali_date_changed";

const DEFAULT_DATE: NepaliDate = {
  year: 2082,
  month: 11,
  day: 28,
  dayOfWeek: "Thursday"
};

export function getActiveNepaliDate(): NepaliDate {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as NepaliDate;
  } catch {}
  return DEFAULT_DATE;
}

export function setActiveNepaliDate(date: NepaliDate): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(date));
  window.dispatchEvent(new CustomEvent(DATE_CHANGE_EVENT, { detail: date }));
}

export function onDateChange(callback: (date: NepaliDate) => void): () => void {
  const handler = (e: Event) => callback((e as CustomEvent<NepaliDate>).detail);
  window.addEventListener(DATE_CHANGE_EVENT, handler);
  return () => window.removeEventListener(DATE_CHANGE_EVENT, handler);
}
