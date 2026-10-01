import {
  addGregorianMonths,
  addJalaliMonths,
  buildGregorianMonth,
  buildJalaliMonth,
  dateToJalali,
  formatGregorian,
  formatGregorianLong,
  formatJalali,
  formatJalaliLong,
  getJalaliHoliday,
  getJalaliMonthOptions,
  gregorianToJalali,
  isJalaliLeapYear,
  isSameDay,
  jalaliMonthLength,
  jalaliToDate,
  jalaliToGregorian,
  normalizeDigits,
  parseGregorianInput,
  parseJalaliInput,
  startOfDay,
  toPersianDigits,
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_LABELS,
  JALALI_WEEKDAY_SHORT_LABELS
} from './calendar.utils';

describe('Calendar utilities', () => {
  it('converts known Gregorian dates to Jalali', () => {
    expect(gregorianToJalali({ gy: 2026, gm: 3, gd: 21 })).toEqual({ jy: 1405, jm: 1, jd: 1 });
    expect(gregorianToJalali({ gy: 2025, gm: 3, gd: 20 })).toEqual({ jy: 1403, jm: 12, jd: 30 });
    expect(gregorianToJalali({ gy: 2024, gm: 2, gd: 29 })).toEqual({ jy: 1402, jm: 12, jd: 10 });
    expect(gregorianToJalali({ gy: 1979, gm: 2, gd: 11 })).toEqual({ jy: 1357, jm: 11, jd: 22 });
    expect(gregorianToJalali({ gy: 2026, gm: 10, gd: 1 })).toEqual({ jy: 1405, jm: 7, jd: 9 });
  });

  it('round-trips Jalali dates across a century of years', () => {
    for (let jy = 1300; jy <= 1400; jy++) {
      for (let jm = 1; jm <= 12; jm++) {
        const length = jalaliMonthLength(jy, jm);
        for (const jd of [1, 15, length]) {
          const jalali = { jy, jm, jd };
          expect(gregorianToJalali(jalaliToGregorian(jalali))).toEqual(jalali);
        }
      }
    }
  });

  it('applies the 33 year leap cycle with a 29 day Esfand outside leap years', () => {
    expect(isJalaliLeapYear(1403)).toBeTrue();
    expect(isJalaliLeapYear(1404)).toBeFalse();
    expect(isJalaliLeapYear(1399)).toBeTrue();
    expect(jalaliMonthLength(1403, 12)).toBe(30);
    expect(jalaliMonthLength(1404, 12)).toBe(29);
    expect(jalaliMonthLength(1404, 1)).toBe(31);
    expect(jalaliMonthLength(1404, 7)).toBe(30);
  });

  it('walks months across year boundaries in both calendars', () => {
    expect(addJalaliMonths(1405, 12, 1)).toEqual({ jy: 1406, jm: 1 });
    expect(addJalaliMonths(1405, 1, -1)).toEqual({ jy: 1404, jm: 12 });
    expect(addJalaliMonths(1405, 6, 12)).toEqual({ jy: 1406, jm: 6 });
    expect(addGregorianMonths(new Date(2026, 11, 15), 1)).toEqual(new Date(2027, 0, 1));
  });

  it('builds a six week grid with the correct day counts', () => {
    const today = new Date(2026, 9, 1);
    const jalaliMonth = buildJalaliMonth(1405, 7, today);
    const gregorianMonth = buildGregorianMonth(2026, 10, today);

    expect(jalaliMonth.weeks.length).toBe(6);
    expect(jalaliMonth.weeksInMonth).toBe(5);
    expect(jalaliMonth.daysInMonth).toBe(30);
    expect(jalaliMonth.weeks.flat().filter(day => day.isCurrentMonth).length).toBe(30);
    expect(jalaliMonth.weeks.flat().filter(day => day.isToday).length).toBe(1);

    expect(gregorianMonth.weeks.length).toBe(6);
    expect(gregorianMonth.daysInMonth).toBe(31);
    expect(gregorianMonth.weeks.flat().filter(day => day.isCurrentMonth).length).toBe(31);
    expect(gregorianMonth.weeks[0][0].dayNumber).toBe(27);
  });

  it('marks the first day of a Jalali week as Shanbeh', () => {
    const jalaliMonth = buildJalaliMonth(1405, 7, new Date(2026, 9, 1));
    const firstCell = jalaliMonth.weeks[0][0];

    expect(firstCell.date.getDay()).toBe(6);
    expect(firstCell.dayNumber).toBe(jalaliMonth.weeks[0][0].jalali.jd);
  });

  it('flags Iranian public holidays', () => {
    const farvardin = buildJalaliMonth(1405, 1, new Date(2026, 2, 21));
    const holidays = farvardin.weeks.flat().filter(day => day.isHoliday).map(day => day.holidayTitle);

    expect(holidays).toContain('نوروز');
    expect(holidays).toContain('روز جمهوری اسلامی');
    expect(holidays).toContain('سیزده بدر');
  });

  it('names Jalali months, weekdays and holidays in Persian', () => {
    expect(JALALI_MONTH_NAMES[0]).toBe('فروردین');
    expect(JALALI_MONTH_NAMES[11]).toBe('اسفند');
    expect(JALALI_WEEKDAY_LABELS[0]).toBe('شنبه');
    expect(JALALI_WEEKDAY_LABELS[6]).toBe('جمعه');
    expect(JALALI_WEEKDAY_SHORT_LABELS).toEqual(['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']);
    expect(getJalaliHoliday({ jy: 1405, jm: 11, jd: 22 })).toBe('پیروزی انقلاب اسلامی');
    expect(getJalaliHoliday({ jy: 1405, jm: 6, jd: 31 })).toBe('');
  });

  it('renders the Jalali month title in Persian', () => {
    expect(buildJalaliMonth(1405, 7, new Date(2026, 9, 1)).title).toBe('مهر ۱۴۰۵');
    expect(formatJalaliLong({ jy: 1405, jm: 7, jd: 9 })).toBe('۹ مهر ۱۴۰۵');
    expect(getJalaliMonthOptions()[0].label).toBe('فروردین');
  });

  it('reads the long weekday in the language the caller passes', () => {
    const date = { gy: 2026, gm: 10, gd: 1 };

    expect(formatGregorianLong(date)).toBe('Thursday, October 1, 2026');
    expect(formatGregorianLong(date, JALALI_WEEKDAY_LABELS, true)).toBe('پنج‌شنبه, October 1, 2026');
    expect(formatGregorianLong({ gy: 2026, gm: 10, gd: 3 }, JALALI_WEEKDAY_LABELS, true)).toBe('شنبه, October 3, 2026');
    expect(formatGregorianLong({ gy: 2026, gm: 10, gd: 3 })).toBe('Saturday, October 3, 2026');
  });

  it('normalizes Persian digits and parses user input', () => {
    expect(normalizeDigits('۱۴۰۵')).toBe('1405');
    expect(normalizeDigits('١٤٠٥')).toBe('1405');
    expect(toPersianDigits(1405)).toBe('۱۴۰۵');
    expect(formatJalali({ jy: 1405, jm: 7, jd: 9 })).toBe('۱۴۰۵/۰۷/۰۹');
    expect(formatJalali({ jy: 1405, jm: 7, jd: 9 }, false)).toBe('1405/07/09');
    expect(formatGregorian({ gy: 2026, gm: 10, gd: 1 })).toBe('2026-10-01');

    expect(parseJalaliInput('1405/07/09')).toEqual({ jy: 1405, jm: 7, jd: 9 });
    expect(parseJalaliInput('۱۴۰۵-۰۷-۰۹')).toEqual({ jy: 1405, jm: 7, jd: 9 });
    expect(parseJalaliInput('1405/12/30')).toBeNull();
    expect(parseJalaliInput('1403/12/30')).toEqual({ jy: 1403, jm: 12, jd: 30 });
    expect(parseJalaliInput('1405-7')).toBeNull();
    expect(parseGregorianInput('2024-02-30')).toBeNull();
    expect(parseGregorianInput('2024-02-29')).toEqual({ gy: 2024, gm: 2, gd: 29 });
  });

  it('compares calendar days by value, not reference', () => {
    expect(isSameDay(new Date(2026, 9, 1, 23, 59), new Date(2026, 9, 1, 0, 1))).toBeTrue();
    expect(isSameDay(new Date(2026, 9, 1), new Date(2026, 9, 2))).toBeFalse();
    expect(isSameDay(startOfDay(new Date(2026, 9, 1, 12)), new Date(2026, 9, 1))).toBeTrue();
  });

  it('maps a Date to its Jalali equivalent and back', () => {
    expect(dateToJalali(new Date(2026, 9, 1))).toEqual({ jy: 1405, jm: 7, jd: 9 });
    expect(jalaliToDate({ jy: 1405, jm: 7, jd: 9 })).toEqual(new Date(2026, 9, 1));
  });
});