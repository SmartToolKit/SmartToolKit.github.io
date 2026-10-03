import {
  addGregorianMonths,
  addJalaliMonths,
  buildGregorianMonth,
  buildHijriMonth,
  buildJalaliMonth,
  dateToHijri,
  dateToJalali,
  formatGregorian,
  formatGregorianLong,
  formatHijri,
  formatHijriLong,
  formatJalali,
  formatJalaliLong,
  getJalaliHoliday,
  getJalaliMonthOptions,
  gregorianToJalali,
  hijriMonthLength,
  hijriToDate,
  isHijriSupported,
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
import {
  TAB_REGIONS,
  defaultLanguageForTab,
  detectDefaultTab,
  isRtlLanguage,
  localizeDigits
} from './calendar.i18n';

/** `hijriToDate` now returns a local Date, so `dateToHijri` reads it directly. */
function dateToHijriLocal(date: Date): { hy: number; hm: number; hd: number } | null {
  return dateToHijri(date);
}

const ARABIC_DIGIT_CHARS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function toArabicDigits(value: string | number): string {
  return String(value).replace(/\d/g, digit => ARABIC_DIGIT_CHARS[Number(digit)]);
}

const HINDI_MONTH_NAMES = [
  'محرم', 'صفر', 'ربیع‌الاول', 'ربیع‌الثانی', 'جمادی‌الاول', 'جمادی‌الثانی',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذی‌قعده', 'ذی‌حجه'
];

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

describe('Hijri calendar (Umm al-Qura)', () => {
  it('reports support from the browser Intl data', () => {
    expect(isHijriSupported()).toBeTrue();
  });

  it('converts known Gregorian dates to Hijri', () => {
    expect(dateToHijri(new Date(2025, 5, 26))).toEqual({ hy: 1447, hm: 1, hd: 1 });
    expect(dateToHijri(new Date(2024, 3, 10))).toEqual({ hy: 1445, hm: 10, hd: 1 });
    expect(dateToHijri(new Date(2024, 2, 11))).toEqual({ hy: 1445, hm: 9, hd: 1 });
    expect(dateToHijri(new Date(2023, 3, 21))).toEqual({ hy: 1444, hm: 10, hd: 1 });
  });

it('names the month from the Hijri month number', () => {
    // Ramadan is Hijri month 9.
    expect(formatHijriLong({ hy: 1448, hm: 9, hd: 20 }, ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'], toArabicDigits))
      .toBe('٢٠ رمضان ١٤٤٨');
    expect(formatHijriLong({ hy: 1448, hm: 9, hd: 20 }, HINDI_MONTH_NAMES, toPersianDigits))
      .toBe('۲۰ رمضان ۱۴۴۸');
    expect(formatHijriLong({ hy: 1448, hm: 9, hd: 20 }, HINDI_MONTH_NAMES, value => String(value)))
      .toBe('20 رمضان 1448');
  });

  it('converts Hijri dates back to Gregorian', () => {
    const start = hijriToDate(1447, 1, 1);
    expect(start).not.toBeNull();
    expect(formatGregorian({
      gy: start!.getFullYear(), gm: start!.getMonth() + 1, gd: start!.getDate()
    })).toBe('2025-06-26');

    expect(dateToHijriLocal(hijriToDate(1445, 10, 1)!)).toEqual({ hy: 1445, hm: 10, hd: 1 });
  });

  it('round-trips every day across a range of Hijri years', () => {
    for (let hy = 1440; hy <= 1448; hy++) {
      for (let hm = 1; hm <= 12; hm++) {
        const length = hijriMonthLength(hy, hm);
        expect(length === 29 || length === 30).withContext(`${hy}/${hm} length`).toBeTrue();

        for (const hd of [1, 15, length]) {
          const date = hijriToDate(hy, hm, hd);
          expect(date).withContext(`${hy}/${hm}/${hd} should resolve`).not.toBeNull();
          expect(dateToHijriLocal(date!)).withContext(`${hy}/${hm}/${hd} round trip`).toEqual({ hy, hm, hd });
        }
      }
    }
  });

  it('reports month lengths consistent with the conversion', () => {
    for (let hy = 1444; hy <= 1448; hy++) {
      for (let hm = 1; hm <= 12; hm++) {
        const length = hijriMonthLength(hy, hm);
        const start = hijriToDate(hy, hm, 1)!;
        const end = new Date(start.getTime() + length * 86_400_000);
        const after = dateToHijriLocal(end)!;
        expect(after.hy === hy && after.hm === hm)
          .withContext(`${hy}/${hm} should be ${length} days`).toBeTrue();
      }
    }
  });

  it('rejects out of range values', () => {
    expect(hijriToDate(1447, 13, 1)).toBeNull();
    expect(hijriToDate(1447, 0, 1)).toBeNull();
    expect(hijriToDate(1447, 1, 0)).toBeNull();
  });

  it('formats Hijri dates with Persian digits on request', () => {
    expect(formatHijri({ hy: 1448, hm: 4, hd: 20 })).toBe('۱۴۴۸/۰۴/۲۰');
    expect(formatHijri({ hy: 1448, hm: 4, hd: 20 }, false)).toBe('1448/04/20');
  });

  it('builds a six week grid for a Hijri month', () => {
    const today = new Date(2026, 9, 1);
    const hijri = dateToHijri(today)!;
    const month = buildHijriMonth(hijri.hy, hijri.hm, today);

    expect(month.weeks.length).toBe(6);
    expect(month.weeks.every(week => week.length === 7)).toBeTrue();
    expect(month.weeks.flat().filter(day => day.isCurrentMonth).length).toBe(month.daysInMonth);
    expect(month.weeks.flat().filter(day => day.isToday).length).toBe(1);
    expect(month.title).toBeTruthy();
  });
});

describe('Calendar locale detection', () => {
  it('picks the Jalali calendar for Iran', () => {
    expect(detectDefaultTab('fa-IR', 'Asia/Tehran', TAB_REGIONS)).toBe('jalali');
    expect(detectDefaultTab('en-GB', 'Asia/Tehran', TAB_REGIONS)).toBe('jalali');
  });

  it('picks the Hijri calendar for Arabic regions', () => {
    expect(detectDefaultTab('ar-SA', 'Asia/Riyadh', TAB_REGIONS)).toBe('hijri');
    expect(detectDefaultTab('en-US', 'Asia/Riyadh', TAB_REGIONS)).toBe('hijri');
  });

  it('falls back to Gregorian for English regions', () => {
    expect(detectDefaultTab('en-US', 'America/New_York', TAB_REGIONS)).toBe('gregorian');
  });

  it('prefers the region over the language', () => {
    expect(detectDefaultTab('fa-IR', 'Asia/Riyadh', TAB_REGIONS)).toBe('jalali');
  });

  it('falls back to the language when the region is unknown', () => {
    expect(detectDefaultTab('fa', 'Europe/Berlin', TAB_REGIONS)).toBe('jalali');
    expect(detectDefaultTab('ar', 'Europe/Berlin', TAB_REGIONS)).toBe('hijri');
  });

  it('suggests a language matching the detected calendar', () => {
    expect(defaultLanguageForTab('jalali', 'en-GB')).toBe('fa');
    expect(defaultLanguageForTab('hijri', 'en-GB')).toBe('en');
    expect(defaultLanguageForTab('gregorian', 'fa-IR')).toBe('fa');
  });

  it('converts digits per language', () => {
    expect(localizeDigits(1405, 'fa')).toBe('۱۴۰۵');
    expect(localizeDigits(1405, 'ar')).toBe('١٤٠٥');
    expect(localizeDigits(1405, 'en')).toBe('1405');
  });

  it('treats Persian and Arabic as right to left', () => {
    expect(isRtlLanguage('fa')).toBeTrue();
    expect(isRtlLanguage('ar')).toBeTrue();
    expect(isRtlLanguage('en')).toBeFalse();
  });
});