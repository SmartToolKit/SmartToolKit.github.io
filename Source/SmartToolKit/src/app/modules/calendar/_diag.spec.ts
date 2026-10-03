import { dateToHijri, hijriMonthLength, hijriToDate, HIJRI_MONTH_NAMES_FA } from './calendar.utils';

describe('diag-hijri', () => {
  it('raw inspection', () => {
    console.log('DBG tzOffset:', new Date().getTimezoneOffset(), 'tz:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    const s = hijriToDate(1445, 9, 1);
    console.log('DBG 1445/9/1 =', s?.toDateString(), s?.getHours());
    const n30 = new Date(s!.getFullYear(), s!.getMonth(), s!.getDate() + 30);
    console.log('DBG +30 =', n30.toDateString(), JSON.stringify(dateToHijri(n30)));
    console.log('DBG len(1445,9) =', hijriMonthLength(1445, 9), 'len(1445,10) =', hijriMonthLength(1445, 10));
    console.log('DBG len(1445,1) =', hijriMonthLength(1445, 1));
    console.log('DBG monthnames[8] =', HIJRI_MONTH_NAMES_FA[8]);
    expect(true).toBeTrue();
  });
});