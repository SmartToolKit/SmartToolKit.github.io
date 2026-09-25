import { Options, TypeNumber, ErrorCorrectionLevel, Mode } from 'qr-code-styling';

export type QrColorType = 'one' | 'gradient' | 'transparent';
export type QrGradientType = 'linear' | 'radial';
export type QrSection = 'Main Options' | 'QR Options' | 'Dots Options' | 'Corners Square Options' | 'Corners Dot Options' | 'Background Options' | 'Logo Options';

export interface QrColorStop {
  offset: number;
  color: string;
}

export interface QrGradient {
  type: QrGradientType;
  rotation: number;
  colorStops: QrColorStop[];
}

export interface QrStyleOptions {
  type: string;
  colorType: QrColorType;
  color: string;
  gradient: QrGradient;
}

export interface QrModel {
  width: number;
  height: number;
  data: string;
  margin: number;
  shape: 'square' | 'circle';
  imageName: string;
  image: string;
  qrOptions: {
    typeNumber: number;
    mode: Mode;
    errorCorrectionLevel: ErrorCorrectionLevel;
  };
  imageOptions: {
    hideBackgroundDots: boolean;
    imageSize: number;
    margin: number;
    crossOrigin: string;
  };
  dotsOptions: QrStyleOptions;
  cornersSquareOptions: QrStyleOptions;
  cornersDotOptions: QrStyleOptions;
  backgroundOptions: QrStyleOptions;
}

export const DEFAULT_QR_MODEL: QrModel = {
  width: 300,
  height: 300,
  data: 'https://smarttoolkit.github.io/',
  margin: 8,
  shape: 'square',
  imageName: '',
  image: '',
  qrOptions: {
    typeNumber: 0,
    mode: 'Byte',
    errorCorrectionLevel: 'Q'
  },
  imageOptions: {
    hideBackgroundDots: true,
    imageSize: 0.4,
    margin: 0,
    crossOrigin: 'anonymous'
  },
  dotsOptions: {
    type: 'rounded',
    colorType: 'one',
    color: '#0d6efd',
    gradient: createGradient('#0d6efd', '#ff009d')
  },
  cornersSquareOptions: {
    type: 'extra-rounded',
    colorType: 'one',
    color: '#0d6efd',
    gradient: createGradient('#0d6efd', '#ff009d')
  },
  cornersDotOptions: {
    type: 'dot',
    colorType: 'one',
    color: '#0d6efd',
    gradient: createGradient('#0d6efd', '#ff009d')
  },
  backgroundOptions: {
    type: '',
    colorType: 'one',
    color: '#ffffff',
    gradient: createGradient('#ffffff', '#80d2ff')
  }
};

export function toQrCodeOptions(model: QrModel): Options {
  return {
    type: 'svg',
    shape: model.shape,
    width: model.width,
    height: model.height,
    data: model.data,
    margin: model.margin,
    image: model.image || undefined,
    qrOptions: {
      typeNumber: model.qrOptions.typeNumber as TypeNumber,
      mode: model.qrOptions.mode,
      errorCorrectionLevel: model.qrOptions.errorCorrectionLevel
    },
    imageOptions: {
      hideBackgroundDots: model.imageOptions.hideBackgroundDots,
      imageSize: model.imageOptions.imageSize,
      margin: model.imageOptions.margin,
      crossOrigin: model.imageOptions.crossOrigin
    },
    dotsOptions: buildStyleOptions(model.dotsOptions) as NonNullable<Options['dotsOptions']>,
    cornersSquareOptions: buildStyleOptions(model.cornersSquareOptions) as NonNullable<Options['cornersSquareOptions']>,
    cornersDotOptions: buildStyleOptions(model.cornersDotOptions) as NonNullable<Options['cornersDotOptions']>,
    backgroundOptions: {
      ...buildStyleOptions(model.backgroundOptions),
      color: model.backgroundOptions.colorType === 'transparent' ? 'transparent' : model.backgroundOptions.color
    } as NonNullable<Options['backgroundOptions']>
  };
}

export function normalizeQrModel(value: unknown): QrModel {
  const source: Record<string, unknown> = isObject(value) ? value : {};
  const qrValue = source['qrOptions'];
  const imageValue = source['imageOptions'];
  const qr: Record<string, unknown> = isObject(qrValue) ? qrValue : {};
  const image: Record<string, unknown> = isObject(imageValue) ? imageValue : {};
  return {
    width: clampNumber(source['width'], 100, 1200, DEFAULT_QR_MODEL.width),
    height: clampNumber(source['height'], 100, 1200, DEFAULT_QR_MODEL.height),
    data: typeof source['data'] === 'string' ? source['data'].slice(0, 4096) : DEFAULT_QR_MODEL.data,
    margin: clampNumber(source['margin'], 0, 100, DEFAULT_QR_MODEL.margin),
    shape: source['shape'] === 'circle' ? 'circle' : 'square',
    imageName: typeof source['imageName'] === 'string' ? source['imageName'].slice(0, 160) : '',
    image: typeof source['image'] === 'string' ? source['image'] : '',
    qrOptions: {
      typeNumber: clampNumber(qr['typeNumber'], 0, 40, DEFAULT_QR_MODEL.qrOptions.typeNumber),
      mode: isMode(qr['mode']) ? qr['mode'] : DEFAULT_QR_MODEL.qrOptions.mode,
      errorCorrectionLevel: isErrorCorrectionLevel(qr['errorCorrectionLevel']) ? qr['errorCorrectionLevel'] : DEFAULT_QR_MODEL.qrOptions.errorCorrectionLevel
    },
    imageOptions: {
      hideBackgroundDots: typeof image['hideBackgroundDots'] === 'boolean' ? image['hideBackgroundDots'] : true,
      imageSize: clampNumber(image['imageSize'], 0.1, 0.5, 0.4),
      margin: clampNumber(image['margin'], 0, 100, 0),
      crossOrigin: image['crossOrigin'] === 'use-credentials' ? 'use-credentials' : 'anonymous'
    },
    dotsOptions: normalizeStyle(source['dotsOptions'], DEFAULT_QR_MODEL.dotsOptions),
    cornersSquareOptions: normalizeStyle(source['cornersSquareOptions'], DEFAULT_QR_MODEL.cornersSquareOptions),
    cornersDotOptions: normalizeStyle(source['cornersDotOptions'], DEFAULT_QR_MODEL.cornersDotOptions),
    backgroundOptions: normalizeStyle(source['backgroundOptions'], DEFAULT_QR_MODEL.backgroundOptions)
  };
}

export function createGradient(start: string, end: string): QrGradient {
  return {
    type: 'linear',
    rotation: 0,
    colorStops: [
      { offset: 0, color: start },
      { offset: 1, color: end }
    ]
  };
}

function buildStyleOptions(style: QrStyleOptions) {
  return {
    type: style.type || undefined,
    color: style.colorType === 'gradient' ? undefined : style.color,
    gradient: style.colorType === 'gradient' ? style.gradient : undefined
  };
}

function normalizeStyle(value: unknown, fallback: QrStyleOptions): QrStyleOptions {
  const source: Record<string, unknown> = isObject(value) ? value : {};
  const gradientValue = source['gradient'];
  const gradient: Record<string, unknown> = isObject(gradientValue) ? gradientValue : {};
  const colorStopsValue = gradient['colorStops'];
  const colorStops = Array.isArray(colorStopsValue) ? colorStopsValue : [];
  const stops = colorStops.filter(isObject).map(stop => ({
    offset: clampNumber(stop['offset'], 0, 1, 0),
    color: isColor(stop['color']) ? stop['color'] : '#000000'
  }));
  return {
    type: typeof source['type'] === 'string' ? source['type'] : fallback.type,
    colorType: isColorType(source['colorType']) ? source['colorType'] : fallback.colorType,
    color: isColor(source['color']) ? source['color'] : fallback.color,
    gradient: {
      type: gradient['type'] === 'radial' ? 'radial' : 'linear',
      rotation: clampNumber(gradient['rotation'], -Math.PI * 2, Math.PI * 2, 0),
      colorStops: stops.length >= 2 ? stops : createGradient(fallback.gradient.colorStops[0].color, fallback.gradient.colorStops[1].color).colorStops
    }
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isColor(value: unknown): value is string {
  return typeof value === 'string' && /^(#[0-9a-f]{3,8}|transparent|rgba?\([\d\s.,%]+\))$/i.test(value);
}

function isColorType(value: unknown): value is QrColorType {
  return value === 'one' || value === 'gradient' || value === 'transparent';
}

function isMode(value: unknown): value is Mode {
  return value === 'Numeric' || value === 'Alphanumeric' || value === 'Byte' || value === 'Kanji';
}

function isErrorCorrectionLevel(value: unknown): value is ErrorCorrectionLevel {
  return value === 'L' || value === 'M' || value === 'Q' || value === 'H';
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : fallback;
}
