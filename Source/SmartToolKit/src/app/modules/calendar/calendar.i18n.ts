import {
  GREGORIAN_MONTH_NAMES,
  HIJRI_HOLIDAY_NAMES_AR,
  HIJRI_HOLIDAY_NAMES_FA,
  HIJRI_MONTH_NAMES_AR,
  HIJRI_MONTH_NAMES_FA,
  HijriDate,
  JALALI_MONTH_NAMES,
  JalaliDate,
  getJalaliHoliday
} from './calendar.utils';

export type CalendarLanguage = 'fa' | 'en' | 'ar';
export type CalendarTab = 'jalali' | 'gregorian' | 'hijri';

export const CALENDAR_LANGUAGES: { value: CalendarLanguage; label: string }[] = [
  { value: 'fa', label: 'فارسی' },
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' }
];

export const LANGUAGE_STORAGE_KEY = 'calendar-language';
export const TAB_STORAGE_KEY = 'calendar-active-tab';

const JALALI_MONTH_NAMES_AR = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const JALALI_MONTH_NAMES_EN = [
  'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar',
  'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'
];

const JALALI_WEEKDAYS_EN = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const JALALI_WEEKDAYS_AR = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const JALALI_WEEKDAYS_FA = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
const JALALI_WEEKDAYS_SHORT_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const JALALI_WEEKDAYS_SHORT_AR = ['سبت', 'أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع'];
const JALALI_WEEKDAYS_SHORT_FA = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

/** The Gregorian week starts on Sunday, so its labels are ordered differently. */
const GREGORIAN_WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const GREGORIAN_WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const GREGORIAN_WEEKDAYS_FA = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
const GREGORIAN_WEEKDAYS_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const GREGORIAN_WEEKDAYS_SHORT_AR = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
const GREGORIAN_WEEKDAYS_SHORT_FA = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];

const GREGORIAN_MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const GREGORIAN_MONTH_NAMES_FA = [
  'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
  'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'
];

const HIJRI_HOLIDAYS_EN: Record<string, string> = {
  '1-1': 'Islamic New Year',
  '1-10': "Ashura (Sunni)",
  '7-13': "Tasu'a",
  '8-14': "Ashura",
  '9-1': 'First of Ramadan',
  '10-1': 'Eid al-Fitr',
  '10-2': 'Eid al-Fitr',
  '10-3': 'Eid al-Fitr',
  '12-9': 'Day of Arafah',
  '12-10': 'Eid al-Adha',
  '12-11': 'Eid al-Adha',
  '12-12': 'Eid al-Adha',
  '12-13': 'Eid al-Adha'
};

const HIJRI_HOLIDAYS_FA = HIJRI_HOLIDAY_NAMES_FA;

const GREGORIAN_HOLIDAYS_EN: Record<string, string> = {
  '1-1': "New Year's Day",
  '5-1': 'Labour Day',
  '12-25': 'Christmas Day'
};

const GREGORIAN_HOLIDAYS_FA: Record<string, string> = {
  '1-1': 'نوروز میلادی',
  '5-1': 'روز کارگر',
  '12-25': 'کریسمس'
};

const GREGORIAN_HOLIDAYS_AR: Record<string, string> = {
  '1-1': 'رأس السنة الميلادية',
  '5-1': 'عيد العمال',
  '12-25': 'عيد الميلاد'
};

const HIJRI_MONTH_NAMES_EN = [
  'Muharram', 'Safar', "Rabīʿ al-Awwal", "Rabīʿ al-Thānī", 'Jumādā al-Ūlā', 'Jumādā al-Ākhirah',
  'Rajab', "Shaʿbān", 'Ramadan', 'Shawwal', "Dhū al-Qaʿdah", 'Dhū al-Ḥijjah'
];

const JALALI_HOLIDAYS_EN: Record<string, string> = {
  '1-1': 'Nowruz',
  '1-2': 'Nowruz Holiday',
  '1-3': 'Nowruz Holiday',
  '1-4': 'Nowruz Holiday',
  '1-12': 'Islamic Republic Day',
  '1-13': 'Nature Day',
  '3-14': 'Oil Nationalization Day',
  '3-15': 'Khordad Uprising',
  '11-22': 'Islamic Revolution Day',
  '12-29': 'Year-end Holiday'
};

const JALALI_HOLIDAYS_AR: Record<string, string> = {
  '1-1': 'نوروز',
  '1-2': 'عید نوروز',
  '1-3': 'عید نوروز',
  '1-4': 'عید نوروز',
  '1-12': 'يوم جمهورية إيران',
  '1-13': 'سیزده بد',
  '3-14': 'يوم تأمین صنعت نفت',
  '3-15': 'قیام ۱۵ خرداد',
  '11-22': 'يوم انقلاب',
  '12-29': 'تعطیل پایان سال'
};

/** Month names for the given calendar and language. */
export function monthNamesFor(tab: CalendarTab, language: CalendarLanguage): string[] {
  if (tab === 'gregorian') {
    if (language === 'en') {
      return GREGORIAN_MONTH_NAMES;
    }
    return language === 'ar' ? GREGORIAN_MONTH_NAMES_AR : GREGORIAN_MONTH_NAMES_FA;
  }
  if (tab === 'hijri') {
    return language === 'en' ? HIJRI_MONTH_NAMES_EN : language === 'ar' ? HIJRI_MONTH_NAMES_AR : HIJRI_MONTH_NAMES_FA;
  }
  return language === 'en' ? JALALI_MONTH_NAMES_EN : language === 'ar' ? JALALI_MONTH_NAMES_AR : JALALI_MONTH_NAMES;
}

/** Full weekday names, ordered from the first day of the week. */
export function weekdayNamesFor(tab: CalendarTab, language: CalendarLanguage): string[] {
  if (language === 'en') {
    return tab === 'gregorian' ? GREGORIAN_WEEKDAYS_EN : JALALI_WEEKDAYS_EN;
  }
  if (language === 'ar') {
    return tab === 'gregorian' ? GREGORIAN_WEEKDAYS_AR : JALALI_WEEKDAYS_AR;
  }
  return tab === 'gregorian' ? GREGORIAN_WEEKDAYS_FA : JALALI_WEEKDAYS_FA;
}

export function weekdayShortNamesFor(tab: CalendarTab, language: CalendarLanguage): string[] {
  if (language === 'en') {
    return tab === 'gregorian' ? GREGORIAN_WEEKDAYS_SHORT_EN : JALALI_WEEKDAYS_SHORT_EN;
  }
  if (language === 'ar') {
    return tab === 'gregorian' ? GREGORIAN_WEEKDAYS_SHORT_AR : JALALI_WEEKDAYS_SHORT_AR;
  }
  return tab === 'gregorian' ? GREGORIAN_WEEKDAYS_SHORT_FA : JALALI_WEEKDAYS_SHORT_FA;
}

/** The Iranian week starts on Saturday, the Gregorian week on Sunday. */
export function weekStartsOnSaturdayFor(tab: CalendarTab): boolean {
  return tab !== 'gregorian';
}

export function holidayNameFor(tab: CalendarTab, language: CalendarLanguage, jalali: JalaliDate, hijri: HijriDate | null, gregorianKey: string): string {
  if (tab === 'gregorian') {
    if (language === 'ar') {
      return GREGORIAN_HOLIDAYS_AR[gregorianKey] ?? '';
    }
    if (language === 'fa') {
      return GREGORIAN_HOLIDAYS_FA[gregorianKey] ?? '';
    }
    return GREGORIAN_HOLIDAYS_EN[gregorianKey] ?? '';
  }
  if (tab === 'hijri') {
    if (!hijri) {
      return '';
    }
    const key = `${hijri.hm}-${hijri.hd}`;
    if (language === 'en') {
      return HIJRI_HOLIDAYS_EN[key] ?? '';
    }
    return language === 'ar' ? HIJRI_HOLIDAY_NAMES_AR[key] ?? '' : HIJRI_HOLIDAYS_FA[key] ?? '';
  }
  const key = `${jalali.jm}-${jalali.jd}`;
  if (language === 'en') {
    return JALALI_HOLIDAYS_EN[key] ?? '';
  }
  return language === 'ar' ? JALALI_HOLIDAYS_AR[key] ?? '' : getJalaliHoliday(jalali);
}

export interface CalendarCopy {
  today: string;
  previousMonth: string;
  nextMonth: string;
  month: string;
  year: string;
  holidayLegend: string;
  persianDigits: string;
  arabicDigits: string;
  panelEyebrow: string;
  panelTitle: string;
  panelSubtitle: string;
  copyButton: string;
  holidayName: string;
  isTodayNote: string;
  isTodayNoteHoliday: string;
  language: string;
  languageLabel: string;
  weekSummary: (weeks: string, days: string) => string;
  noOccasion: string;
  tabs: Record<CalendarTab, string>;
  hijriLabel: string;
  hijriUnsupported: string;
  secondaryLabel: (day: string) => string;
}

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function toArabicDigits(value: string | number): string {
  return String(value).replace(/\d/g, digit => ARABIC_DIGITS[Number(digit)]);
}

const TABS_FA: Record<CalendarTab, string> = { jalali: 'شمسی', gregorian: 'میلادی', hijri: 'قمری' };
const TABS_AR: Record<CalendarTab, string> = { jalali: 'هجري شمسي', gregorian: 'ميلادي', hijri: 'هجري قمري' };
const TABS_EN: Record<CalendarTab, string> = { jalali: 'Jalali (Shamsi)', gregorian: 'Gregorian', hijri: 'Hijri' };

const COPY_FA: CalendarCopy = {
  today: 'امروز',
  previousMonth: 'ماه قبل',
  nextMonth: 'ماه بعد',
  month: 'ماه',
  year: 'سال',
  holidayLegend: 'تعطیل رسمی',
  persianDigits: 'نمایش اعداد فارسی',
  arabicDigits: 'نمایش اعداد عربی',
  panelEyebrow: 'تاریخ انتخابی',
  panelTitle: 'هر سه تقویم',
  panelSubtitle: 'همان روز، به هر سه تقویم.',
  copyButton: 'کپی',
  holidayName: 'مناسبت',
  isTodayNote: 'این روز، امروز است.',
  isTodayNoteHoliday: 'این روز، امروز است و مناسبتی دارد.',
  language: 'زبان',
  languageLabel: 'زبان تقویم',
  weekSummary: (weeks, days) => `${weeks} هفته و ${days} روز در این ماه`,
  noOccasion: 'این روز مناسبت رسمی ندارد.',
  tabs: TABS_FA,
  hijriLabel: 'قمری',
  hijriUnsupported: 'تقویم قمری در این مرورگر پشتیبانی نمی‌شود.',
  secondaryLabel: day => day
};

const COPY_AR: CalendarCopy = {
  today: 'اليوم',
  previousMonth: 'الشهر السابق',
  nextMonth: 'الشهر التالي',
  month: 'الشهر',
  year: 'السنة',
  holidayLegend: 'عطلة رسمية',
  persianDigits: 'عرض الأرقام الفارسية',
  arabicDigits: 'عرض الأرقام العربية',
  panelEyebrow: 'التاريخ المحدد',
  panelTitle: 'التقاويم الثلاثة',
  panelSubtitle: 'اليوم نفسه بتقويمات الثلاثة.',
  copyButton: 'نسخ',
  holidayName: 'المناسبة',
  isTodayNote: 'هذا هو اليوم.',
  isTodayNoteHoliday: 'هذا هو اليوم، وهناك مناسبة له.',
  language: 'اللغة',
  languageLabel: 'لغة التقويم',
  weekSummary: (weeks, days) => `${weeks} أسابيع و ${days} أيام في هذا الشهر`,
  noOccasion: 'لا توجد مناسبة رسمية في هذا اليوم.',
  tabs: TABS_AR,
  hijriLabel: 'هجري',
  hijriUnsupported: 'التقويم الهجري غير مدعوم في هذا المتصفح.',
  secondaryLabel: day => day
};

const COPY_EN: CalendarCopy = {
  today: 'Today',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  month: 'Month',
  year: 'Year',
  holidayLegend: 'Public holiday',
  persianDigits: 'Persian digits',
  arabicDigits: 'Arabic digits',
  panelEyebrow: 'Selected date',
  panelTitle: 'All three calendars',
  panelSubtitle: 'The same day in all three calendars.',
  copyButton: 'Copy',
  holidayName: 'Occasion',
  isTodayNote: 'This is today.',
  isTodayNoteHoliday: 'This is today, and it has an occasion.',
  language: 'Language',
  languageLabel: 'Calendar language',
  weekSummary: (weeks, days) => `${weeks} weeks · ${days} days in this month`,
  noOccasion: 'No public occasion on this day.',
  tabs: TABS_EN,
  hijriLabel: 'Hijri',
  hijriUnsupported: 'The Hijri calendar is not supported in this browser.',
  secondaryLabel: day => day
};

export function copyFor(language: CalendarLanguage): CalendarCopy {
  return language === 'en' ? COPY_EN : language === 'ar' ? COPY_AR : COPY_FA;
}

/** Converts digits to the convention the given language expects. */
export function localizeDigits(value: string | number, language: CalendarLanguage): string {
  if (language === 'ar') {
    return toArabicDigits(value);
  }
  if (language === 'fa') {
    return String(value).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
  }
  return String(value);
}

export function isRtlLanguage(language: CalendarLanguage): boolean {
  return language === 'fa' || language === 'ar';
}

export function isCalendarLanguage(value: string | null | undefined): value is CalendarLanguage {
  return value === 'fa' || value === 'en' || value === 'ar';
}

export function isCalendarTab(value: string | null | undefined): value is CalendarTab {
  return value === 'jalali' || value === 'gregorian' || value === 'hijri';
}

/**
 * Picks the calendar that matches the visitor's system settings.
 * A region in `regions` wins over the language, so a Persian speaker in Saudi
 * Arabia still gets the region they actually live in.
 */
export function detectDefaultTab(locale: string, timeZone: string, regions: Record<CalendarTab, string[]>): CalendarTab {
  let language = '';
  let region = '';
  try {
    const parsed = new Intl.Locale(locale);
    language = parsed.language;
    region = parsed.region ?? '';
  } catch {
    const short = locale.split(/[-_]/)[0];
    language = short;
    region = (locale.split(/[-_]/)[1] ?? '').toUpperCase();
  }

  const upperRegion = region.toUpperCase();
  const upperZone = timeZone.toUpperCase();

  for (const [tab, tabRegions] of Object.entries(regions) as [CalendarTab, string[]][]) {
    if (tabRegions.some(candidate => candidate === upperRegion)) {
      return tab;
    }
  }
  for (const [tab, tabRegions] of Object.entries(regions) as [CalendarTab, string[]][]) {
    if (tabRegions.some(candidate => upperZone.includes(candidate))) {
      return tab;
    }
  }
  if (language === 'fa') {
    return 'jalali';
  }
  if (language === 'ar') {
    return 'hijri';
  }
  return 'gregorian';
}

export const TAB_REGIONS: Record<CalendarTab, string[]> = {
  jalali: ['IR', 'AF', 'TEHRAN'],
  hijri: ['SA', 'EG', 'AE', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB', 'IQ', 'SY', 'YE', 'PS', 'SD', 'LY', 'DZ', 'MA', 'TN'],
  gregorian: []
};

/** Tab and language used when the browser gives us nothing to go on. */
export const DEFAULT_TAB: CalendarTab = 'gregorian';

export function defaultLanguageForTab(tab: CalendarTab, locale: string): CalendarLanguage {
  let language = '';
  try {
    language = new Intl.Locale(locale).language;
  } catch {
    language = locale.split(/[-_]/)[0];
  }
  if (language === 'fa' || language === 'ar') {
    return language;
  }
  return tab === 'jalali' ? 'fa' : 'en';
}
