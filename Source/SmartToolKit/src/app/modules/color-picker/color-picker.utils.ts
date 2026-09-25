export type ColorFormat = 'hex' | 'rgba' | 'hsla' | 'hsva' | 'cmyk';

export interface RgbaValue {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HslValue {
  h: number;
  s: number;
  l: number;
  a: number;
}

export interface HsvValue {
  h: number;
  s: number;
  v: number;
  a: number;
}

export interface CmykValue {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface ColorDrafts {
  hex: string;
  rgba: string;
  hsla: string;
  hsva: string;
  cmyk: string;
}

export interface ColorFormats extends ColorDrafts {
  name: string;
}

const NAMED_COLORS: Record<string, string> = {
  transparent: '#00000000',
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  orange: '#ffa500',
  purple: '#800080',
  pink: '#ffc0cb',
  gray: '#808080',
  grey: '#808080',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  navy: '#000080',
  teal: '#008080',
  olive: '#808000',
  maroon: '#800000',
  lime: '#00ff00'
};

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function normalizeRgba(value: RgbaValue): RgbaValue {
  return {
    r: Math.round(clamp(Number.isFinite(value.r) ? value.r : 0, 0, 255)),
    g: Math.round(clamp(Number.isFinite(value.g) ? value.g : 0, 0, 255)),
    b: Math.round(clamp(Number.isFinite(value.b) ? value.b : 0, 0, 255)),
    a: clamp(Number.isFinite(value.a) ? value.a : 1, 0, 1)
  };
}

export function parseHexColor(value: string): RgbaValue | null {
  const normalized = value.trim().replace(/^#/, '');
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(normalized)) {
    return null;
  }

  const expanded = normalized.length <= 4
    ? normalized.split('').map(character => `${character}${character}`).join('')
    : normalized;
  const hasAlpha = expanded.length === 8;
  return normalizeRgba({
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
    a: hasAlpha ? parseInt(expanded.slice(6, 8), 16) / 255 : 1
  });
}

export function parseColor(value: string, format: ColorFormat): RgbaValue | null {
  const trimmed = value.trim();
  if (format === 'hex') {
    return parseHexColor(trimmed) ?? parseNamedColor(trimmed);
  }

  const namedColor = parseNamedColor(trimmed);
  if (namedColor) {
    return namedColor;
  }

  let parsed: RgbaValue | null;
  if (format === 'rgba') {
    parsed = parseRgba(trimmed);
  } else if (format === 'hsla') {
    parsed = parseHsla(trimmed);
  } else if (format === 'hsva') {
    parsed = parseHsva(trimmed);
  } else {
    parsed = parseCmyk(trimmed);
  }

  return parsed && isValidRgba(parsed) && isRgbaInRange(parsed) ? normalizeRgba(parsed) : null;
}

export function rgbaToHex(value: RgbaValue, includeAlpha = false): string {
  const color = normalizeRgba(value);
  const rgb = [color.r, color.g, color.b].map(channel => channel.toString(16).padStart(2, '0')).join('');
  if (!includeAlpha) {
    return `#${rgb}`;
  }
  return `#${rgb}${Math.round(color.a * 255).toString(16).padStart(2, '0')}`;
}

export function rgbToHsl(value: RgbaValue): HslValue {
  const color = normalizeRgba(value);
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) {
      h = (g - b) / delta + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h /= 6;
  }

  return { h: h * 360, s, l, a: color.a };
}

export function rgbToHsv(value: RgbaValue): HsvValue {
  const color = normalizeRgba(value);
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta !== 0) {
    if (max === r) {
      h = (g - b) / delta + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h /= 6;
  }

  return { h: h * 360, s, v, a: color.a };
}

export function rgbToCmyk(value: RgbaValue): CmykValue {
  const color = normalizeRgba(value);
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 1 };
  }
  return {
    c: (1 - r - k) / (1 - k),
    m: (1 - g - k) / (1 - k),
    y: (1 - b - k) / (1 - k),
    k
  };
}

export function hslToRgb(value: HslValue): RgbaValue {
  const h = normalizeHue(value.h);
  const s = clamp(value.s, 0, 1);
  const l = clamp(value.l, 0, 1);
  if (s === 0) {
    const channel = Math.round(l * 255);
    return { r: channel, g: channel, b: channel, a: clamp(value.a, 0, 1) };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h) * 255),
    b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
    a: clamp(value.a, 0, 1)
  };
}

export function hsvToRgb(value: HsvValue): RgbaValue {
  const h = normalizeHue(value.h);
  const s = clamp(value.s, 0, 1);
  const v = clamp(value.v, 0, 1);
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = v;
  let g = t;
  let b = p;

  switch (i % 6) {
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: clamp(value.a, 0, 1)
  };
}

export function cmykToRgb(value: CmykValue): RgbaValue {
  const c = clamp(value.c, 0, 1);
  const m = clamp(value.m, 0, 1);
  const y = clamp(value.y, 0, 1);
  const k = clamp(value.k, 0, 1);
  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
    a: 1
  };
}

export function formatColorValue(value: RgbaValue, format: ColorFormat): string {
  const color = normalizeRgba(value);
  if (format === 'hex') {
    return rgbaToHex(color, color.a < 1);
  }
  if (format === 'rgba') {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${formatAlpha(color.a)})`;
  }
  if (format === 'hsla') {
    const hsl = rgbToHsl(color);
    return `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%, ${formatAlpha(hsl.a)})`;
  }
  if (format === 'hsva') {
    const hsv = rgbToHsv(color);
    return `hsva(${Math.round(hsv.h)}, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%, ${formatAlpha(hsv.a)})`;
  }
  const cmyk = rgbToCmyk(color);
  return `cmyk(${Math.round(cmyk.c * 100)}%, ${Math.round(cmyk.m * 100)}%, ${Math.round(cmyk.y * 100)}%, ${Math.round(cmyk.k * 100)}%)`;
}

export function getColorFormats(value: RgbaValue): ColorFormats {
  return {
    hex: formatColorValue(value, 'hex'),
    rgba: formatColorValue(value, 'rgba'),
    hsla: formatColorValue(value, 'hsla'),
    hsva: formatColorValue(value, 'hsva'),
    cmyk: formatColorValue(value, 'cmyk'),
    name: getColorName(value)
  };
}

export function getLuminance(value: RgbaValue): number {
  const color = normalizeRgba(value);
  const convert = (channel: number): number => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * convert(color.r) + 0.7152 * convert(color.g) + 0.0722 * convert(color.b);
}

export function compositeRgba(foreground: RgbaValue, backdrop: RgbaValue): RgbaValue {
  const front = normalizeRgba(foreground);
  const back = normalizeRgba(backdrop);
  const alpha = front.a + back.a * (1 - front.a);
  if (alpha === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  return {
    r: (front.r * front.a + back.r * back.a * (1 - front.a)) / alpha,
    g: (front.g * front.a + back.g * back.a * (1 - front.a)) / alpha,
    b: (front.b * front.a + back.b * back.a * (1 - front.a)) / alpha,
    a: alpha
  };
}

export function getContrastRatio(first: RgbaValue, second: RgbaValue): number {
  const firstColor = compositeRgba(first, second);
  const secondColor = compositeRgba(second, { r: 255, g: 255, b: 255, a: 1 });
  const firstLuminance = getLuminance(firstColor);
  const secondLuminance = getLuminance(secondColor);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

export function getContrastText(value: RgbaValue, backdrop?: RgbaValue): '#000000' | '#ffffff' {
  const black: RgbaValue = { r: 0, g: 0, b: 0, a: 1 };
  const white: RgbaValue = { r: 255, g: 255, b: 255, a: 1 };
  const background = compositeRgba(value, backdrop ?? white);
  return getContrastRatio(background, black) >= getContrastRatio(background, white) ? '#000000' : '#ffffff';
}

export function getContrastLevel(ratio: number): string {
  if (ratio >= 7) {
    return 'AAA';
  }
  if (ratio >= 4.5) {
    return 'AA';
  }
  if (ratio >= 3) {
    return 'AA Large';
  }
  return 'Fail';
}

export function getColorName(value: RgbaValue): string {
  if (normalizeRgba(value).a === 0) {
    return 'Transparent';
  }
  const hex = rgbaToHex(value, false).toLowerCase();
  const entry = Object.entries(NAMED_COLORS).find(([, color]) => color.toLowerCase() === hex);
  return entry?.[0] ?? 'Custom color';
}

function isValidRgba(value: RgbaValue): boolean {
  return [value.r, value.g, value.b, value.a].every(Number.isFinite);
}

function isRgbaInRange(value: RgbaValue): boolean {
  return [value.r, value.g, value.b].every(channel => channel >= 0 && channel <= 255) && value.a >= 0 && value.a <= 1;
}

function isUnitInterval(value: number): boolean {
  return value >= 0 && value <= 1;
}

function parseNamedColor(value: string): RgbaValue | null {
  const named = NAMED_COLORS[value.toLowerCase()];
  return named ? parseHexColor(named) : null;
}

function parseRgba(value: string): RgbaValue | null {
  const parts = parseFunctionParts(value, 'rgba?');
  if (!parts || (parts.length !== 3 && parts.length !== 4)) {
    return null;
  }
  const color = {
    r: parseRgbChannel(parts[0]),
    g: parseRgbChannel(parts[1]),
    b: parseRgbChannel(parts[2]),
    a: parts[3] === undefined ? 1 : parseAlpha(parts[3])
  };
  return isValidRgba(color) ? color : null;
}

function parseHsla(value: string): RgbaValue | null {
  const parts = parseFunctionParts(value, 'hsla?');
  if (!parts || (parts.length !== 3 && parts.length !== 4)) {
    return null;
  }
  const color = {
    h: parseAngle(parts[0]),
    s: parsePercentage(parts[1]),
    l: parsePercentage(parts[2]),
    a: parts[3] === undefined ? 1 : parseAlpha(parts[3])
  };
  return [color.h, color.s, color.l, color.a].every(Number.isFinite) && isUnitInterval(color.s) && isUnitInterval(color.l) && isUnitInterval(color.a)
    ? hslToRgb({ h: color.h, s: color.s, l: color.l, a: color.a })
    : null;
}

function parseHsva(value: string): RgbaValue | null {
  const parts = parseFunctionParts(value, 'hsva?');
  if (!parts || (parts.length !== 3 && parts.length !== 4)) {
    return null;
  }
  const color = {
    h: parseAngle(parts[0]),
    s: parsePercentage(parts[1]),
    v: parsePercentage(parts[2]),
    a: parts[3] === undefined ? 1 : parseAlpha(parts[3])
  };
  return [color.h, color.s, color.v, color.a].every(Number.isFinite) && isUnitInterval(color.s) && isUnitInterval(color.v) && isUnitInterval(color.a)
    ? hsvToRgb({ h: color.h, s: color.s, v: color.v, a: color.a })
    : null;
}

function parseCmyk(value: string): RgbaValue | null {
  const parts = parseFunctionParts(value, 'cmyk');
  if (!parts || parts.length !== 4) {
    return null;
  }
  const color = {
    c: parsePercentage(parts[0]),
    m: parsePercentage(parts[1]),
    y: parsePercentage(parts[2]),
    k: parsePercentage(parts[3])
  };
  return [color.c, color.m, color.y, color.k].every(Number.isFinite) && [color.c, color.m, color.y, color.k].every(isUnitInterval)
    ? cmykToRgb(color)
    : null;
}

function parseFunctionParts(value: string, functionName: string): string[] | null {
  const match = value.match(new RegExp(`^${functionName}\\((.*)\\)$`, 'i'));
  if (!match) {
    return null;
  }

  const body = match[1].replace(/\s*\/\s*/g, ', ').replace(/[;]/g, ',').trim();
  if (!body) {
    return null;
  }

  const parts: string[] = [];
  for (const segment of body.split(',')) {
    const trimmedSegment = segment.trim();
    if (!trimmedSegment) {
      return null;
    }
    const values = trimmedSegment.split(/\s+/);
    if (values.some(part => !part)) {
      return null;
    }
    parts.push(...values);
  }
  return parts;
}

function parseRgbChannel(value: string): number {
  const numeric = parseNumeric(value);
  const unit = value.trim().toLowerCase().match(/[a-z%]+$/)?.[0] ?? '';
  if (numeric === null || (unit && unit !== '%')) {
    return Number.NaN;
  }
  return unit === '%' ? numeric / 100 * 255 : numeric;
}

function parsePercentage(value: string): number {
  const numeric = parseNumeric(value);
  const unit = value.trim().toLowerCase().match(/[a-z%]+$/)?.[0] ?? '';
  if (numeric === null || (unit && unit !== '%')) {
    return Number.NaN;
  }
  if (unit === '%') {
    return numeric / 100;
  }
  return numeric <= 1 ? numeric : numeric / 100;
}

function parseAlpha(value: string): number {
  const numeric = parseNumeric(value);
  const unit = value.trim().toLowerCase().match(/[a-z%]+$/)?.[0] ?? '';
  if (numeric === null || (unit && unit !== '%')) {
    return Number.NaN;
  }
  return unit === '%' ? numeric / 100 : numeric;
}

function parseNumeric(value: string): number | null {
  const match = value.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(?:%|deg|grad|rad|turn)?$/i);
  if (!match) {
    return null;
  }
  const numeric = Number(match[1]);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseAngle(value: string): number {
  const numeric = parseNumeric(value);
  if (numeric === null) {
    return Number.NaN;
  }
  const unit = value.trim().toLowerCase().match(/(deg|grad|rad|turn)$/)?.[1];
  if (unit === 'turn') {
    return numeric * 360;
  }
  if (unit === 'rad') {
    return numeric * 180 / Math.PI;
  }
  if (unit === 'grad') {
    return numeric * 0.9;
  }
  return numeric;
}

function normalizeHue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return ((value % 360) + 360) % 360 / 360;
}

function hueToRgb(p: number, q: number, t: number): number {
  let hue = t;
  if (hue < 0) {
    hue += 1;
  }
  if (hue > 1) {
    hue -= 1;
  }
  if (hue < 1 / 6) {
    return p + (q - p) * 6 * hue;
  }
  if (hue < 1 / 2) {
    return q;
  }
  if (hue < 2 / 3) {
    return p + (q - p) * (2 / 3 - hue) * 6;
  }
  return p;
}

function formatAlpha(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}
