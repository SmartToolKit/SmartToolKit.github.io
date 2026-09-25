export interface NationalCodeValidation {
  valid: boolean;
  normalized: string;
  message: string;
}

const ALL_SAME_DIGITS = /^\d{10}$/;

export function normalizeNationalCode(value: string): string {
  return value
    .replace(/[\u0660-\u0669]/g, digit => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, '')
    .slice(0, 10);
}

export function validateNationalCode(value: string): NationalCodeValidation {
  const normalized = normalizeNationalCode(value);
  if (!normalized) {
    return { valid: false, normalized, message: 'Enter a national code.' };
  }
  if (!ALL_SAME_DIGITS.test(normalized)) {
    return { valid: false, normalized, message: 'A national code must contain exactly 10 digits.' };
  }
  if (/^(\d)\1{9}$/.test(normalized)) {
    return { valid: false, normalized, message: 'A national code cannot contain the same digit repeated.' };
  }
  const checkDigit = Number(normalized[9]);
  const sum = normalized.slice(0, 9).split('').reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
  const remainder = sum % 11;
  const expected = remainder < 2 ? remainder : 11 - remainder;
  return checkDigit === expected
    ? { valid: true, normalized, message: 'The national code is valid.' }
    : { valid: false, normalized, message: 'The national code is not valid.' };
}

export function generateNationalCode(random: () => number = Math.random): string {
  let prefix = '';
  do {
    prefix = Array.from({ length: 9 }, () => Math.floor(random() * 10)).join('');
  } while (/^(\d)\1{8}$/.test(prefix));
  return `${prefix}${nationalCodeCheckDigit(prefix)}`;
}

export function generateNationalCodes(count: number, random: () => number = Math.random): string[] {
  const safeCount = Math.max(1, Math.min(1000, Math.floor(count)));
  const codes: string[] = [];
  const used = new Set<string>();
  while (codes.length < safeCount) {
    const code = generateNationalCode(random);
    if (!used.has(code)) {
      used.add(code);
      codes.push(code);
    }
  }
  return codes;
}

export function getNextNationalCode(value: string): NationalCodeValidation {
  const validation = validateNationalCode(value);
  if (!validation.valid) {
    return validation;
  }
  const prefix = (Number(validation.normalized.slice(0, 9)) + 1) % 1_000_000_000;
  let nextPrefix = String(prefix).padStart(9, '0');
  while (/^(\d)\1{8}$/.test(nextPrefix)) {
    nextPrefix = String((Number(nextPrefix) + 1) % 1_000_000_000).padStart(9, '0');
  }
  const next = `${nextPrefix}${nationalCodeCheckDigit(nextPrefix)}`;
  return { valid: true, normalized: next, message: 'The next valid national code is ready.' };
}

export function nationalCodeCheckDigit(prefix: string): number {
  const sum = prefix.split('').reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
  const remainder = sum % 11;
  return remainder < 2 ? remainder : 11 - remainder;
}
