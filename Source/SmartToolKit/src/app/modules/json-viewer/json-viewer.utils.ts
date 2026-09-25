export type JsonIndent = 2 | 4 | 'tab';

export interface JsonParseResult {
  value?: unknown;
  error?: string;
  line?: number;
  column?: number;
}

export interface JsonStats {
  rootType: string;
  characters: number;
  bytes: number;
  maxDepth: number;
  objectCount: number;
  arrayCount: number;
  keyCount: number;
  valueCount: number;
}

export interface JsonSearchResult {
  path: string;
  preview: string;
}

export function parseJson(source: string): JsonParseResult {
  if (!source.trim()) {
    return { error: 'Enter JSON to continue.' };
  }
  try {
    return { value: JSON.parse(source) as unknown };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON.';
    const positionMatch = /position\s+(\d+)/i.exec(message);
    const lineColumnMatch = /line\s+(\d+)\s+column\s+(\d+)/i.exec(message);
    const location = lineColumnMatch
      ? { line: Number(lineColumnMatch[1]), column: Number(lineColumnMatch[2]) }
      : positionMatch
        ? getPosition(source, Number(positionMatch[1]))
        : getLastTokenPosition(source);
    return { error: cleanJsonError(message), ...location };
  }
}

export function formatJson(source: string, indent: JsonIndent = 2, sortKeys = false): JsonParseResult & { content?: string } {
  const parsed = parseJson(source);
  if (parsed.error || parsed.value === undefined) {
    return parsed;
  }
  const value = sortKeys ? sortJsonValue(parsed.value) : parsed.value;
  return { ...parsed, content: JSON.stringify(value, null, indent === 'tab' ? '\t' : indent) };
}

export function minifyJson(source: string): JsonParseResult & { content?: string } {
  const parsed = parseJson(source);
  if (parsed.error || parsed.value === undefined) {
    return parsed;
  }
  return { ...parsed, content: JSON.stringify(parsed.value) };
}

export function getJsonStats(source: string, value?: unknown): JsonStats {
  const parsedValue = value === undefined ? parseJson(source).value : value;
  const stats: JsonStats = {
    rootType: getJsonType(parsedValue),
    characters: source.length,
    bytes: getByteLength(source),
    maxDepth: 0,
    objectCount: 0,
    arrayCount: 0,
    keyCount: 0,
    valueCount: 0
  };
  if (parsedValue !== undefined) {
    walkJson(parsedValue, 1, stats);
  }
  return stats;
}

export function searchJson(source: string, query: string, limit = 100): JsonSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }
  const parsed = parseJson(source);
  if (parsed.error || parsed.value === undefined) {
    return [];
  }
  const results: JsonSearchResult[] = [];
  collectMatches(parsed.value, normalizedQuery, '$', results, limit);
  return results;
}

function walkJson(value: unknown, depth: number, stats: JsonStats): void {
  stats.maxDepth = Math.max(stats.maxDepth, depth);
  if (Array.isArray(value)) {
    stats.arrayCount++;
    value.forEach(item => walkJson(item, depth + 1, stats));
    return;
  }
  if (isJsonObject(value)) {
    stats.objectCount++;
    for (const [key, child] of Object.entries(value)) {
      stats.keyCount++;
      walkJson(child, depth + 1, stats);
    }
    return;
  }
  stats.valueCount++;
}

function collectMatches(value: unknown, query: string, path: string, results: JsonSearchResult[], limit: number): void {
  if (results.length >= limit) {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectMatches(item, query, `${path}[${index}]`, results, limit));
    return;
  }
  if (isJsonObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      if (key.toLowerCase().includes(query)) {
        results.push({ path: childPath, preview: key });
      }
      collectMatches(child, query, childPath, results, limit);
    }
    return;
  }
  const preview = String(value);
  if (preview.toLowerCase().includes(query)) {
    results.push({ path, preview });
  }
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  if (isJsonObject(value)) {
    return Object.keys(value).sort().reduce<Record<string, unknown>>((sorted, key) => {
      sorted[key] = sortJsonValue(value[key]);
      return sorted;
    }, {});
  }
  return value;
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getJsonType(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}

function getByteLength(value: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }
  return value.length;
}

function getPosition(source: string, position: number): { line: number; column: number } {
  const beforeError = source.slice(0, position);
  const lines = beforeError.split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

function getLastTokenPosition(source: string): { line: number; column: number } {
  const lastToken = source.trimEnd();
  if (!lastToken) {
    return { line: 1, column: 1 };
  }
  const lines = lastToken.split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

function cleanJsonError(message: string): string {
  return message.replace(/^JSON\.parse:\s*/i, '').replace(/\s+in JSON at position\s+\d+$/i, '');
}
