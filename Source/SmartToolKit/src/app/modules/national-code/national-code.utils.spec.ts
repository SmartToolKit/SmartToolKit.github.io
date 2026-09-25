import { generateNationalCode, generateNationalCodes, getNextNationalCode, nationalCodeCheckDigit, normalizeNationalCode, validateNationalCode } from './national-code.utils';

describe('Iranian national code utilities', () => {
  it('normalizes Persian and Arabic digits', () => {
    expect(normalizeNationalCode('۰۰۱۳۵۴۵۶۷۸')).toBe('0013545678');
    expect(normalizeNationalCode('٠١٢-٣ ٤٥٦٧٨')).toBe('012345678');
  });

  it('validates the checksum and rejects repeated digits', () => {
    const valid = `123456789${nationalCodeCheckDigit('123456789')}`;

    expect(validateNationalCode(valid).valid).toBeTrue();
    expect(validateNationalCode('1111111111').valid).toBeFalse();
    expect(validateNationalCode('123').valid).toBeFalse();
  });

  it('generates valid codes in bulk', () => {
    let seed = 0;
    const codes = generateNationalCodes(25, () => ((seed++ * 37) % 100) / 100);

    expect(codes.length).toBe(25);
    expect(new Set(codes).size).toBe(25);
    expect(codes.every(code => validateNationalCode(code).valid)).toBeTrue();
  });

  it('returns the next valid code from a valid code', () => {
    const current = generateNationalCode();
    const next = getNextNationalCode(current);

    expect(next.valid).toBeTrue();
    expect(validateNationalCode(next.normalized).valid).toBeTrue();
    expect(next.normalized).not.toBe(current);
  });
});
