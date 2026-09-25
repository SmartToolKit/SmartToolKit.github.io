import { BARCODE_FORMAT_OPTIONS, DEFAULT_BARCODE_MODEL, getBarcodeFormatOption, normalizeBarcodeModel, validateBarcodeValue } from './barcode-generator.utils';

describe('Barcode Generator utilities', () => {
  it('exposes the supported JsBarcode formats', () => {
    expect(BARCODE_FORMAT_OPTIONS.length).toBeGreaterThan(10);
    expect(getBarcodeFormatOption('EAN13').label).toBe('EAN-13');
    expect(getBarcodeFormatOption('unknown').value).toBe('CODE128');
  });

  it('validates empty and general values', () => {
    expect(validateBarcodeValue('CODE128', '').valid).toBeFalse();
    expect(validateBarcodeValue('CODE128', 'Smart-Toolkit').valid).toBeTrue();
    expect(validateBarcodeValue('CODE128', 'x'.repeat(257)).valid).toBeFalse();
  });

  it('validates numeric and checksum formats', () => {
    expect(validateBarcodeValue('EAN13', '4006381333931').valid).toBeTrue();
    expect(validateBarcodeValue('EAN13', '123').valid).toBeFalse();
    expect(validateBarcodeValue('ITF', '12345').valid).toBeFalse();
    expect(validateBarcodeValue('ITF', '1234').valid).toBeTrue();
    expect(validateBarcodeValue('pharmacode', '999999').valid).toBeFalse();
  });

  it('validates format-specific character sets', () => {
    expect(validateBarcodeValue('CODE39', 'TOOLKIT-2026').valid).toBeTrue();
    expect(validateBarcodeValue('CODE39', 'lowercase').valid).toBeFalse();
    expect(validateBarcodeValue('codabar', 'A123456A').valid).toBeTrue();
    expect(validateBarcodeValue('codabar', '123456').valid).toBeFalse();
  });

  it('normalizes imported settings and clamps unsafe values', () => {
    const model = normalizeBarcodeModel({ value: '1234', selectedFormat: 'EAN8', width: 999, height: -4, bgColor: 'red', textAlign: 'right' });

    expect(model.value).toBe('1234');
    expect(model.selectedFormat).toBe('EAN8');
    expect(model.width).toBe(10);
    expect(model.height).toBe(20);
    expect(model.bgColor).toBe(DEFAULT_BARCODE_MODEL.bgColor);
    expect(model.textAlign).toBe('right');
  });
});
