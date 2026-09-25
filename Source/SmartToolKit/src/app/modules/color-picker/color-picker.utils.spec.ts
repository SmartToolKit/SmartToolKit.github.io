import {
  formatColorValue,
  getColorFormats,
  getContrastLevel,
  getContrastRatio,
  getColorName,
  parseColor,
  parseHexColor,
  rgbToCmyk,
  rgbToHsl,
  rgbToHsv
} from './color-picker.utils';

describe('Color Picker utilities', () => {
  it('normalizes shorthand and alpha hex values', () => {
    expect(parseHexColor('#abc')).toEqual({ r: 170, g: 187, b: 204, a: 1 });
    expect(parseHexColor('#1234')).toEqual({ r: 17, g: 34, b: 51, a: 68 / 255 });
    expect(parseHexColor('#e3096f')).toEqual({ r: 227, g: 9, b: 111, a: 1 });
    expect(parseHexColor('#e3096f80')).toEqual({ r: 227, g: 9, b: 111, a: 128 / 255 });
  });

  it('rejects malformed values instead of producing NaN colors', () => {
    expect(parseColor('#12', 'hex')).toBeNull();
    expect(parseColor('rgb(nope, 2, 3)', 'rgba')).toBeNull();
    expect(parseColor('rgb(10foo, 0, 0)', 'rgba')).toBeNull();
    expect(parseColor('rgb(1,,2,3)', 'rgba')).toBeNull();
    expect(parseColor('rgb(300, 0, 0)', 'rgba')).toBeNull();
    expect(parseColor('hsl(nope, 20%, 30%)', 'hsla')).toBeNull();
    expect(parseColor('hsl(0.5TURN, 100%, 50%)', 'hsla')?.r).toBe(0);
    expect(parseColor('cmyk(1, nope, 0%, 0%)', 'cmyk')).toBeNull();
    expect(parseColor('cmyk(101%, 0%, 0%, 0%)', 'cmyk')).toBeNull();
  });

  it('parses supported color formats and preserves alpha', () => {
    const rgba = parseColor('rgba(227, 9, 111, 0.5)', 'rgba');
    const hsla = parseColor('hsla(332, 92%, 46%, 0.5)', 'hsla');
    const hsva = parseColor('hsva(332, 96%, 89%, 50%)', 'hsva');
    const cmyk = parseColor('cmyk(0%, 96%, 51%, 11%)', 'cmyk');

    expect(rgba).toEqual({ r: 227, g: 9, b: 111, a: 0.5 });
    expect(Math.abs((hsla?.r ?? 0) - 227)).toBeLessThan(3);
    expect(hsla?.g).toBe(9);
    expect(Math.abs((hsla?.b ?? 0) - 111)).toBeLessThan(3);
    expect(hsla?.a).toBe(0.5);
    expect(hsva?.r).toBe(227);
    expect(cmyk?.r).toBe(227);
  });

  it('produces stable values for every supported format', () => {
    const color = parseHexColor('#e3096f')!;
    const formats = getColorFormats(color);

    expect(formats.hex).toBe('#e3096f');
    expect(formats.rgba).toBe('rgba(227, 9, 111, 1)');
    expect(formats.hsla).toBe('hsla(332, 92%, 46%, 1)');
    expect(formats.hsva).toBe('hsva(332, 96%, 89%, 1)');
    expect(formats.cmyk).toBe('cmyk(0%, 96%, 51%, 11%)');
    expect(formatColorValue({ ...color, a: 0.5 }, 'hex')).toBe('#e3096f80');
  });

  it('calculates contrast levels', () => {
    const white = { r: 255, g: 255, b: 255, a: 1 };
    const black = { r: 0, g: 0, b: 0, a: 1 };
    const ratio = getContrastRatio(white, black);

    expect(ratio).toBe(21);
    expect(getContrastLevel(ratio)).toBe('AAA');
    expect(getContrastLevel(4.5)).toBe('AA');
    expect(getContrastLevel(3)).toBe('AA Large');
    expect(getContrastRatio({ r: 0, g: 0, b: 0, a: 0 }, { r: 40, g: 43, b: 47, a: 1 })).toBe(1);
  });

  it('supports named colors and conversion helpers', () => {
    expect(parseColor('transparent', 'hex')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(getColorName({ r: 0, g: 0, b: 0, a: 0 })).toBe('Transparent');
    expect(rgbToHsl({ r: 255, g: 0, b: 0, a: 1 }).h).toBe(0);
    expect(rgbToHsv({ r: 0, g: 255, b: 0, a: 1 }).h).toBe(120);
    expect(rgbToCmyk({ r: 0, g: 0, b: 0, a: 1 }).k).toBe(1);
  });
});
