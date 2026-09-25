import { DEFAULT_QR_MODEL, normalizeQrModel, toQrCodeOptions } from './qrcode-generator.utils';

describe('QR Code Generator utilities', () => {
  it('normalizes imported values and clamps unsafe settings', () => {
    const model = normalizeQrModel({
      data: 'hello',
      width: 5000,
      height: 1,
      margin: -4,
      shape: 'circle',
      qrOptions: { typeNumber: 100, mode: 'Numeric', errorCorrectionLevel: 'H' },
      imageOptions: { imageSize: 0.9, margin: 900 }
    });

    expect(model.data).toBe('hello');
    expect(model.width).toBe(1200);
    expect(model.height).toBe(100);
    expect(model.margin).toBe(0);
    expect(model.shape).toBe('circle');
    expect(model.qrOptions.mode).toBe('Numeric');
    expect(model.qrOptions.errorCorrectionLevel).toBe('H');
    expect(model.imageOptions.imageSize).toBe(0.5);
    expect(model.imageOptions.margin).toBe(100);
  });

  it('builds QRCodeStyling options for solid colors', () => {
    const options = toQrCodeOptions(DEFAULT_QR_MODEL);

    expect(options.type).toBe('svg');
    expect(options.data).toBe(DEFAULT_QR_MODEL.data);
    expect(options.dotsOptions?.gradient).toBeUndefined();
    expect(options.dotsOptions?.color).toBe('#0d6efd');
  });

  it('passes gradient and transparent background options through', () => {
    const model = normalizeQrModel({
      ...DEFAULT_QR_MODEL,
      dotsOptions: { ...DEFAULT_QR_MODEL.dotsOptions, colorType: 'gradient' },
      backgroundOptions: { ...DEFAULT_QR_MODEL.backgroundOptions, colorType: 'transparent' }
    });
    const options = toQrCodeOptions(model);

    expect(options.dotsOptions?.gradient?.colorStops.length).toBe(2);
    expect(options.backgroundOptions?.color).toBe('transparent');
  });
});
