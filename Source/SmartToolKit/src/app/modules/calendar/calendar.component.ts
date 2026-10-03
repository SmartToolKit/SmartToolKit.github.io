import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, PLATFORM_ID, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActionHelperService } from '../../core/services/action-helper.service';
import {
  CALENDAR_LANGUAGES,
  CalendarLanguage,
  CalendarTab,
  DEFAULT_TAB,
  LANGUAGE_STORAGE_KEY,
  TAB_REGIONS,
  TAB_STORAGE_KEY,
  copyFor,
  defaultLanguageForTab,
  detectDefaultTab,
  holidayNameFor,
  isCalendarLanguage,
  isCalendarTab,
  isRtlLanguage,
  localizeDigits,
  monthNamesFor,
  weekStartsOnSaturdayFor,
  weekdayNamesFor,
  weekdayShortNamesFor
} from './calendar.i18n';
import {
  CalendarDay,
  CalendarMonth,
  CalendarSelectOption,
  GREGORIAN_MAX_SELECT_YEAR,
  GREGORIAN_MIN_SELECT_YEAR,
  GregorianDate,
  HijriDate,
  JalaliDate,
  JALALI_MAX_SELECT_YEAR,
  JALALI_MIN_SELECT_YEAR,
  addGregorianMonths,
  addJalaliMonths,
  buildGregorianMonth,
  buildHijriMonth,
  buildJalaliMonth,
  buildYearOptions,
  dateToHijri,
  dateToJalali,
  formatGregorian,
  formatGregorianLong,
  formatHijri,
  formatHijriLong,
  formatJalali,
  formatJalaliLong,
  hijriMonthLength,
  hijriToDate,
  isHijriSupported,
  isSameDay,
  jalaliMonthLength,
  jalaliToDate,
  startOfDay
} from './calendar.utils';

interface TabOption {
  id: CalendarTab;
  icon: string;
}

const TAB_ICONS: Record<CalendarTab, string> = {
  jalali: 'fa-calendar-days',
  gregorian: 'fa-globe',
  hijri: 'fa-moon'
};

/** Hijri years offered in the year dropdown. */
const HIJRI_MIN_SELECT_YEAR = 1430;
const HIJRI_MAX_SELECT_YEAR = 1460;

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent {
  readonly storageKey = TAB_STORAGE_KEY;
  readonly languageStorageKey = LANGUAGE_STORAGE_KEY;
  readonly languages = CALENDAR_LANGUAGES;
  readonly tabs: TabOption[] = [
    { id: 'jalali', icon: TAB_ICONS.jalali },
    { id: 'gregorian', icon: TAB_ICONS.gregorian },
    { id: 'hijri', icon: TAB_ICONS.hijri }
  ];

  activeTab: CalendarTab = 'jalali';
  language: CalendarLanguage = 'fa';
  useLocalizedDigits = true;
  today = startOfDay(new Date());
  selectedDate = this.today;
  anchorDate = this.today;

  private cachedMonth: { key: string; month: CalendarMonth } | null = null;

  private readonly isBrowser: boolean;

  constructor(
    private titleService: Title,
    private meta: Meta,
    private changeDetector: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
    public actionHelper: ActionHelperService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.titleService.setTitle('Smart ToolKit - Calendar');

    const description = 'Browse the Jalali (Shamsi) and Gregorian calendars side by side, jump to any date and convert between both calendar systems.';
    const keywords = 'jalali calendar, shamsi calendar, gregorian calendar, persian calendar, date converter, nowruz';
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });
    this.meta.updateTag({ property: 'og:title', content: 'Calendar | Jalali and Gregorian' });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: 'https://smarttoolkit.github.io/calendar' });
    this.meta.updateTag({ name: 'twitter:title', content: 'Calendar | Smart ToolKit' });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    const canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) {
      canonical.href = 'https://smarttoolkit.github.io/calendar';
    }

    if (this.isBrowser) {
      afterNextRender(() => {
        this.today = startOfDay(new Date());
        this.selectedDate = this.today;
        this.anchorDate = this.today;
        // Language is resolved first: detection may set it from the browser locale.
        this.language = this.readSavedLanguage();
        this.activeTab = this.readSavedTab();
        this.changeDetector.markForCheck();
      });
    }
  }

  get isJalaliTab(): boolean {
    return this.activeTab === 'jalali';
  }

  /**
   * The visible month. Built once per (tab, anchor, language, digits) combination
   * and reused, because every getter call returns fresh objects and the grid would
   * otherwise re-render mid-cycle and hand clicks the wrong cell.
   */
  get month(): CalendarMonth {
    const key = `${this.activeTab}|${this.anchorDate.getTime()}|${this.language}|${this.useLocalizedDigits}|${this.today.getTime()}`;
    if (this.cachedMonth && this.cachedMonth.key === key) {
      return this.cachedMonth.month;
    }

    const built = this.buildMonth();
    this.cachedMonth = { key, month: built };
    return built;
  }

  private buildMonth(): CalendarMonth {
    if (this.activeTab === 'hijri') {
      const hijri = dateToHijri(this.anchorDate);
      return buildHijriMonth(
        hijri?.hy ?? 1, hijri?.hm ?? 1, this.today,
        this.monthNames, this.digitizeFor, this.holidayHijriFor
      );
    }
    if (this.activeTab === 'gregorian') {
      return buildGregorianMonth(
        this.anchorDate.getFullYear(), this.anchorDate.getMonth() + 1, this.today,
        this.monthNames, this.digitizeFor, this.holidayGregorianFor
      );
    }
    return buildJalaliMonth(
      dateToJalali(this.anchorDate).jy, dateToJalali(this.anchorDate).jm, this.today,
      this.monthNames, this.digitizeFor, this.holidayJalaliFor
    );
  }

  get monthTitle(): string {
    return this.month.title;
  }

  get weekdayLabels(): string[] {
    return weekdayShortNamesFor(this.activeTab, this.language);
  }

  /** Full weekday names, used as the tooltip on each weekday header cell. */
  get weekdayTitles(): string[] {
    return weekdayNamesFor(this.activeTab, this.language);
  }

  get copy() {
    return copyFor(this.language);
  }

  get monthNames(): string[] {
    return monthNamesFor(this.activeTab, this.language);
  }

  private monthNamesFor(tab: CalendarTab): string[] {
    return monthNamesFor(tab, this.language);
  }

  /** Converts a UTC-based Hijri date back to a local Date for the Jalali lookup. */
  private hijriToLocal(hijri: HijriDate): Date {
    return hijriToDate(hijri.hy, hijri.hm, hijri.hd) ?? this.today;
  }

  /** Formats a number with the digits the chosen language expects. */
  digitize(value: number): string {
    return this.useLocalizedDigits ? localizeDigits(value, this.language) : String(value);
  }

  /** Bound callbacks for the grid builders, which call these without a receiver. */
  private readonly digitizeFor = (value: number): string => this.digitize(value);

  private readonly holidayJalaliFor = (jalali: JalaliDate): string =>
    holidayNameFor('jalali', this.language, jalali, dateToHijri(jalaliToDate(jalali)), '');

  private readonly holidayHijriFor = (hijri: HijriDate): string =>
    holidayNameFor('hijri', this.language, dateToJalali(this.hijriToLocal(hijri)), hijri, '');

  private readonly holidayGregorianFor = (gregorian: GregorianDate): string =>
    holidayNameFor('gregorian', this.language, dateToJalali(jalaliToDate({ jy: 1, jm: 1, jd: 1 })), null, `${gregorian.gm}-${gregorian.gd}`);

  get monthSummary(): string {
    return this.copy.weekSummary(
      this.useLocalizedDigits ? localizeDigits(this.month.weeksInMonth, this.language) : String(this.month.weeksInMonth),
      this.useLocalizedDigits ? localizeDigits(this.month.daysInMonth, this.language) : String(this.month.daysInMonth)
    );
  }

  get monthOptions(): CalendarSelectOption[] {
    return this.monthNames.map((label, index) => ({ value: index + 1, label }));
  }

  get yearOptions(): number[] {
    switch (this.activeTab) {
      case 'jalali':
        return buildYearOptions(JALALI_MIN_SELECT_YEAR, JALALI_MAX_SELECT_YEAR);
      case 'hijri':
        return buildYearOptions(HIJRI_MIN_SELECT_YEAR, HIJRI_MAX_SELECT_YEAR);
      default:
        return buildYearOptions(GREGORIAN_MIN_SELECT_YEAR, GREGORIAN_MAX_SELECT_YEAR);
    }
  }

  get selectedMonth(): number {
    if (this.activeTab === 'jalali') {
      return dateToJalali(this.anchorDate).jm;
    }
    if (this.activeTab === 'hijri') {
      return dateToHijri(this.anchorDate)?.hm ?? 1;
    }
    return this.anchorDate.getMonth() + 1;
  }

  get selectedYear(): number {
    if (this.activeTab === 'jalali') {
      return dateToJalali(this.anchorDate).jy;
    }
    if (this.activeTab === 'hijri') {
      return dateToHijri(this.anchorDate)?.hy ?? 0;
    }
    return this.anchorDate.getFullYear();
  }

  get selectedJalali(): string {
    return formatJalali(dateToJalali(this.selectedDate), this.useLocalizedDigits && this.language !== 'en');
  }

  get selectedGregorian(): string {
    return formatGregorian({ gy: this.selectedDate.getFullYear(), gm: this.selectedDate.getMonth() + 1, gd: this.selectedDate.getDate() });
  }

  get selectedHijri(): string {
    const hijri = dateToHijri(this.selectedDate);
    return hijri ? formatHijri(hijri, this.useLocalizedDigits && this.language !== 'en') : '';
  }

  get selectedJalaliLong(): string {
    return formatJalaliLong(dateToJalali(this.selectedDate), this.useLocalizedDigits && this.language !== 'en', this.monthNamesFor('jalali'));
  }

  get selectedHijriLong(): string {
    const hijri = dateToHijri(this.selectedDate);
    if (!hijri) {
      return '';
    }
    const digits = this.useLocalizedDigits ? (value: number) => localizeDigits(value, this.language) : (value: number) => String(value);
    return formatHijriLong(hijri, monthNamesFor('hijri', this.language), digits);
  }

  get weekStartsOnSaturday(): boolean {
    return weekStartsOnSaturdayFor(this.activeTab);
  }

  get selectedGregorianLong(): string {
    // The Gregorian labels always start on Sunday, whatever the grid shows.
    return formatGregorianLong(
      { gy: this.selectedDate.getFullYear(), gm: this.selectedDate.getMonth() + 1, gd: this.selectedDate.getDate() },
      weekdayNamesFor('gregorian', this.language),
      false
    );
  }

  get isSelectedToday(): boolean {
    return isSameDay(this.selectedDate, this.today);
  }

  /**
   * Name of the occasion on the selected day, taken from the grid so the value
   * always matches the calendar the user is looking at. Empty on ordinary days.
   */
  get selectedHolidayTitle(): string {
    return this.month.weeks
      .flat()
      .find(day => isSameDay(day.date, this.selectedDate))?.holidayTitle ?? '';
  }

  get isRtl(): boolean {
    return isRtlLanguage(this.language);
  }

  /** Mirrors the navigation chevrons so they follow the reading direction. */
  get previousIcon(): string {
    return this.isRtl ? 'fa-chevron-right' : 'fa-chevron-left';
  }

  get nextIcon(): string {
    return this.isRtl ? 'fa-chevron-left' : 'fa-chevron-right';
  }

  setTab(tab: CalendarTab): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.saveTab(tab);
    this.changeDetector.markForCheck();
  }

  setLanguage(language: CalendarLanguage): void {
    if (this.language === language) {
      return;
    }
    this.language = language;
    this.saveLanguage(language);
    this.changeDetector.markForCheck();
  }

  goToday(): void {
    this.selectedDate = this.today;
    this.anchorDate = this.today;
    this.changeDetector.markForCheck();
  }

  shiftMonth(delta: number): void {
    this.shiftMonthInternal(delta);
    this.changeDetector.markForCheck();
  }

  onMonthChange(value: string): void {
    const month = Number(value);
    this.applyMonthSelection(this.selectedYear, month);
    this.changeDetector.markForCheck();
  }

  onYearChange(value: string): void {
    const year = Number(value);
    this.applyYearSelection(year, this.selectedMonth);
    this.changeDetector.markForCheck();
  }

  private shiftMonthInternal(delta: number): void {
    if (this.activeTab === 'jalali') {
      const current = dateToJalali(this.anchorDate);
      const target = addJalaliMonths(current.jy, current.jm, delta);
      const selected = dateToJalali(this.selectedDate);
      this.anchorDate = jalaliToDate({ jy: target.jy, jm: target.jm, jd: 1 });
      this.selectedDate = jalaliToDate({
        jy: target.jy,
        jm: target.jm,
        jd: Math.min(selected.jd, jalaliMonthLength(target.jy, target.jm))
      });
      return;
    }

    if (this.activeTab === 'hijri') {
      const current = dateToHijri(this.anchorDate);
      if (!current) {
        return;
      }
      const total = current.hy * 12 + (current.hm - 1) + delta;
      const hy = Math.floor(total / 12);
      const hm = ((total % 12) + 12) % 12 + 1;
      const selected = dateToHijri(this.selectedDate);
      const start = hijriToDate(hy, hm, 1);
      if (!start) {
        return;
      }
      this.anchorDate = start;
      this.selectedDate = new Date(
        start.getFullYear(),
        start.getMonth(),
        Math.min(selected?.hd ?? 1, hijriMonthLength(hy, hm))
      );
      return;
    }

    const anchor = addGregorianMonths(this.anchorDate, delta);
    const maxDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    this.anchorDate = anchor;
    this.selectedDate = new Date(anchor.getFullYear(), anchor.getMonth(), Math.min(this.selectedDate.getDate(), maxDay));
  }

  private applyMonthSelection(year: number, month: number): void {
    if (this.activeTab === 'jalali') {
      this.applyJalali(year, month);
      return;
    }
    if (this.activeTab === 'hijri') {
      this.applyHijri(year, month);
      return;
    }
    this.applyGregorian(year, month);
  }

  private applyYearSelection(year: number, month: number): void {
    if (this.activeTab === 'jalali') {
      this.applyJalali(year, month);
      return;
    }
    if (this.activeTab === 'hijri') {
      this.applyHijri(year, month);
      return;
    }
    this.applyGregorian(year, month);
  }

  selectDay(day: CalendarDay): void {
    this.selectedDate = day.date;
    if (!day.isCurrentMonth) {
      this.anchorDate = this.activeTab === 'hijri'
        ? hijriToDate(day.hijri.hy, day.hijri.hm, 1) ?? this.anchorDate
        : this.activeTab === 'gregorian'
          ? new Date(day.gregorian.gy, day.gregorian.gm - 1, 1)
          : jalaliToDate({ jy: day.jalali.jy, jm: day.jalali.jm, jd: 1 });
    }
    this.changeDetector.markForCheck();
  }

  copyDate(): void {
    void this.actionHelper.copy(this.isJalaliTab
      ? `${this.selectedJalali} (${this.selectedGregorian})`
      : `${this.selectedGregorian} (${this.selectedJalali})`);
  }

  trackByDay(_index: number, day: CalendarDay): string {
    return `${day.jalali.jy}-${day.jalali.jm}-${day.jalali.jd}`;
  }

  isSelectedDay(date: Date): boolean {
    return isSameDay(date, this.selectedDate);
  }

  onLanguageChange(value: string): void {
    if (isCalendarLanguage(value)) {
      this.setLanguage(value);
    }
  }

  /** Screen reader label combining the day number and any occasion name. */
  dayAriaLabel(day: CalendarDay): string {
    const number = this.useLocalizedDigits ? localizeDigits(day.dayNumber, this.language) : String(day.dayNumber);
    return day.holidayTitle ? `${number}، ${day.holidayTitle}` : number;
  }

  /** The other calendar shown in small print under the Gregorian day number. */
  formatSecondary(day: CalendarDay): string {
    if (this.activeTab === 'hijri') {
      return formatJalali(day.jalali, this.useLocalizedDigits && this.language !== 'en');
    }
    if (this.activeTab === 'gregorian') {
      return formatJalali(day.jalali, this.useLocalizedDigits && this.language !== 'en');
    }
    return formatGregorian(day.gregorian);
  }

  /** Secondary line inside a cell: the Hijri day on the Jalali view, and vice versa. */
  secondaryLine(day: CalendarDay): string {
    if (this.activeTab === 'jalali') {
      return day.hijri.hy ? `${localizeDigits(day.hijri.hd, this.language)}/${localizeDigits(day.hijri.hm, this.language)}` : '';
    }
    return `${day.jalali.jd}/${day.jalali.jm}`;
  }

  private applyJalali(jy: number, jm: number): void {
    if (jm < 1 || jm > 12) {
      return;
    }
    this.anchorDate = jalaliToDate({ jy, jm, jd: 1 });
    const selected = dateToJalali(this.selectedDate);
    this.selectedDate = selected.jy === jy && selected.jm === jm
      ? this.selectedDate
      : jalaliToDate({ jy, jm, jd: Math.min(selected.jd, jalaliMonthLength(jy, jm)) });
  }

  private applyHijri(hy: number, hm: number): void {
    if (hm < 1 || hm > 12) {
      return;
    }
    const start = hijriToDate(hy, hm, 1);
    if (!start) {
      return;
    }
    this.anchorDate = start;
    const selected = dateToHijri(this.selectedDate);
    this.selectedDate = selected && selected.hy === hy && selected.hm === hm
      ? this.selectedDate
      : new Date(this.anchorDate.getFullYear(), this.anchorDate.getMonth(), Math.min(selected?.hd ?? 1, hijriMonthLength(hy, hm)));
  }

  private applyGregorian(gy: number, gm: number): void {
    if (gm < 1 || gm > 12) {
      return;
    }
    this.anchorDate = new Date(gy, gm - 1, 1);
    const selected = this.selectedDate;
    const maxDay = new Date(gy, gm, 0).getDate();
    this.selectedDate = selected.getFullYear() === gy && selected.getMonth() + 1 === gm
      ? selected
      : new Date(gy, gm - 1, Math.min(selected.getDate(), maxDay));
  }

  /**
   * Restores the saved tab, or falls back to the calendar the visitor's own
   * system settings point at. A saved tab always wins.
   */
  private readSavedTab(): CalendarTab {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY);
      if (isCalendarTab(saved)) {
        return saved;
      }
    } catch {
      // storage unavailable, fall through to detection
    }
    return this.detectFromSystem();
  }

  /** A stored language wins; otherwise fall back to what the system suggests. */
  private readSavedLanguage(): CalendarLanguage {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isCalendarLanguage(saved)) {
        return saved;
      }
    } catch {
      // storage unavailable, fall through to detection
    }
    return defaultLanguageForTab(this.detectFromSystem(), this.systemLocale());
  }

  private detectFromSystem(): CalendarTab {
    try {
      const resolved = Intl.DateTimeFormat().resolvedOptions();
      return detectDefaultTab(resolved.locale ?? 'en', resolved.timeZone ?? 'UTC', TAB_REGIONS);
    } catch {
      return DEFAULT_TAB;
    }
  }

  private systemLocale(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().locale ?? 'en';
    } catch {
      return 'en';
    }
  }

  private saveTab(tab: CalendarTab): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(TAB_STORAGE_KEY, tab);
    } catch {
      // storage unavailable, keep the tab for this session only
    }
  }

  private saveLanguage(language: CalendarLanguage): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // storage unavailable, keep the language for this session only
    }
  }
}