export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export interface GregorianDate {
  gy: number;
  gm: number;
  gd: number;
}

export interface CalendarDay {
  date: Date;
  jalali: JalaliDate;
  gregorian: GregorianDate;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isHoliday: boolean;
  holidayTitle: string;
}

export interface CalendarMonth {
  title: string;
  weeks: CalendarDay[][];
  weeksInMonth: number;
  daysInMonth: number;
}

export interface CalendarSelectOption {
  value: number;
  label: string;
}

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
  1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
];

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const GREGORIAN_HOLIDAYS: Record<string, string> = {
  '1-1': "New Year's Day",
  '5-1': 'Labour Day',
  '12-25': 'Christmas Day'
};
const JALALI_HOLIDAYS: Record<string, string> = {
  '1-1': 'نوروز',
  '1-2': 'عید نوروز',
  '1-3': 'عید نوروز',
  '1-4': 'عید نوروز',
  '1-12': 'روز جمهوری اسلامی',
  '1-13': 'سیزده بدر',
  '3-14': 'روز ملی شدن صنعت نفت',
  '3-15': 'قیام ۱۵ خرداد',
  '11-22': 'پیروزی انقلاب اسلامی',
  '12-29': 'تعطیل پایان سال'
};

export const JALALI_MIN_YEAR = BREAKS[0];
export const JALALI_MAX_YEAR = BREAKS[BREAKS.length - 1] - 1;
export const JALALI_MIN_GREGORIAN_YEAR = 560;
export const JALALI_MAX_GREGORIAN_YEAR = 3798;

export const JALALI_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const GREGORIAN_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/** Saturday first, matching the Iranian week. */
export const JALALI_WEEKDAY_LABELS = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
export const JALALI_WEEKDAY_SHORT_LABELS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export const GREGORIAN_WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const GREGORIAN_WEEKDAY_SHORT_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const JALALI_MIN_SELECT_YEAR = 1300;
export const JALALI_MAX_SELECT_YEAR = 1440;
export const GREGORIAN_MIN_SELECT_YEAR = 1900;
export const GREGORIAN_MAX_SELECT_YEAR = 2040;

function div(a: number, b: number): number {
  return Math.trunc(a / b);
}

function mod(a: number, b: number): number {
  return a - Math.trunc(a / b) * b;
}

interface JalaliCalendarInfo {
  leap: number;
  march: number;
}

/**
 * Returns the leap flag and the Gregorian March day on which the Jalali year starts.
 * Follows the 2820-year astronomical cycle breaks table (Borkowski / Khayyam).
 */
function jalaliCalendarInfo(jy: number): JalaliCalendarInfo {
  if (jy < JALALI_MIN_YEAR || jy > JALALI_MAX_YEAR) {
    throw new Error('Jalali year out of supported range: ' + jy);
  }

  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;

  for (let i = 1; i < BREAKS.length; i++) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) {
      break;
    }
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;

  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) {
    leapJ += 1;
  }

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33;
  }
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) {
    leap = 4;
  }

  return { leap, march };
}

export function isJalaliLeapYear(jy: number): boolean {
  return jalaliCalendarInfo(jy).leap === 0;
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) {
    return 31;
  }
  if (jm <= 11) {
    return 30;
  }
  return isJalaliLeapYear(jy) ? 30 : 29;
}

export function isGregorianLeapYear(gy: number): boolean {
  return gy % 4 === 0 && (gy % 100 !== 0 || gy % 400 === 0);
}

/** Gregorian date -> Julian day number. */
function gregorianToJulianDay(gy: number, gm: number, gd: number): number {
  const d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
    + div(153 * mod(gm + 9, 12) + 2, 5)
    + gd - 34840408;
  return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
}

/** Julian day number -> Gregorian date. */
function julianDayToGregorian(jdn: number): GregorianDate {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

/** Julian day number of Nowruz (1 Farvardin) for the given Jalali year. */
function nowruzJulianDay(jy: number): number {
  return gregorianToJulianDay(jy + 621, 3, jalaliCalendarInfo(jy).march);
}

function daysBeforeJalaliMonth(jy: number, jm: number): number {
  let total = 0;
  for (let month = 1; month < jm; month++) {
    total += jalaliMonthLength(jy, month);
  }
  return total;
}

export function isValidJalaliDate(jalali: JalaliDate): boolean {
  return Number.isInteger(jalali.jy)
    && Number.isInteger(jalali.jm)
    && Number.isInteger(jalali.jd)
    && jalali.jy >= JALALI_MIN_YEAR
    && jalali.jy <= JALALI_MAX_YEAR
    && jalali.jm >= 1
    && jalali.jm <= 12
    && jalali.jd >= 1
    && jalali.jd <= jalaliMonthLength(jalali.jy, jalali.jm);
}

export function isValidGregorianDate(gregorian: GregorianDate): boolean {
  if (!Number.isInteger(gregorian.gy) || !Number.isInteger(gregorian.gm) || !Number.isInteger(gregorian.gd)) {
    return false;
  }
  if (gregorian.gm < 1 || gregorian.gm > 12 || gregorian.gd < 1) {
    return false;
  }
  const maxDay = gregorian.gm === 2
    ? (isGregorianLeapYear(gregorian.gy) ? 29 : 28)
    : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][gregorian.gm - 1];
  return gregorian.gd <= maxDay;
}

export function jalaliToGregorian(jalali: JalaliDate): GregorianDate {
  if (!isValidJalaliDate(jalali)) {
    throw new Error('Invalid Jalali date');
  }
  const jdn = nowruzJulianDay(jalali.jy) + daysBeforeJalaliMonth(jalali.jy, jalali.jm) + jalali.jd - 1;
  return julianDayToGregorian(jdn);
}

export function gregorianToJalali(gregorian: GregorianDate): JalaliDate {
  if (!isValidGregorianDate(gregorian)) {
    throw new Error('Invalid Gregorian date');
  }
  const jdn = gregorianToJulianDay(gregorian.gy, gregorian.gm, gregorian.gd);
  let jy = gregorian.gy - 621;

  while (jdn < nowruzJulianDay(jy)) {
    jy--;
  }
  while (jdn >= nowruzJulianDay(jy + 1)) {
    jy++;
  }

  let dayOfYear = jdn - nowruzJulianDay(jy) + 1;
  let jm = 1;
  let monthLength = jalaliMonthLength(jy, 1);
  while (dayOfYear > monthLength) {
    dayOfYear -= monthLength;
    jm++;
    monthLength = jalaliMonthLength(jy, jm);
  }

  return { jy, jm, jd: dayOfYear };
}

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, digit => PERSIAN_DIGITS[Number(digit)]);
}

export function normalizeDigits(value: string): string {
  return value
    .replace(/[\u06f0-\u06f9]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, digit => String(digit.charCodeAt(0) - 0x0660));
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(first: Date, second: Date): boolean {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

export function addDays(date: Date, days: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addGregorianMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function addJalaliMonths(jy: number, jm: number, months: number): { jy: number; jm: number } {
  const zeroBased = jy * 12 + (jm - 1) + months;
  return { jy: Math.floor(zeroBased / 12), jm: (zeroBased % 12 + 12) % 12 + 1 };
}

export function getJalaliHoliday(jalali: JalaliDate): string {
  return JALALI_HOLIDAYS[`${jalali.jm}-${jalali.jd}`] ?? '';
}

export function getGregorianHoliday(gregorian: GregorianDate): string {
  return GREGORIAN_HOLIDAYS[`${gregorian.gm}-${gregorian.gd}`] ?? '';
}

export function getJalaliMonthOptions(): CalendarSelectOption[] {
  return JALALI_MONTH_NAMES.map((label, index) => ({ value: index + 1, label }));
}

export function getGregorianMonthOptions(): CalendarSelectOption[] {
  return GREGORIAN_MONTH_NAMES.map((label, index) => ({ value: index + 1, label }));
}

export function buildYearOptions(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

export function buildWeeks(startDate: Date, weekStartsOnSaturday: boolean, isHoliday: (gregorian: GregorianDate) => string, isCurrentMonth: (jalali: JalaliDate, gregorian: GregorianDate) => boolean, today: Date): CalendarDay[][] {
  const offset = weekStartsOnSaturday ? (startDate.getDay() + 1) % 7 : startDate.getDay();
  const gridStart = addDays(startDate, -offset);
  const weeks: CalendarDay[][] = [];

  for (let week = 0; week < 6; week++) {
    const days: CalendarDay[] = [];
    for (let day = 0; day < 7; day++) {
      const date = addDays(gridStart, week * 7 + day);
      const gregorian: GregorianDate = { gy: date.getFullYear(), gm: date.getMonth() + 1, gd: date.getDate() };
      const jalali = gregorianToJalali(gregorian);
      const holidayTitle = isHoliday(gregorian);
      days.push({
        date,
        jalali,
        gregorian,
        dayNumber: weekStartsOnSaturday ? jalali.jd : gregorian.gd,
        isCurrentMonth: isCurrentMonth(jalali, gregorian),
        isToday: isSameDay(date, today),
        isHoliday: !!holidayTitle,
        holidayTitle
      });
    }
    weeks.push(days);
  }

  return weeks;
}

export function buildJalaliMonth(jy: number, jm: number, today: Date): CalendarMonth {
  const startDate = jalaliToDate({ jy, jm, jd: 1 });
  const weeks = buildWeeks(
    startDate,
    true,
    date => getJalaliHoliday(gregorianToJalali(date)),
    jalali => jalali.jy === jy && jalali.jm === jm,
    today
  );

  return {
    title: `${JALALI_MONTH_NAMES[jm - 1]} ${toPersianDigits(jy)}`,
    weeks,
    weeksInMonth: weeks.filter(week => week.some(day => day.isCurrentMonth)).length,
    daysInMonth: jalaliMonthLength(jy, jm)
  };
}

export function buildGregorianMonth(gy: number, gm: number, today: Date): CalendarMonth {
  const startDate = new Date(gy, gm - 1, 1);
  const weeks = buildWeeks(
    startDate,
    false,
    date => getGregorianHoliday(date),
    (_jalali, gregorian) => gregorian.gy === gy && gregorian.gm === gm,
    today
  );

  return {
    title: `${GREGORIAN_MONTH_NAMES[gm - 1]} ${gy}`,
    weeks,
    weeksInMonth: weeks.filter(week => week.some(day => day.isCurrentMonth)).length,
    daysInMonth: new Date(gy, gm, 0).getDate()
  };
}

export function parseJalaliInput(value: string): JalaliDate | null {
  const parts = normalizeDigits(value).replace(/[^\d/-]/g, '').split(/[/-]/).map(Number);
  if (parts.length !== 3 || parts.some(part => !Number.isInteger(part))) {
    return null;
  }
  const jalali: JalaliDate = { jy: parts[0], jm: parts[1], jd: parts[2] };
  return isValidJalaliDate(jalali) ? jalali : null;
}

export function parseGregorianInput(value: string): GregorianDate | null {
  const parts = normalizeDigits(value).replace(/[^\d/-]/g, '').split(/[/-]/).map(Number);
  if (parts.length !== 3 || parts.some(part => !Number.isInteger(part))) {
    return null;
  }
  const gregorian: GregorianDate = { gy: parts[0], gm: parts[1], gd: parts[2] };
  return isValidGregorianDate(gregorian) ? gregorian : null;
}

export function jalaliToDate(jalali: JalaliDate): Date {
  const gregorian = jalaliToGregorian(jalali);
  return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
}

export function dateToJalali(date: Date): JalaliDate {
  return gregorianToJalali({ gy: date.getFullYear(), gm: date.getMonth() + 1, gd: date.getDate() });
}

export function formatJalali(jalali: JalaliDate, usePersianDigits = true): string {
  const yyyy = String(jalali.jy);
  const mm = String(jalali.jm).padStart(2, '0');
  const dd = String(jalali.jd).padStart(2, '0');
  const value = `${yyyy}/${mm}/${dd}`;
  return usePersianDigits ? toPersianDigits(value) : value;
}

export function formatGregorian(gregorian: GregorianDate): string {
  return `${gregorian.gy}-${String(gregorian.gm).padStart(2, '0')}-${String(gregorian.gd).padStart(2, '0')}`;
}

export function formatJalaliLong(jalali: JalaliDate, usePersianDigits = true): string {
  const day = usePersianDigits ? toPersianDigits(jalali.jd) : String(jalali.jd);
  const year = usePersianDigits ? toPersianDigits(jalali.jy) : String(jalali.jy);
  return `${day} ${JALALI_MONTH_NAMES[jalali.jm - 1]} ${year}`;
}

/**
 * Long form Gregorian date. `weekdayLabels` and `weekStartsOnSaturday` are supplied by
 * the caller so the Jalali view can read the weekday in Persian while the Gregorian view
 * keeps English.
 */
export function formatGregorianLong(gregorian: GregorianDate, weekdayLabels: string[] = GREGORIAN_WEEKDAY_LABELS, weekStartsOnSaturday = false): string {
  const dayOfWeek = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd).getDay();
  const index = weekStartsOnSaturday ? (dayOfWeek + 1) % 7 : dayOfWeek;
  return `${weekdayLabels[index]}, ${GREGORIAN_MONTH_NAMES[gregorian.gm - 1]} ${gregorian.gd}, ${gregorian.gy}`;
}