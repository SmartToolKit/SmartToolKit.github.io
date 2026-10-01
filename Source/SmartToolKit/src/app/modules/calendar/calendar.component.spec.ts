import { DOCUMENT } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarComponent } from './calendar.component';
import { dateToJalali } from './calendar.utils';

describe('CalendarComponent', () => {
  let fixture: ComponentFixture<CalendarComponent>;
  let component: CalendarComponent;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      declarations: [CalendarComponent],
      providers: [{ provide: DOCUMENT, useValue: document }]
    }).compileComponents();
    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('shows today in the year dropdown on first load', () => {
    const today = new Date();
    const expectedJalali = dateToJalali(today);

    const yearSelect = fixture.nativeElement.querySelector('#calendar-year-select') as HTMLSelectElement;
    const monthSelect = fixture.nativeElement.querySelector('#calendar-month-select') as HTMLSelectElement;

    expect(Number(yearSelect.value)).toBe(expectedJalali.jy);
    expect(Number(monthSelect.value)).toBe(expectedJalali.jm);
    expect(yearSelect.selectedIndex).toBe(expectedJalali.jy - 1300);
  });

  it('keeps the year dropdown in sync after switching to the Gregorian tab', () => {
    // Regression: the tab rebuilds the option list, which used to reset the
    // select back to its first option (1900 / 1300) instead of the current year.
    (fixture.nativeElement.querySelector('#calendar-tab-gregorian') as HTMLButtonElement).click();
    fixture.detectChanges();

    const today = new Date();
    const yearSelect = fixture.nativeElement.querySelector('#calendar-year-select') as HTMLSelectElement;
    const monthSelect = fixture.nativeElement.querySelector('#calendar-month-select') as HTMLSelectElement;

    expect(Number(yearSelect.value)).toBe(today.getFullYear());
    expect(Number(monthSelect.value)).toBe(today.getMonth() + 1);
    expect(yearSelect.selectedIndex).toBe(today.getFullYear() - 1900);
    expect(component.monthTitle).toBe(component.month.title);
  });

  it('keeps the year dropdown in sync after switching back to the Jalali tab', () => {
    (fixture.nativeElement.querySelector('#calendar-tab-gregorian') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('#calendar-tab-jalali') as HTMLButtonElement).click();
    fixture.detectChanges();

    const expectedJalali = dateToJalali(new Date());
    const yearSelect = fixture.nativeElement.querySelector('#calendar-year-select') as HTMLSelectElement;

    expect(Number(yearSelect.value)).toBe(expectedJalali.jy);
    expect(yearSelect.selectedIndex).toBe(expectedJalali.jy - 1300);
  });

  it('updates the year dropdown when the month or year changes', () => {
    // The OnPush view only re-renders on a real DOM event, so drive the selects
    // the way a user would instead of calling the handlers directly.
    const yearSelect = fixture.nativeElement.querySelector('#calendar-year-select') as HTMLSelectElement;
    const monthSelect = fixture.nativeElement.querySelector('#calendar-month-select') as HTMLSelectElement;

    yearSelect.value = '1398';
    yearSelect.dispatchEvent(new Event('change'));
    monthSelect.value = '3';
    monthSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(Number(yearSelect.value)).toBe(1398);
    expect(Number(monthSelect.value)).toBe(3);
    expect(component.monthTitle).toContain('خرداد');
    expect(component.monthTitle).toContain('۱۳۹۸');
  });

  it('applies a year picked from the dropdown', () => {
    const yearSelect = fixture.nativeElement.querySelector('#calendar-year-select') as HTMLSelectElement;
    yearSelect.value = '1398';
    yearSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.selectedYear).toBe(1398);
    expect(component.monthTitle).toContain('۱۳۹۸');
  });

  it('starts on the Jalali tab when nothing is stored', () => {
    expect(component.activeTab).toBe('jalali');
    expect(component.isJalaliTab).toBeTrue();
  });

  it('persists the active tab to localStorage', () => {
    component.setTab('gregorian');

    expect(component.activeTab).toBe('gregorian');
    expect(localStorage.getItem(component.storageKey)).toBe('gregorian');
  });

  it('reads a previously stored tab back', () => {
    localStorage.setItem('calendar-active-tab', 'gregorian');
    const stored = TestBed.createComponent(CalendarComponent);
    stored.detectChanges();

    const restored = stored.componentInstance as unknown as { readSavedTab(): string };
    expect(restored.readSavedTab()).toBe('gregorian');
  });

  it('ignores an unrecognised stored tab', () => {
    localStorage.setItem('calendar-active-tab', 'persian');

    const stored = TestBed.createComponent(CalendarComponent);
    stored.detectChanges();

    const restored = stored.componentInstance as unknown as { readSavedTab(): string };
    expect(restored.readSavedTab()).toBe('jalali');
  });

  it('keeps the same selected day while switching tabs', () => {
    component.goToday();
    const before = component.selectedDate.getTime();

    component.setTab('gregorian');

    expect(component.selectedDate.getTime()).toBe(before);
    expect(component.selectedJalali).toBeTruthy();
    expect(component.selectedGregorian).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('renders one active tab, seven weekday headers and a six week grid', () => {
    const tabs = fixture.nativeElement.querySelectorAll('.calendar-tab');
    const active = fixture.nativeElement.querySelectorAll('.calendar-tab--active');

    expect(tabs.length).toBe(2);
    expect(active.length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.calendar-weekday').length).toBe(7);
    expect(fixture.nativeElement.querySelectorAll('.calendar-week').length).toBe(6);
    expect(fixture.nativeElement.querySelectorAll('.calendar-day').length).toBe(42);
  });

  it('marks exactly one cell as today and one as selected', () => {
    expect(fixture.nativeElement.querySelectorAll('.calendar-day--today').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.calendar-day--selected').length).toBe(1);
  });

  it('shows the Jalali weekday order on the Jalali tab and Gregorian on the other', () => {
    expect(component.weekdayLabels).toEqual(['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']);
    expect(component.weekdayTitles[6]).toBe('جمعه');

    component.setTab('gregorian');

    expect(component.weekdayLabels[0]).toBe('Sun');
    expect(component.weekdayTitles[0]).toBe('Sunday');
  });

  it('renders the calendar header in Persian on the Jalali tab', () => {
    component.onYearChange('1405');
    component.onMonthChange('7');
    fixture.detectChanges();

    expect(component.monthTitle).toBe('مهر ۱۴۰۵');
    expect(component.monthSummary).toBe('۵ هفته و ۳۰ روز در این ماه');
    expect(component.copy.today).toBe('امروز');
    expect(component.copy.previousMonth).toBe('ماه قبل');
    expect(component.copy.holidayLegend).toBe('تعطیل رسمی');
    expect(component.copy.persianDigits).toBe('نمایش اعداد فارسی');
    expect(fixture.nativeElement.textContent).toContain('مهر ۱۴۰۵');
    expect(fixture.nativeElement.textContent).toContain('امروز');
  });

  it('renders the calendar header in English on the Gregorian tab', () => {
    component.setTab('gregorian');
    component.onYearChange('2026');
    component.onMonthChange('10');
    fixture.detectChanges();

    expect(component.monthTitle).toBe('October 2026');
    expect(component.monthSummary).toBe('5 weeks · 31 days in this month');
    expect(component.copy.today).toBe('Today');
  });

  it('reads the long weekday of the selected date in the active language', () => {
    component.onYearChange('1405');
    component.onMonthChange('7');
    const target = component.month.weeks.flat().find(day => day.isCurrentMonth && day.gregorian.gd === 1 && day.gregorian.gm === 10)!;
    component.selectDay(target);

    expect(component.selectedJalaliLong).toBe('۹ مهر ۱۴۰۵');
    expect(component.selectedGregorianLong).toBe('پنج‌شنبه, October 1, 2026');

    component.setTab('gregorian');

    expect(component.selectedGregorianLong).toBe('Thursday, October 1, 2026');
  });

  it('mirrors the month navigation chevrons on the Persian view', () => {
    expect(component.previousIcon).toBe('fa-chevron-right');
    expect(component.nextIcon).toBe('fa-chevron-left');

    component.setTab('gregorian');

    expect(component.previousIcon).toBe('fa-chevron-left');
    expect(component.nextIcon).toBe('fa-chevron-right');
  });

  it('lays the Jalali panel out right to left', () => {
    const panel = () => fixture.nativeElement.querySelector('.tool-pane') as HTMLElement;
    const tabButton = (id: string) => fixture.nativeElement.querySelector(`#calendar-tab-${id}`) as HTMLButtonElement;

    expect(panel().getAttribute('dir')).toBe('rtl');

    tabButton('gregorian').click();
    fixture.detectChanges();

    expect(panel().getAttribute('dir')).toBe('ltr');

    tabButton('jalali').click();
    fixture.detectChanges();

    expect(panel().getAttribute('dir')).toBe('rtl');
  });

  it('navigates months across a year boundary in the Jalali calendar', () => {
    component.onYearChange('1404');
    component.onMonthChange('12');
    expect(component.selectedMonth).toBe(12);
    expect(component.selectedYear).toBe(1404);

    component.shiftMonth(1);

    expect(component.selectedMonth).toBe(1);
    expect(component.selectedYear).toBe(1405);
  });

  it('renders the calendar numbers and letters in bold', () => {
    // The OnPush view only re-renders when a tab button is clicked, so click it.
    (fixture.nativeElement.querySelector('#calendar-tab-gregorian') as HTMLButtonElement).click();
    fixture.detectChanges();

    const weightOf = (selector: string) => {
      const element = fixture.nativeElement.querySelector(selector) as HTMLElement | null;
      expect(element).withContext(`missing ${selector}`).not.toBeNull();
      return getComputedStyle(element!).fontWeight;
    };

    expect(weightOf('.calendar-day')).toBe('700');
    expect(weightOf('.calendar-weekday')).toBe('700');
    expect(weightOf('.calendar-month-title')).toBe('700');
    expect(weightOf('.calendar-day-secondary')).toBe('700');
    expect(weightOf('#calendar-month-select')).toBe('700');
    expect(weightOf('.calendar-converter-value')).toBe('700');
  });

  it('clamps the selected day when walking into shorter Jalali months', () => {
    component.onYearChange('1404');
    component.onMonthChange('1');
    expect(component.month.daysInMonth).toBe(31);

    const lastDay = component.month.weeks.flat().find(day => day.isCurrentMonth && day.dayNumber === 31)!;
    component.selectDay(lastDay);
    expect(dateToJalali(component.selectedDate)).toEqual({ jy: 1404, jm: 1, jd: 31 });

    component.shiftMonth(6);
    expect(component.selectedMonth).toBe(7);
    expect(dateToJalali(component.selectedDate)).toEqual({ jy: 1404, jm: 7, jd: 30 });

    for (let step = 0; step < 5; step++) {
      component.shiftMonth(1);
    }

    expect(component.selectedMonth).toBe(12);
    expect(component.month.daysInMonth).toBe(29);
    expect(dateToJalali(component.selectedDate)).toEqual({ jy: 1404, jm: 12, jd: 29 });
  });

  it('navigates months in the Gregorian calendar', () => {
    component.setTab('gregorian');
    component.onYearChange('2026');
    component.onMonthChange('12');

    component.shiftMonth(1);

    expect(component.selectedMonth).toBe(1);
    expect(component.selectedYear).toBe(2027);
  });

  it('selects a day outside the current month and shifts the view', () => {
    fixture.detectChanges();
    const outside = fixture.nativeElement.querySelector('.calendar-day--muted') as HTMLButtonElement;
    const targetLabel = outside.textContent?.trim();
    const titleBefore = component.monthTitle;

    outside.click();
    fixture.detectChanges();

    expect(component.selectedDate).toBeTruthy();
    expect(component.monthTitle).not.toBe(titleBefore);
    expect(fixture.nativeElement.querySelectorAll('.calendar-day--selected').length).toBe(1);
    expect(targetLabel).toBeTruthy();
  });

  it('returns to today from the Today button', () => {
    component.shiftMonth(4);
    component.goToday();

    const today = new Date();
    expect(component.selectedDate.getFullYear()).toBe(today.getFullYear());
    expect(component.selectedDate.getMonth()).toBe(today.getMonth());
    expect(component.selectedDate.getDate()).toBe(today.getDate());
    expect(component.isSelectedToday).toBeTrue();
  });

  it('ignores an out of range month selection', () => {
    component.setTab('gregorian');
    component.onYearChange('2026');
    component.onMonthChange('5');
    const title = component.monthTitle;

    component.onMonthChange('13');

    expect(component.monthTitle).toBe(title);
  });

  it('exposes a six week grid in both tabs', () => {
    expect(component.month.weeks.length).toBe(6);
    expect(component.month.weeks.every(week => week.length === 7)).toBeTrue();

    component.setTab('gregorian');

    expect(component.month.weeks.length).toBe(6);
    expect(component.month.weeks.every(week => week.length === 7)).toBeTrue();
  });
});