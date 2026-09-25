import { XMLValidator } from 'fast-xml-parser';

export interface SvgParseResult {
  svg?: SVGSVGElement;
  source: string;
  warnings: string[];
  error?: string;
}

export interface SvgFormatResult {
  source: string;
  warnings: string[];
  error?: string;
}

export interface SvgLayer {
  id: string;
  name: string;
  tag: string;
  visible: boolean;
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const MAX_ELEMENTS = 2500;
const MAX_DEPTH = 80;
const BLOCKED_ELEMENTS = new Set([
  'animate', 'animatemotion', 'animatetransform', 'audio', 'canvas', 'embed', 'foreignobject', 'frame', 'frameset', 'iframe', 'object', 'script', 'set', 'style', 'video'
]);
const URL_ATTRIBUTES = new Set(['href', 'xlink:href', 'src', 'action', 'formaction']);
const DANGEROUS_VALUE = /(?:javascript\s*:|vbscript\s*:|data\s*:\s*text\/html|expression\s*\()/i;

export function parseAndSanitizeSvg(source: string): SvgParseResult {
  if (!source.trim()) {
    return { source: '', warnings: [], error: 'SVG source is empty.' };
  }
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) {
    return { source: '', warnings: [], error: 'DOCTYPE and entity declarations are not allowed.' };
  }

  const validation = XMLValidator.validate(source, { allowBooleanAttributes: true });
  if (validation !== true) {
    return {
      source: '',
      warnings: [],
      error: `Line ${validation.err.line}, column ${validation.err.col}: ${validation.err.msg}`
    };
  }

  const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
  const parserErrors = parsed.getElementsByTagName('parsererror');
  if (parserErrors.length > 0) {
    return { source: '', warnings: [], error: parserErrors[0].textContent?.trim() || 'Invalid SVG XML.' };
  }

  const root = parsed.documentElement;
  if (!root || root.localName.toLowerCase() !== 'svg' || root.namespaceURI !== SVG_NAMESPACE) {
    return { source: '', warnings: [], error: 'The document root must be an SVG element.' };
  }

  const warnings: string[] = [];
  const svg = document.importNode(root, true) as unknown as SVGSVGElement;
  try {
    sanitizeElement(svg, warnings, 0, { count: 0 });
  } catch (error) {
    return { source: '', warnings: uniqueWarnings(warnings), error: error instanceof Error ? error.message : 'Invalid SVG structure.' };
  }
  if (!svg.getAttribute('xmlns')) {
    svg.setAttribute('xmlns', SVG_NAMESPACE);
  }
  if (!svg.getAttribute('viewBox')) {
    warnings.push('The SVG has no viewBox; resizing behavior may be inconsistent.');
  }

  return {
    svg,
    source: serializeSvgElement(svg),
    warnings: uniqueWarnings(warnings)
  };
}

export function minifySvg(source: string): SvgFormatResult {
  const parsed = parseAndSanitizeSvg(source);
  if (parsed.error || !parsed.svg) {
    return { source: '', warnings: parsed.warnings, error: parsed.error };
  }

  minifyElement(parsed.svg);
  return { source: serializeSvgElement(parsed.svg), warnings: parsed.warnings };
}

export function formatSvg(source: string): SvgFormatResult {
  const parsed = parseAndSanitizeSvg(source);
  if (parsed.error || !parsed.svg) {
    return { source: '', warnings: parsed.warnings, error: parsed.error };
  }

  return { source: formatElement(parsed.svg, 0), warnings: parsed.warnings };
}

export function serializeSvgElement(svg: SVGSVGElement): string {
  return new XMLSerializer().serializeToString(svg);
}

export function getSvgLayerList(svg: SVGSVGElement): SvgLayer[] {
  const layers: SvgLayer[] = [];
  const elements = svg.querySelectorAll('*');
  for (const element of Array.from(elements)) {
    if (element instanceof SVGElement) {
      layers.push({
        id: element.id,
        name: element.id || element.getAttribute('aria-label') || element.localName,
        tag: element.localName,
        visible: element.getAttribute('display') !== 'none' && element.getAttribute('visibility') !== 'hidden'
      });
    }
  }
  return layers.reverse();
}

export function ensureSvgElementIds(svg: SVGSVGElement): Map<string, SVGElement> {
  const ids = new Map<string, SVGElement>();
  const elements = [svg, ...Array.from(svg.querySelectorAll('*'))].filter((element): element is SVGElement => element instanceof SVGElement);
  for (const element of elements) {
    if (element.id && !ids.has(element.id)) {
      ids.set(element.id, element);
    }
  }
  for (const element of elements) {
    let id = element.id;
    if (!id || ids.get(id) !== element) {
      id = createUniqueId(element.localName, ids);
      element.setAttribute('id', id);
    }
    ids.set(id, element);
  }
  return ids;
}

function sanitizeElement(element: SVGElement, warnings: string[], depth: number, state: { count: number }): void {
  state.count++;
  if (state.count > MAX_ELEMENTS) {
    throw new Error(`SVG contains more than ${MAX_ELEMENTS.toLocaleString('en-US')} elements.`);
  }
  if (depth > MAX_DEPTH) {
    throw new Error(`SVG nesting exceeds ${MAX_DEPTH.toLocaleString('en-US')} levels.`);
  }

  if (element.namespaceURI !== SVG_NAMESPACE) {
    element.remove();
    warnings.push('Removed an element outside the SVG namespace.');
    return;
  }

  const tag = element.localName.toLowerCase();
  if (BLOCKED_ELEMENTS.has(tag)) {
    element.remove();
    warnings.push(`Removed unsafe <${element.localName}> element.`);
    return;
  }

  if (tag === 'style' && isUnsafeStyle(element.textContent ?? '')) {
    element.remove();
    warnings.push('Removed a style block containing an unsafe CSS URL or expression.');
    return;
  }

  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase();
    const value = attribute.value.trim();
    if (name.startsWith('on') || name === 'xml:base' || name === 'seamless') {
      element.removeAttributeNode(attribute);
      warnings.push(`Removed unsafe ${attribute.name} attribute.`);
      continue;
    }
    if (URL_ATTRIBUTES.has(name) && !value.startsWith('#')) {
      element.removeAttributeNode(attribute);
      warnings.push(`Removed external ${attribute.name} reference.`);
      continue;
    }
    if (name === 'style' && isUnsafeStyle(value)) {
      element.removeAttributeNode(attribute);
      warnings.push(`Removed unsafe style from ${element.localName}.`);
      continue;
    }
    if (value.includes('\\')) {
      element.removeAttributeNode(attribute);
      warnings.push(`Removed escaped value from ${attribute.name}.`);
      continue;
    }
    if (hasUnsafeUrl(value)) {
      element.removeAttributeNode(attribute);
      warnings.push(`Removed unsafe URL from ${element.localName}.`);
      continue;
    }
    if (DANGEROUS_VALUE.test(value)) {
      element.removeAttributeNode(attribute);
      warnings.push(`Removed unsafe ${attribute.name} value.`);
    }
  }

  if (tag === 'image' && !element.getAttribute('href') && !element.getAttribute('xlink:href')) {
    element.remove();
    warnings.push('Removed an image without a safe local reference.');
    return;
  }

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.COMMENT_NODE) {
      child.parentNode?.removeChild(child);
    } else if (child instanceof Element) {
      if (child.namespaceURI !== SVG_NAMESPACE) {
        child.remove();
        warnings.push('Removed an element outside the SVG namespace.');
      } else if (child instanceof SVGElement) {
        sanitizeElement(child, warnings, depth + 1, state);
      }
    }
  }
}

function minifyElement(element: SVGElement): void {
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.COMMENT_NODE) {
      child.parentNode?.removeChild(child);
    } else if (child.nodeType === Node.TEXT_NODE) {
      const parentTag = element.localName.toLowerCase();
      if (!['text', 'textpath', 'tref', 'altglyph', 'tspan', 'style'].includes(parentTag)) {
        const value = (child.textContent ?? '').replace(/\s+/g, ' ');
        child.textContent = value.trim();
        if (!value.trim()) {
          child.parentNode?.removeChild(child);
        }
      }
    } else if (child instanceof SVGElement) {
      minifyElement(child);
    }
  }
}

function formatElement(element: SVGElement, depth: number): string {
  const tag = element.localName.toLowerCase();
  const attributes = Array.from(element.attributes)
    .map(attribute => ` ${attribute.name}="${escapeXml(attribute.value)}"`)
    .join('');
  const children = Array.from(element.childNodes).filter(child => child.nodeType !== Node.COMMENT_NODE);
  if (children.length === 0) {
    return `${'  '.repeat(depth)}<${element.nodeName}${attributes}/>`;
  }
  if (tag === 'text' || tag === 'tspan' || tag === 'style' || children.some(child => child.nodeType === Node.TEXT_NODE && (child.textContent ?? '').trim())) {
    const content = children.map(child => serializeChild(child)).join('');
    return `${'  '.repeat(depth)}<${element.nodeName}${attributes}>${content}</${element.nodeName}>`;
  }

  const formattedChildren = children
    .filter(child => child.nodeType === Node.ELEMENT_NODE)
    .map(child => formatElement(child as SVGElement, depth + 1));
  return `${'  '.repeat(depth)}<${element.nodeName}${attributes}>\n${formattedChildren.join('\n')}\n${'  '.repeat(depth)}</${element.nodeName}>`;
}

function serializeChild(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeXml(node.textContent ?? '');
  }
  return new XMLSerializer().serializeToString(node);
}

function isUnsafeStyle(value: string): boolean {
  return DANGEROUS_VALUE.test(value) || /@import\b/i.test(value) || hasUnsafeUrl(value);
}

function hasUnsafeUrl(value: string): boolean {
  const urls = value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi);
  for (const match of urls) {
    if (!match[2].trim().startsWith('#')) {
      return true;
    }
  }
  return false;
}

function uniqueWarnings(warnings: string[]): string[] {
  return Array.from(new Set(warnings));
}

function createUniqueId(tag: string, ids: Map<string, SVGElement>): string {
  let index = 1;
  let id = `${tag}-${index}`;
  while (ids.has(id)) {
    index++;
    id = `${tag}-${index}`;
  }
  return id;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
