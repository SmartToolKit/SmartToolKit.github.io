import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, PLATFORM_ID, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActionHelperService } from '../../core/services/action-helper.service';
import {
  CalendarDay,
  CalendarMonth,
  CalendarSelectOption,
  GREGORIAN_MAX_SELECT_YEAR,
  GREGORIAN_MIN_SELECT_YEAR,
  GREGORIAN_WEEKDAY_LABELS,
  GREGORIAN_WEEKDAY_SHORT_LABELS,
  JALALI_MAX_SELECT_YEAR,
  JALALI_MIN_SELECT_YEAR,
  JALALI_WEEKDAY_LABELS,
  JALALI_WEEKDAY_SHORT_LABELS,
  addGregorianMonths,
  addJalaliMonths,
  buildGregorianMonth,
  buildJalaliMonth,
  buildYearOptions,
  dateToJalali,
  formatGregorian,
  formatGregorianLong,
  formatJalali,
  formatJalaliLong,
  getGregorianMonthOptions,
  getJalaliMonthOptions,
  isSameDay,
  jalaliMonthLength,
  jalaliToDate,
  startOfDay,
  toPersianDigits
} from './calendar.utils';

type CalendarTab = 'jalali' | 'gregorian';

interface TabOption {
  id: CalendarTab;
  label: string;
  icon: string;
}

/** Header chrome for the calendar, localized per tab. */
interface CalendarCopy {
  today: string;
  previousMonth: string;
  nextMonth: string;
  month: string;
  year: string;
  weekday: string;
  holidayLegend: string;
  persianDigits: string;
  panelEyebrow: string;
  panelTitle: string;
  panelSubtitle: string;
  copyButton: string;
  jalaliLabel: string;
  gregorianLabel: string;
  isTodayNote: string;
}

const GREGORIAN_COPY: CalendarCopy = {
  today: 'Today',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  month: 'Month',
  year: 'Year',
  weekday: 'Weekday',
  holidayLegend: 'Public holiday',
  persianDigits: 'Show Persian digits',
  panelEyebrow: 'Selected date',
  panelTitle: 'Both calendars',
  panelSubtitle: 'The same day expressed in each calendar system.',
  copyButton: 'Copy',
  jalaliLabel: 'Jalali',
  gregorianLabel: 'Gregorian',
  isTodayNote: 'This is today in both calendars.'
};

const JALALI_COPY: CalendarCopy = {
  today: 'امروز',
  previousMonth: 'ماه قبل',
  nextMonth: 'ماه بعد',
  month: 'ماه',
  year: 'سال',
  weekday: 'روز هفته',
  holidayLegend: 'تعطیل رسمی',
  persianDigits: 'نمایش اعداد فارسی',
  panelEyebrow: 'تاریخ انتخابی',
  panelTitle: 'هر دو تقویم',
  panelSubtitle: 'همان روز، به هر دو تقویم.',
  copyButton: 'کپی',
  jalaliLabel: 'شمسی',
  gregorianLabel: 'میلادی',
  isTodayNote: 'این روز، امروز است.'
};

const STORAGE_KEY = 'calendar-active-tab';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent {
  readonly storageKey = STORAGE_KEY;
  readonly tabs: TabOption[] = [
    { id: 'jalali', label: 'Jalali (Shamsi)', icon: 'fa-calendar-days' },
    { id: 'gregorian', label: 'Gregorian (Miladi)', icon: 'fa-globe' }
  ];

  activeTab: CalendarTab = 'jalali';
  showPersianDigits = true;
  today = startOfDay(new Date());
  selectedDate = this.today;
  anchorDate = this.today;

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
        this.activeTab = this.readSavedTab();
        this.selectedDate = this.today;
        this.anchorDate = this.today;
        this.changeDetector.markForCheck();
      });
    }
  }

  get isJalaliTab(): boolean {
    return this.activeTab === 'jalali';
  }

  get month(): CalendarMonth {
    return this.isJalaliTab
      ? buildJalaliMonth(dateToJalali(this.anchorDate).jy, dateToJalali(this.anchorDate).jm, this.today)
      : buildGregorianMonth(this.anchorDate.getFullYear(), this.anchorDate.getMonth() + 1, this.today);
  }

  get monthTitle(): string {
    return this.month.title;
  }

  get weekdayLabels(): string[] {
    return this.isJalaliTab ? JALALI_WEEKDAY_SHORT_LABELS : GREGORIAN_WEEKDAY_SHORT_LABELS;
  }

  /** Full weekday names, used as the tooltip on each weekday header cell. */
  get weekdayTitles(): string[] {
    return this.isJalaliTab ? JALALI_WEEKDAY_LABELS : GREGORIAN_WEEKDAY_LABELS;
  }

  get copy(): CalendarCopy {
    return this.isJalaliTab ? JALALI_COPY : GREGORIAN_COPY;
  }

  /** Chevrons mirror on the Persian view so they follow the reading direction. */
  get previousIcon(): string {
    return this.isJalaliTab ? 'fa-chevron-right' : 'fa-chevron-left';
  }

  get nextIcon(): string {
    return this.isJalaliTab ? 'fa-chevron-left' : 'fa-chevron-right';
  }

  get monthSummary(): string {
    const weeks = toPersianDigits(this.month.weeksInMonth);
    const days = toPersianDigits(this.month.daysInMonth);
    return this.isJalaliTab
      ? `${weeks} هفته و ${days} روز در این ماه`
      : `${this.month.weeksInMonth} weeks · ${this.month.daysInMonth} days in this month`;
  }

  get monthOptions(): CalendarSelectOption[] {
    return this.isJalaliTab ? getJalaliMonthOptions() : getGregorianMonthOptions();
  }

  get yearOptions(): number[] {
    return this.isJalaliTab
      ? buildYearOptions(JALALI_MIN_SELECT_YEAR, JALALI_MAX_SELECT_YEAR)
      : buildYearOptions(GREGORIAN_MIN_SELECT_YEAR, GREGORIAN_MAX_SELECT_YEAR);
  }

  get selectedMonth(): number {
    return this.isJalaliTab ? dateToJalali(this.anchorDate).jm : this.anchorDate.getMonth() + 1;
  }

  get selectedYear(): number {
    return this.isJalaliTab ? dateToJalali(this.anchorDate).jy : this.anchorDate.getFullYear();
  }

  get selectedJalali(): string {
    return formatJalali(dateToJalali(this.selectedDate), this.showPersianDigits);
  }

  get selectedGregorian(): string {
    return formatGregorian({ gy: this.selectedDate.getFullYear(), gm: this.selectedDate.getMonth() + 1, gd: this.selectedDate.getDate() });
  }

  get selectedJalaliLong(): string {
    return formatJalaliLong(dateToJalali(this.selectedDate), this.showPersianDigits);
  }

  /** The Iranian week runs Saturday to Friday, unlike the Gregorian week. */
  get weekStartsOnSaturday(): boolean {
    return this.isJalaliTab;
  }

  get selectedGregorianLong(): string {
    return formatGregorianLong(
      { gy: this.selectedDate.getFullYear(), gm: this.selectedDate.getMonth() + 1, gd: this.selectedDate.getDate() },
      this.isJalaliTab ? JALALI_WEEKDAY_LABELS : GREGORIAN_WEEKDAY_LABELS,
      this.weekStartsOnSaturday
    );
  }

  get isSelectedToday(): boolean {
    return isSameDay(this.selectedDate, this.today);
  }

  setTab(tab: CalendarTab): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.saveTab(tab);
  }

  goToday(): void {
    this.selectedDate = this.today;
    this.anchorDate = this.today;
  }

  shiftMonth(delta: number): void {
    if (this.isJalaliTab) {
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

    const anchor = addGregorianMonths(this.anchorDate, delta);
    const maxDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    this.anchorDate = anchor;
    this.selectedDate = new Date(anchor.getFullYear(), anchor.getMonth(), Math.min(this.selectedDate.getDate(), maxDay));
  }

  onMonthChange(value: string): void {
    const month = Number(value);
    if (this.isJalaliTab) {
      this.applyJalali(this.selectedYear, month);
      return;
    }
    this.applyGregorian(this.selectedYear, month);
  }

  onYearChange(value: string): void {
    const year = Number(value);
    if (this.isJalaliTab) {
      this.applyJalali(year, this.selectedMonth);
      return;
    }
    this.applyGregorian(year, this.selectedMonth);
  }

  selectDay(day: CalendarDay): void {
    this.selectedDate = day.date;
    if (!day.isCurrentMonth) {
      this.anchorDate = this.isJalaliTab
        ? jalaliToDate({ jy: day.jalali.jy, jm: day.jalali.jm, jd: 1 })
        : new Date(day.gregorian.gy, day.gregorian.gm - 1, 1);
    }
  }

  copyDate(): void {
    void this.actionHelper.copy(this.isJalaliTab
      ? `${this.selectedJalali} (${this.selectedGregorian})`
      : `${this.selectedGregorian} (${this.selectedJalali})`);
  }

  trackByDay(_index: number, day: CalendarDay): string {
    return `${day.jalali.jy}-${day.jalali.jm}-${day.jalali.jd}`;
  }

  toPersianDigits(value: string | number): string {
    return toPersianDigits(value);
  }

  isSelectedDay(date: Date): boolean {
    return isSameDay(date, this.selectedDate);
  }

  formatSecondary(day: CalendarDay): string {
    return this.isJalaliTab ? formatGregorian(day.gregorian) : formatJalali(day.jalali, this.showPersianDigits);
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

  private readSavedTab(): CalendarTab {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'gregorian' || saved === 'jalali' ? saved : 'jalali';
    } catch {
      return 'jalali';
    }
  }

  private saveTab(tab: CalendarTab): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, tab);
    } catch {
      // storage unavailable, keep the tab for this session only
    }
  }
}