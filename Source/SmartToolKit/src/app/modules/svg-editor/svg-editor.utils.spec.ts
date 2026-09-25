import {
  ensureSvgElementIds,
  formatSvg,
  getSvgLayerList,
  minifySvg,
  parseAndSanitizeSvg,
  serializeSvgElement
} from './svg-editor.utils';

describe('SVG Editor utilities', () => {
  it('parses and serializes a valid SVG', () => {
    const result = parseAndSanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="20" height="20" fill="red" /></svg>');

    expect(result.error).toBeUndefined();
    expect(result.svg).toBeDefined();
    expect(result.source).toContain('<rect');
    expect(result.source).toContain('fill="red"');
  });

  it('removes executable and external content', () => {
    const result = parseAndSanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" onload="alert(1)">
      <script>alert(1)</script>
      <rect width="20" height="20" fill="url(https://example.com/a.svg#x)" onclick="alert(2)" />
      <image href="https://example.com/image.png" />
      <style>@import url(https://example.com/style.css);</style>
    </svg>`);

    expect(result.error).toBeUndefined();
    expect(result.svg?.querySelector('script')).toBeNull();
    expect(result.svg?.querySelector('image')).toBeNull();
    expect(result.svg?.querySelector('style')).toBeNull();
    expect(result.svg?.getAttribute('onload')).toBeNull();
    expect(result.svg?.querySelector('rect')?.getAttribute('onclick')).toBeNull();
    expect(result.svg?.querySelector('rect')?.getAttribute('fill')).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('removes foreign namespaces and escaped URL values', () => {
    const result = parseAndSanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" xmlns:h="http://www.w3.org/1999/xhtml" viewBox="0 0 100 100"><h:img onerror="alert(1)" /><rect width="10" height="10" fill="u\\72l(https://example.com/a.svg#x)" /></svg>');

    expect(result.error).toBeUndefined();
    expect(result.svg?.querySelector('img')).toBeNull();
    expect(result.svg?.querySelector('rect')?.getAttribute('fill')).toBeNull();
  });

  it('rejects unsafe document declarations and non-SVG roots', () => {
    const declarationResult = parseAndSanitizeSvg('<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg" />');
    const rootResult = parseAndSanitizeSvg('<div>not svg</div>');

    expect(declarationResult.error).toContain('DOCTYPE');
    expect(rootResult.error).toContain('root');
  });

  it('formats and minifies without changing text content', () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g><text x="5" y="10">Hello  world</text></g></svg>';
    const formatted = formatSvg(source);
    const minified = minifySvg(source);

    expect(formatted.error).toBeUndefined();
    expect(formatted.source).toContain('\n');
    expect(minified.error).toBeUndefined();
    expect(minified.source).toContain('Hello  world');
    expect(minified.source.length).toBeLessThan(formatted.source.length);
  });

  it('assigns stable IDs and returns visual layers', () => {
    const result = parseAndSanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g><path d="M0 0L10 10" /></g></svg>');
    expect(result.svg).toBeDefined();
    if (!result.svg) {
      return;
    }

    const ids = ensureSvgElementIds(result.svg);
    const layers = getSvgLayerList(result.svg);

    expect(ids.size).toBe(3);
    expect(layers[0].tag).toBe('path');
    expect(serializeSvgElement(result.svg)).toContain('id="path-1"');
  });
});
