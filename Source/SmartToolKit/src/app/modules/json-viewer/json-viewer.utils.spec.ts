import { formatJson, getJsonStats, minifyJson, parseJson, searchJson } from './json-viewer.utils';

describe('JSON Viewer utilities', () => {
  it('parses valid JSON and reports line and column for errors', () => {
    expect(parseJson('{"name":"Smart ToolKit"}').value).toEqual({ name: 'Smart ToolKit' });
    const invalid = parseJson('{\n  "name": }');

    expect(invalid.error).toBeTruthy();
    expect(invalid.line).toBe(2);
    expect(invalid.column).toBeGreaterThan(0);
  });

  it('formats with indentation and sorted keys', () => {
    const source = '{"z":1,"a":{"b":2}}';
    const formatted = formatJson(source, 2, true);

    expect(formatted.error).toBeUndefined();
    expect(formatted.content).toBe('{\n  "a": {\n    "b": 2\n  },\n  "z": 1\n}');
  });

  it('minifies JSON without changing values', () => {
    const result = minifyJson('{ "items": [1, 2, 3], "active": true }');

    expect(result.error).toBeUndefined();
    expect(result.content).toBe('{"items":[1,2,3],"active":true}');
  });

  it('calculates document statistics', () => {
    const stats = getJsonStats('{"a":[1,2],"b":{"c":true}}');

    expect(stats.rootType).toBe('object');
    expect(stats.objectCount).toBe(2);
    expect(stats.arrayCount).toBe(1);
    expect(stats.keyCount).toBe(3);
    expect(stats.valueCount).toBe(3);
    expect(stats.maxDepth).toBe(3);
  });

  it('searches keys and primitive values with paths', () => {
    const results = searchJson('{"user":{"name":"Sam"},"active":true}', 'sam');

    expect(results.length).toBe(1);
    expect(results[0].path).toBe('$.user.name');
    expect(results[0].preview).toBe('Sam');
  });
});
