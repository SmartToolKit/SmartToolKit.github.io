export type BarcodeFormat =
  | 'CODE128'
  | 'CODE128A'
  | 'CODE128B'
  | 'CODE128C'
  | 'EAN13'
  | 'EAN8'
  | 'EAN5'
  | 'EAN2'
  | 'UPC'
  | 'CODE39'
  | 'ITF'
  | 'ITF14'
  | 'MSI'
  | 'MSI10'
  | 'MSI11'
  | 'MSI1010'
  | 'MSI1110'
  | 'pharmacode'
  | 'codabar';

export type BarcodeTextAlign = 'left' | 'center' | 'right';
export type BarcodeTextPosition = 'top' | 'bottom';

export interface BarcodeFormatOption {
  value: BarcodeFormat;
  label: string;
  description: string;
  placeholder: string;
  example: string;
}

export interface BarcodeModel {
  value: string;
  selectedFormat: BarcodeFormat;
  width: number;
  height: number;
  displayValue: boolean;
  lineColor: string;
  bgColor: string;
  margin: number;
  font: string;
  fontSize: number;
  fontOptions: string;
  textAlign: BarcodeTextAlign;
  textPosition: BarcodeTextPosition;
  textMargin: number;
}

export interface BarcodeValidation {
  valid: boolean;
  message: string;
}

const NUMBER_ONLY: Partial<Record<BarcodeFormat, { min: number; max: number }>> = {
  EAN13: { min: 12, max: 13 },
  EAN8: { min: 7, max: 8 },
  EAN5: { min: 4, max: 5 },
  EAN2: { min: 1, max: 2 },
  UPC: { min: 11, max: 12 },
  CODE128C: { min: 2, max: 256 },
  ITF: { min: 2, max: 256 },
  ITF14: { min: 13, max: 14 },
  MSI: { min: 2, max: 128 },
  MSI10: { min: 2, max: 128 },
  MSI11: { min: 2, max: 128 },
  MSI1010: { min: 2, max: 128 },
  MSI1110: { min: 2, max: 128 },
  pharmacode: { min: 3, max: 6 }
};

export const BARCODE_FORMAT_OPTIONS: BarcodeFormatOption[] = [
  { value: 'CODE128', label: 'CODE 128', description: 'Alphanumeric, universal', placeholder: 'SMART-2026', example: 'SMART-2026' },
  { value: 'CODE128A', label: 'CODE 128 A', description: 'Uppercase and control characters', placeholder: 'ABC-123', example: 'ABC-123' },
  { value: 'CODE128B', label: 'CODE 128 B', description: 'Full ASCII characters', placeholder: 'Smart-Toolkit', example: 'Smart-Toolkit' },
  { value: 'CODE128C', label: 'CODE 128 C', description: 'Even number of digits', placeholder: '12345678', example: '12345678' },
  { value: 'EAN13', label: 'EAN-13', description: 'European article number', placeholder: '4006381333931', example: '4006381333931' },
  { value: 'EAN8', label: 'EAN-8', description: 'Compact European article number', placeholder: '96385074', example: '96385074' },
  { value: 'EAN5', label: 'EAN-5', description: 'Five-digit numeric component', placeholder: '12345', example: '12345' },
  { value: 'EAN2', label: 'EAN-2', description: 'Two-digit numeric component', placeholder: '12', example: '12' },
  { value: 'UPC', label: 'UPC-A', description: 'Universal product code', placeholder: '036000291452', example: '036000291452' },
  { value: 'CODE39', label: 'CODE 39', description: 'Uppercase letters and digits', placeholder: 'TOOLKIT-2026', example: 'TOOLKIT-2026' },
  { value: 'ITF', label: 'ITF', description: 'Interleaved 2 of 5, even digits', placeholder: '1234567890', example: '1234567890' },
  { value: 'ITF14', label: 'ITF-14', description: 'GS1 logistics barcode', placeholder: '12345678901231', example: '12345678901231' },
  { value: 'MSI', label: 'MSI', description: 'Numeric inventory barcode', placeholder: '1234567890', example: '1234567890' },
  { value: 'MSI10', label: 'MSI-10', description: 'Modulo 10 checksum', placeholder: '1234567890', example: '1234567890' },
  { value: 'MSI11', label: 'MSI-11', description: 'Modulo 11 checksum', placeholder: '1234567890', example: '1234567890' },
  { value: 'MSI1010', label: 'MSI-10/10', description: 'Modulo 10 and 10 checksum', placeholder: '1234567890', example: '1234567890' },
  { value: 'MSI1110', label: 'MSI-11/10', description: 'Modulo 11 and 10 checksum', placeholder: '1234567890', example: '1234567890' },
  { value: 'pharmacode', label: 'Pharmacode', description: 'Numeric pharmaceutical code', placeholder: '1234', example: '1234' },
  { value: 'codabar', label: 'Codabar', description: 'Start/stop encoded values', placeholder: 'A123456A', example: 'A123456A' }
];

export const DEFAULT_BARCODE_MODEL: BarcodeModel = {
  value: 'Smart ToolKit',
  selectedFormat: 'CODE128',
  width: 2,
  height: 100,
  displayValue: true,
  lineColor: '#000000',
  bgColor: '#ffffff',
  margin: 10,
  font: 'monospace',
  fontSize: 20,
  fontOptions: 'bold',
  textAlign: 'center',
  textPosition: 'bottom',
  textMargin: 2
};

export function getBarcodeFormatOption(format: string): BarcodeFormatOption {
  return BARCODE_FORMAT_OPTIONS.find(option => option.value === format) ?? BARCODE_FORMAT_OPTIONS[0];
}

export function validateBarcodeValue(format: string, value: string): BarcodeValidation {
  const normalized = value.trim();
  const option = getBarcodeFormatOption(format);
  if (!normalized) {
    return { valid: false, message: `Enter a value for ${option.label}.` };
  }
  if (normalized.length > 256) {
    return { valid: false, message: 'Value must be 256 characters or fewer.' };
  }
  if (format === 'CODE39' && !/^[0-9A-Z. $/+%_-]+$/.test(normalized)) {
    return { valid: false, message: 'CODE 39 supports uppercase letters, digits, and . $ / + % _ -' };
  }
  if (format === 'codabar' && !/^[A-Da-d][0-9$-+. /:]+[A-Da-d]$/.test(normalized)) {
    return { valid: false, message: 'Codabar must start and end with A, B, C, or D.' };
  }
  if (format === 'CODE128A' && !/^[\x00-\x7F]*$/.test(normalized)) {
    return { valid: false, message: 'CODE 128 A supports ASCII characters only.' };
  }
  if (format === 'CODE128C' && !/^\d+$/.test(normalized)) {
    return { valid: false, message: 'CODE 128 C accepts digits only.' };
  }
  if (format === 'CODE128C' && normalized.length % 2 !== 0) {
    return { valid: false, message: 'CODE 128 C requires an even number of digits.' };
  }
  if (format === 'ITF' && (!/^\d+$/.test(normalized) || normalized.length % 2 !== 0)) {
    return { valid: false, message: 'ITF requires an even number of digits.' };
  }
  if (format === 'pharmacode' && (!/^\d+$/.test(normalized) || Number(normalized) < 3 || Number(normalized) > 131070)) {
    return { valid: false, message: 'Pharmacode must be a number between 3 and 131070.' };
  }
  const numericRange = NUMBER_ONLY[format as BarcodeFormat];
  if (numericRange) {
    if (!/^\d+$/.test(normalized)) {
      return { valid: false, message: `${option.label} accepts digits only.` };
    }
    if (normalized.length < numericRange.min || normalized.length > numericRange.max) {
      return { valid: false, message: `${option.label} requires ${numericRange.min === numericRange.max ? numericRange.min : `${numericRange.min}-${numericRange.max}`} digits.` };
    }
  }
  return { valid: true, message: `${option.label} is ready to generate.` };
}

export function normalizeBarcodeModel(value: unknown): BarcodeModel {
  const source = value && typeof value === 'object' ? value as Partial<BarcodeModel> : {};
  const selectedFormat = BARCODE_FORMAT_OPTIONS.some(option => option.value === source.selectedFormat) ? source.selectedFormat as BarcodeFormat : DEFAULT_BARCODE_MODEL.selectedFormat;
  return {
    value: typeof source.value === 'string' ? source.value.slice(0, 256) : DEFAULT_BARCODE_MODEL.value,
    selectedFormat,
    width: clampNumber(source.width, 1, 10, DEFAULT_BARCODE_MODEL.width),
    height: clampNumber(source.height, 20, 300, DEFAULT_BARCODE_MODEL.height),
    displayValue: typeof source.displayValue === 'boolean' ? source.displayValue : DEFAULT_BARCODE_MODEL.displayValue,
    lineColor: isColor(source.lineColor) ? source.lineColor : DEFAULT_BARCODE_MODEL.lineColor,
    bgColor: isColor(source.bgColor) ? source.bgColor : DEFAULT_BARCODE_MODEL.bgColor,
    margin: clampNumber(source.margin, 0, 50, DEFAULT_BARCODE_MODEL.margin),
    font: typeof source.font === 'string' ? source.font.slice(0, 40) : DEFAULT_BARCODE_MODEL.font,
    fontSize: clampNumber(source.fontSize, 8, 48, DEFAULT_BARCODE_MODEL.fontSize),
    fontOptions: typeof source.fontOptions === 'string' ? source.fontOptions.slice(0, 20) : DEFAULT_BARCODE_MODEL.fontOptions,
    textAlign: isTextAlign(source.textAlign) ? source.textAlign : DEFAULT_BARCODE_MODEL.textAlign,
    textPosition: isTextPosition(source.textPosition) ? source.textPosition : DEFAULT_BARCODE_MODEL.textPosition,
    textMargin: clampNumber(source.textMargin, 0, 30, DEFAULT_BARCODE_MODEL.textMargin)
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : fallback;
}

function isColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value);
}

function isTextAlign(value: unknown): value is BarcodeTextAlign {
  return value === 'left' || value === 'center' || value === 'right';
}

function isTextPosition(value: unknown): value is BarcodeTextPosition {
  return value === 'top' || value === 'bottom';
}
